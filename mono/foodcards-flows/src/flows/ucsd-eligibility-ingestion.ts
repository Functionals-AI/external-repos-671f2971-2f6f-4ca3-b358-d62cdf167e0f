import { ok, err } from 'neverthrow'
import { ErrCode } from '@mono/common/lib/error'
import { Logger } from '@mono/common'
import { succeed, task, wait, workflow, JsonObject } from '@mono/common-flows/lib/builder'
import Foodcards from '@mono/foodcards'

const MTAG = Logger.tag()

const UCSD_INBOUND_S3_KEY_PREFIX = 'participants/UCSD/incoming/'

enum State {
  IngestParticipants = 'IngestParticipants',
  IncommEtl = 'IncommEtl',
  SftpUploadCardHolderFile = 'SftpUploadCardHolderFile',
  WaitBetweenSftpUploads = 'WaitBetweenSftpUploads',
  SftpUploadPurseEligibilityFile = 'SftpUploadPurseEligibilityFile',
  Success = 'Success',
}

export default workflow(function(config) {
  const sftpWaitBetweenUploads = config.foodcards.incomm.sftpWaitBetweenUploads
  const bucketName = config.foodcards.s3BucketName

  return {
    event: {
      source: ['aws.s3'],
      detailType: [ 'Object Created' ],
      detail: {
        bucket: {
          name: [ bucketName ],
        },
        object: {
          key: [ { "prefix": UCSD_INBOUND_S3_KEY_PREFIX } ]
        }
      }
    },
    startAt: State.IngestParticipants,
    states: {
      [State.IngestParticipants]: task({
        handler: async (context, input) => {
          const TAG = [...MTAG, 'IngestParticipants']
          const { logger } = context

          logger.info(context, TAG, 'Entered handler.', { input, })

          const detail = input['detail']
          const bucket = detail['bucket']['name']
          const key = detail['object']['key']

          const result = await Foodcards.Ucsd.ParticipantEligibility.ingest(context, bucket, key)

          if (result.isOk()) {
            return ok({ count: result.value } as JsonObject)
          }
          else {
            return err(ErrCode.SERVICE)
          }
        },
        next: State.IncommEtl,
      }),
      [State.IncommEtl]: task({
        handler: async (context, input) => {
          const TAG = [...MTAG, 'IncommEtl']
          const { logger } = context

          const cardHolderFileResult = await Foodcards.Incomm.Etl.extractCardHolderFile(context, bucketName)

          if (cardHolderFileResult.isOk()) {
            const purseEligibilityFileResult = await Foodcards.Incomm.Etl.extractPurseEligibilityFile(context, bucketName)
          
            if (purseEligibilityFileResult.isOk()) {
              return ok( {
                card_holder_file_key: cardHolderFileResult.value,
                purse_eligibility_file_key: purseEligibilityFileResult.value
              } as JsonObject)
            }
            else {
              return err(ErrCode.SERVICE)
            }
          }
          else {
            return err(ErrCode.SERVICE)
          }
        },
        next: State.SftpUploadCardHolderFile,
      }),
      [State.SftpUploadCardHolderFile]: task({
        handler: async (context, input) => {
          const TAG = [...MTAG, 'SftpUpload']
          const { logger } = context

          logger.info(context, TAG, 'Cardholder file upload invoked.', { input, })

          const key = input['card_holder_file_key']

          logger.info(context, TAG, 'Uploading cardholders to InComm.', { key: key })

          const result = await Foodcards.Incomm.SftpUpload.upload(context, [`s3://${bucketName}/${key}`])

          if (result.isOk()) {
            return ok(input)
          }
          else {
            return err(ErrCode.SERVICE)
          }
        },
        next: State.WaitBetweenSftpUploads,
      }),
      [State.WaitBetweenSftpUploads]: wait({
        seconds: sftpWaitBetweenUploads,
        resultPath: null,
        next: State.SftpUploadPurseEligibilityFile
      }),
      [State.SftpUploadPurseEligibilityFile]: task({
        handler: async (context, input) => {
          const TAG = [...MTAG, 'SftpUpload']
          const { logger } = context

          logger.info(context, TAG, 'Uploading purse eligibility file to InComm.', { input, })

          const key = input['purse_eligibility_file_key']

          const result = await Foodcards.Incomm.SftpUpload.upload(context, [`s3://${bucketName}/${key}`])

          if (result.isOk()) {
            return ok(input)
          }
          else {
            return err(ErrCode.SERVICE)
          }
          return ok(input)
        },
        next: State.Success,
      }),
      [State.Success]: succeed(),
    }
  }
})
