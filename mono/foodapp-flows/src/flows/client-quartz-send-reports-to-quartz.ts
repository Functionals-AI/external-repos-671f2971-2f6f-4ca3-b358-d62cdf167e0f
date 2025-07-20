import { ok, err } from 'neverthrow'
import { Logger } from '@mono/common'
import { workflow, task, JsonObject } from '@mono/common-flows/lib/builder'
import { ErrCode } from '@mono/common/lib/error'
import { listFiles, getFileContent, moveFileToFolder } from '@mono/common/lib/service/google/drive'
import Gpg, { EncryptKeys } from '@mono/common-flows/lib/tasks/encryption/gpg'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import * as _ from 'lodash'
import * as path from 'path'
import { Readable } from 'node:stream'
import * as SFTPClient from 'ssh2-sftp-client'
import * as url from 'url'

const MTAG = Logger.tag()

enum State {
  PullFileForQuartz = 'PullFileForQuartz',
  EncryptQuartzFile = 'EncryptQuartzFile', 
  SendFileToQuartz = 'SendFileToQuartz',

  Success = 'Success',
}

export default workflow(function(config) {
  return {
    // convert EST 1:45PM to UTC is 5:45PM
    cron: '45 17 * * ? *',
    startAt: State.PullFileForQuartz,
    states: {
      [State.PullFileForQuartz]: task({
        handler: async (context, input) => {
          const { logger, config } = context
          const TAG = [ ...MTAG, 'PullFileForQuartz' ]

          const { 
            // @ts-ignore
            sharedDriveFolderId, quartzOutFolderId, quartzOutArchivedFolderId 
          } = config.foodapp?.eligibility.googleDrive

          // look for out files for quartz, and send
          try {
            const listQuartzOutFilesResult = await listFiles(context, { sharedDriveFolderId, folderId: quartzOutFolderId })
            // handle Quartz file
            if (listQuartzOutFilesResult.isOk()) {
              if (listQuartzOutFilesResult.value.length === 0) {
                logger.info(context, TAG, 'No new file in Quartz OUT folder.')
                return err(ErrCode.SERVICE)
              } else {
                // read file content and send to vendor's SFTP server
                const textsAndFileNames : JsonObject[] = []
                for (let file of listQuartzOutFilesResult.value) {
                  const getFileContentResult = await getFileContent(context, file.fileId as string)
                  if (!getFileContentResult.isOk()) {
                    logger.error(context, TAG, `Error getting file content from google drive - fileId: ${file.fileId}`)
                    return err(ErrCode.SERVICE)
                  }
                  // move file to /ARCHIVED
                  const moveFileToQuartzOutArchiveResult = await moveFileToFolder(context, file.fileId as string, quartzOutArchivedFolderId)
                  if (moveFileToQuartzOutArchiveResult.isOk()) {
                    logger.info(context, TAG, `moveFileToQuartzOutArchiveResult is - ${moveFileToQuartzOutArchiveResult.value}`)
                  }
  
                  logger.info(context, TAG, `File content is - ${getFileContentResult.value}`)

                  const textAndFileName = {
                    text: getFileContentResult.value.toString(),
                    fileName: file.fileName as string
                  }
                  logger.info(context, TAG, `textAndFileName is - ${textAndFileName}`)

                  textsAndFileNames.push(textAndFileName)

                }

                return ok({textsAndFileNames})
              }
            } else {
              logger.info(context, TAG, `Error listing files in Quartz OUT folder`)
              return err(ErrCode.SERVICE)
            }                 
          } catch (e) {
            logger.exception(context, TAG, e)
            return err(ErrCode.EXCEPTION)
          } 
        },
        next: State.EncryptQuartzFile,
      }),
      [State.EncryptQuartzFile]: Gpg.encryptMultiple({
        key: EncryptKeys.Quartz,
        fileName: 'TOC_Report_|MMddyyyy|.csv.pgp', // this is not going to be needed for this flow
        next: State.SendFileToQuartz,
      }),
      [State.SendFileToQuartz]: task({
        handler: async (context, input) => {
          const { aws: { s3Client }, logger, config } = context
          const TAG = [ ...MTAG, 'SendFileToQuartz' ]

          const files = input['file'] as string[]

          const parsedS3Uris: url.URL[] = []

          for (let file of files) {
            const s3Uri = `s3://${file}`

            if (!_.isEmpty(s3Uri) && s3Uri.startsWith('s3://')) {
              const parsedS3Uri = new url.URL(s3Uri)
  
              if (parsedS3Uri && parsedS3Uri.hostname && parsedS3Uri.pathname) {
                parsedS3Uris.push(parsedS3Uri)
              }
              else {
                logger.error(context, TAG, `S3 URI error, s3 URI - ${s3Uri}...`)
                return err(ErrCode.INVALID_S3_URI)
              }
            }
            else {
              logger.error(context, TAG, `Invalid argument. Expected s3 URI, received - ${s3Uri}...`)
              return err(ErrCode.INVALID_S3_URI)
            }
          }

          let sftp:SFTPClient = null

          try {
            sftp = new SFTPClient()

            logger.info(context, TAG, 'Connecting...')

            await sftp.connect(config.foodapp?.foodVendor.quartz.sftp)

            for (let parsedS3Uri of parsedS3Uris) {
              logger.info(context, TAG, 'Processing S3 object', {
                bucket: parsedS3Uri.hostname,
                key: parsedS3Uri.pathname
              })

              const s3GetCommand = new GetObjectCommand({
                Bucket: parsedS3Uri.hostname,
                Key: parsedS3Uri.pathname.slice(1),
              })
          
              const s3EncryptedItem = await s3Client.send(s3GetCommand)
              const encryptedFile = s3EncryptedItem.Body

              if (encryptedFile === undefined || !(encryptedFile instanceof Readable)) {
                sftp.end()
                return err(ErrCode.SERVICE)
              }

              const REMOTE_UPLOAD_FOLDER = '/Foodsmart Incoming and Foodsma'
              const dstPath = `${REMOTE_UPLOAD_FOLDER}/${path.basename(parsedS3Uri.pathname)}`

              try {
                logger.info(context, TAG, `Initiating SFTP put.`, {
                  s3_hostname: parsedS3Uri.hostname,
                  s3_pathname: parsedS3Uri.pathname,
                  dst_path: dstPath,
                })

                const putResult = await sftp.put(
                  encryptedFile, 
                  dstPath,
                  {
                    writeStreamOptions: {
                      flags: 'w',  // w - write and a - append
                      encoding: null, // use null for binary files
                      mode: 0o666, // mode to use for created file (rwx)
                    }
                  }
                )

                logger.info(context, TAG, `SFTP put result.`, {
                  s3_hostname: parsedS3Uri.hostname,
                  s3_pathname: parsedS3Uri.pathname,
                  dst_path: dstPath,
                  put_result: putResult
                })
              }
              catch (e) {
                logger.exception(context, TAG, e)
                return err(ErrCode.EXCEPTION)
              }
            }

            await sftp.end()
            
            return ok({count: parsedS3Uris.length})
          } catch(e) {
            logger.exception(context, TAG, e)
            return err(ErrCode.EXCEPTION)
          }
        }
      }),
    }
  }
})