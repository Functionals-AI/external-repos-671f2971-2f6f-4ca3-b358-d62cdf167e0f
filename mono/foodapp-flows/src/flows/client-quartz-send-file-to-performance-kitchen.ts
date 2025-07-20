import { ok, err } from 'neverthrow'
import { Logger } from '@mono/common'
import { workflow, task, JsonObject } from '@mono/common-flows/lib/builder'
import { ErrCode } from '@mono/common/lib/error'
import { listFiles, getFileContent, moveFileToFolder } from '@mono/common/lib/service/google/drive'
import Gpg, { EncryptKeys } from '@mono/common-flows/lib/tasks/encryption/gpg'
import S3, { CopyBucket } from '@mono/common-flows/lib/tasks/aws/s3'

const MTAG = Logger.tag()

enum State {
  PullFileForPK = 'PullFileForPK',
  EncryptPKFile = 'EncryptPKFile',
  SendFileToPK = 'SendFileToPK',

  Success = 'Success',
}

export default workflow(function(config) {
  return {
    // convert CST 2:30PM to UTC is 9:30PM
    cron: '30 21 * * ? *',
    startAt: State.PullFileForPK,
    states: {
      [State.PullFileForPK]: task({
        handler: async (context, input) => {
          const { logger, config } = context
          const TAG = [ ...MTAG, 'PullFileForPK' ]

          const { 
            // @ts-ignore
            sharedDriveFolderId, performanceKitchenOutFolderId, performanceKitchenOutArchivedFolderId
          } = config.foodapp?.eligibility.googleDrive

          // look for out files for performance kitchen and umoja, and send
          try {
            const listPKOutFilesResult = await listFiles(context, { sharedDriveFolderId, folderId: performanceKitchenOutFolderId })
            // handle PK file
            if (listPKOutFilesResult.isOk()) {
              if (listPKOutFilesResult.value.length === 0) {
                logger.info(context, TAG, 'No new file in Performance Kitchen OUT folder.')
                return err(ErrCode.SERVICE)
              } else {
                // read file content and send to vendor's SFTP server, we assume there will be only one new file
                let file = listPKOutFilesResult.value[0]
                const getFileContentResult = await getFileContent(context, file.fileId as string)
                if (!getFileContentResult.isOk()) {
                  logger.error(context, TAG, `Error getting file content from google drive`)
                  return err(ErrCode.SERVICE)
                }

                // move file from /OUT to /OUT/ARCHIVED
                const moveFileToPKOutArchiveResult = await moveFileToFolder(context, file.fileId as string, performanceKitchenOutArchivedFolderId)
                if (moveFileToPKOutArchiveResult.isOk()) {
                  logger.info(context, TAG, `moveFileToPKOutArchiveResult is - ${moveFileToPKOutArchiveResult.value}`)
                }

                logger.info(context, TAG, `File content is - ${getFileContentResult.value}`)
                return ok({text: getFileContentResult.value.toString()})
              }
            } else {
              logger.info(context, TAG, `Error listing files in Performance Kitchen OUT folder`)
              return err(ErrCode.SERVICE)
            }                 
          } catch (e) {
            logger.exception(context, TAG, e)
            return err(ErrCode.EXCEPTION)
          } 
        },
        next: State.EncryptPKFile,
      }),
      [State.EncryptPKFile]: Gpg.encrypt({
        key: EncryptKeys.PerformanceKitchen,
        fileName: 'PK_Outbound_Orders-|M_dd_yyyy|.csv.gpg',
        next: State.SendFileToPK,
      }),
      [State.SendFileToPK]: S3.copy({
        destBucket: CopyBucket.SftpServerBucket,
        destKey: 'performancekitchen/${filename}',
      }),
    }
  }
})