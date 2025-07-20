import { ok, err } from 'neverthrow'
import { Logger } from '@mono/common'
import { workflow, task } from '@mono/common-flows/lib/builder'
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
  PullFileForUmoja = 'PullFileForUmoja',
  EncryptUmojaFile = 'EncryptUmojaFile', 
  SendFileToUmoja = 'SendFileToUmoja',

  Success = 'Success',
}

export default workflow(function(config) {
  return {
    // convert CST 2:30PM to UTC is 9:30PM
    cron: '30 21 * * ? *',
    startAt: State.PullFileForUmoja,
    states: {
      [State.PullFileForUmoja]: task({
        handler: async (context, input) => {
          const { logger, config } = context
          const TAG = [ ...MTAG, 'PullFileForUmoja' ]

          const { 
            // @ts-ignore
            sharedDriveFolderId, umojaOutFolderId, umojaOutArchivedFolderId 
          } = config.foodapp?.eligibility.googleDrive

          // look for out files for umoja, and send
          try {
            const listUmojaOutFilesResult = await listFiles(context, { sharedDriveFolderId, folderId: umojaOutFolderId })
            // handle Umoja file
            if (listUmojaOutFilesResult.isOk()) {
              if (listUmojaOutFilesResult.value.length === 0) {
                logger.info(context, TAG, 'No new file in Umoja OUT folder.')
                return err(ErrCode.SERVICE)
              } else {
                // read file content and send to vendor's SFTP server
                let file = listUmojaOutFilesResult.value[0]
                const getFileContentResult = await getFileContent(context, file.fileId as string)
                if (!getFileContentResult.isOk()) {
                  logger.error(context, TAG, `Error getting file content from google drive`)
                  return err(ErrCode.SERVICE)
                }
                // move file to /ARCHIVED
                const moveFileToUmojaOutArchiveResult = await moveFileToFolder(context, file.fileId as string, umojaOutArchivedFolderId)
                if (moveFileToUmojaOutArchiveResult.isOk()) {
                  logger.info(context, TAG, `moveFileToUmojaOutArchiveResult is - ${moveFileToUmojaOutArchiveResult.value}`)
                }

                logger.info(context, TAG, `File content is - ${getFileContentResult.value}`)
                return ok({text: getFileContentResult.value.toString()})
              }
            } else {
              logger.info(context, TAG, `Error listing files in Umoja OUT folder`)
              return err(ErrCode.SERVICE)
            }                 
          } catch (e) {
            logger.exception(context, TAG, e)
            return err(ErrCode.EXCEPTION)
          } 
        },
        next: State.EncryptUmojaFile,
      }),
      [State.EncryptUmojaFile]: Gpg.encrypt({
        key: EncryptKeys.Umoja,
        fileName: 'Umoja_|MMddyyyy|.csv.pgp',
        next: State.SendFileToUmoja,
      }),
      [State.SendFileToUmoja]: task({
        handler: async (context, input) => {
          const { aws: { s3Client }, logger, config } = context
          const TAG = [ ...MTAG, 'SendFileToUmoja' ]

          const file = input['file'] as string
          const s3Uri = `s3://${file}`

          const parsedS3Uris: url.URL[] = []
         
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
          
          let sftp:SFTPClient = null

          try {
            sftp = new SFTPClient()

            logger.info(context, TAG, 'Connecting...')

            await sftp.connect(config.foodapp?.foodVendor.umoja.sftp)

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

              const REMOTE_UPLOAD_FOLDER = '/inbound'
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