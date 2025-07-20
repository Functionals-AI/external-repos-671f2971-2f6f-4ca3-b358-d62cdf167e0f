import * as _ from 'lodash'
import { ok, err, Result } from 'neverthrow'
import { ListObjectsV2Command, ListObjectsV2Output } from '@aws-sdk/client-s3'
import { DateTime } from 'luxon'

import { IContext } from '@mono/common/lib/context'
import { ErrCode } from '@mono/common/lib/error'
import { JsonObject, choice, succeed, task, workflow } from '@mono/common-flows/lib/builder'
import { IngestSrcKeys, ingest } from '@mono/ops/lib/data/sources/banner'
import { FlowTaskInitialStatus, FlowTaskFinalStatus, preIngest, postIngest } from '../tasks/ingest'

const SOURCE = 'banner'
const FLOW_NAME = `data-ingest-${SOURCE}`

const MTAG = [ 'ops-flows', 'flows', FLOW_NAME ]

const SRC_PREFIX = 'bannerhealth/'
const FILE_PREFIX='BUHP_FOODSMART_MEMBER_'

const ELIGIBILITY_PREFIX1 = 'BUHP_FOODSMART_MEMBER_ELIGIBILITY_'
const ELIGIBILITY_PREFIX2 = 'BUHP_FOODSMART_MEMBER_ELIGIBILITY_18_'
const DEMOGRAPHIC_PREFIX1 = 'BUHP_FOODSMART_MEMBER_DEMOGRAPHIC_'
const DEMOGRAPHIC_PREFIX2 = 'BUHP_FOODSMART_MEMBER_DEMOGRAPHIC_18_'

interface GetRequiredKeysResult {
  date: Date,
  keys: Partial<IngestSrcKeys>
}

async function getRequiredKeys(context: IContext, bucketName: string, newKey: string): Promise<Result<GetRequiredKeysResult, ErrCode>> {
  const { logger, aws: { s3Client } } = context
  const TAG = [ ...MTAG, 'getRequiredKeys' ]

  try {
    const newKeyParts = newKey.split('/')
    const newFilename = newKeyParts.pop() as string
    const newPrefix = newKeyParts.length ? `${newKeyParts.join('/')}/` : ''

    function getFileDateString(filename: string): Result<string, ErrCode> {
      const DATE_SUBSTRING_LENGTH = 11
      if (filename.startsWith(ELIGIBILITY_PREFIX2)) {
        return ok(filename.substring(ELIGIBILITY_PREFIX2.length, ELIGIBILITY_PREFIX2.length + DATE_SUBSTRING_LENGTH))
      }
      else if (filename.startsWith(ELIGIBILITY_PREFIX1)) {
        return ok(filename.substring(ELIGIBILITY_PREFIX1.length, ELIGIBILITY_PREFIX1.length + DATE_SUBSTRING_LENGTH))
      }
      else if (filename.startsWith(DEMOGRAPHIC_PREFIX2)) {
        return ok(filename.substring(DEMOGRAPHIC_PREFIX2.length, DEMOGRAPHIC_PREFIX2.length + DATE_SUBSTRING_LENGTH))
      }
      else if (filename.startsWith(DEMOGRAPHIC_PREFIX1)) {
        return ok(filename.substring(DEMOGRAPHIC_PREFIX1.length, DEMOGRAPHIC_PREFIX1.length + DATE_SUBSTRING_LENGTH))
      }
      return err(ErrCode.NOT_FOUND)
    }

    const dateStrResult = getFileDateString(newFilename)

    if (dateStrResult.isErr()) {
      logger.error(context, TAG, 'Date cannot be derived from filename.', {
        newKey,
        newFilename
      })

      return err(dateStrResult.error)
    }

    const dateStr = dateStrResult.value
    const ingestKeys: Partial<IngestSrcKeys> = {}

    if (newFilename.startsWith(ELIGIBILITY_PREFIX2)) {
      ingestKeys.eligibilitySrcKey2 = newKey
    }
    else if (newFilename.startsWith(ELIGIBILITY_PREFIX1)) {
      ingestKeys.eligibilitySrcKey1 = newKey
    }
    else if (newFilename.startsWith(DEMOGRAPHIC_PREFIX2)) {
      ingestKeys.demographicsSrcKey2 = newKey
    }
    else if (newFilename.startsWith(DEMOGRAPHIC_PREFIX1)) {
      ingestKeys.demographicsSrcKey1 = newKey
    }

    async function getKey(context: IContext, prefix: string, dateStr: string): Promise<Result<string, ErrCode>> {
      try {
        const listPrefix =  `${prefix}${dateStr}.`
        const s3Command = new ListObjectsV2Command({
          Bucket: bucketName,
          Prefix: listPrefix
        })
        const s3Result: ListObjectsV2Output = await s3Client.send(s3Command)

        if (s3Result.Contents === undefined || s3Result.Contents.length !== 1) {
          logger.error(context, TAG, `Prefix not found.`, {
            bucket: bucketName,
            prefix: listPrefix,
          })
    
          return err(ErrCode.NOT_FOUND)
        }

        return ok(s3Result.Contents[0].Key as string)
      }
      catch (e) {
        logger.exception(context, TAG, e)

        return err(ErrCode.EXCEPTION)
      }
    }

    for (const {key, filenamePrefix} of [
      {
        key: 'eligibilitySrcKey1',
        filenamePrefix: ELIGIBILITY_PREFIX1,
      },
      {
        key: 'eligibilitySrcKey2',
        filenamePrefix: ELIGIBILITY_PREFIX2,
      },
      {
        key: 'demographicsSrcKey1',
        filenamePrefix: DEMOGRAPHIC_PREFIX1,
      },
      {
        key: 'demographicsSrcKey2',
        filenamePrefix: DEMOGRAPHIC_PREFIX2,
      }
    ]) {
      const result = await getKey(context, `${newPrefix}${filenamePrefix}`, dateStr)

      if (result.isOk()) {
        ingestKeys[key] = result.value
      }
    }

    return ok({
      date: DateTime.fromFormat(dateStr, 'dd-MMM-yyyy', { zone: 'utc' }).toISO(),
      keys: ingestKeys
    })
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

enum State {
  GetFiles = 'GetFiles',
  OnGetFiles = 'OnGetFiles',
  Ingest = 'Ingest',
  Success = 'Success'
}

export default workflow(function(config) {
  if (config.isProduction) {
    const srcBucket = config.ops_cdk?.sftp?.sftpArchiveBucket?.name

    if (!srcBucket) {
      console.log(`Source bucket is required.`)
    }
    else {
      return {
        event: {
          source: ['aws.s3'],
          detailType: [ 'Object Created' ],
          detail: {
            bucket: {
              name: [ srcBucket ],
            },
            object: {
              key: [ { prefix: `${SRC_PREFIX}${FILE_PREFIX}` } ]
            }
          }
        },
        startAt: 'GetFiles',
        states: {
          [State.GetFiles]: task({
            handler: async (context, input) => {
              const { logger } = context 
              const TAG = [ ...MTAG, State.Ingest ]
  
              try {
                const detail = input['detail']
                const bucketName = detail['bucket']['name']
                const newKey = detail['object']['key']

                const result = await getRequiredKeys(context, bucketName, newKey)

                if (result.isErr()) {
                  return err(result.error)
                }

                const { date, keys } = result.value

                return ok({
                  all_present: Object.keys(keys).length === 4 ? 'true' : 'false',
                  date,
                  keys,
                } as any as JsonObject)
              }
              catch (e) {
                logger.exception(context, TAG, e)

                return err(ErrCode.EXCEPTION)
              }
            },
            output: function (output, input) {
              const transformed = {
                do_not_skip: input['do_not_skip'] ?? false,
                ...output,
              }

              return transformed
            },
            next: State.OnGetFiles,
          }),
          [State.OnGetFiles]: choice({
            choices: [
              {
                variable: '$.all_present',
                stringEquals: 'true',
                next: State.Ingest,
              }
            ],
            default: State.Success,            
          }),
          [State.Ingest]: task({
            handler: async (context, input) => {
              const { logger } = context
              const TAG = [ ...MTAG, State.Ingest ]
              const date: string = input['date'] as string
              const keys: IngestSrcKeys = input['keys'] as any as IngestSrcKeys
              const doNotSkip = Boolean(input['do_not_skip'] ?? false)
              const flowId = _.camelCase(FLOW_NAME)

              try {
                const preIngestResult = await preIngest(
                  context, 
                  flowId,
                  'Ingest', 
                  {
                    sourceId: SOURCE,
                    s3Bucket: srcBucket,
                    s3Keys: Object.values(keys),
                  },
                  {
                    doNotSkip,
                  }
                )
        
                if (preIngestResult.isErr()) {
                  logger.error(context, TAG, 'Pre. ingest error.', {
                    flowName: FLOW_NAME,
                    sourceId: SOURCE,
                    srcBucket,
                    srcKeys: keys,
                  })
        
                  return err(preIngestResult.error)
                }
        
                const logRecord = preIngestResult.value
        
                if (logRecord.status === FlowTaskInitialStatus.SKIPPED) {
                  logger.info(context, TAG, "Skipping ingestion as it has already been performed.", {
                    flowId,
                    srcBucket,
                    srcKeys: Object.values(keys),
                    logRecord,
                  })
        
                  return ok({})
                }

                const ingestResult = await ingest(context, new Date(date), keys)

                if (ingestResult.isErr()) {
                  logger.error(context, TAG, 'Ingest error.', {
                    date,
                    keys,
                  })

                  logRecord.status = FlowTaskFinalStatus.FAILED
        
                  //
                  // Execute postIngest in order to log, but don't await. Fire and forget.
                  //
                  await postIngest(context, logRecord)
        

                  return err(ingestResult.error)
                }

                logger.info(context, TAG, 'Ingest success.', {
                  date,
                  keys,
                })

                logRecord.status = FlowTaskFinalStatus.SUCCEEDED

                const result = ingestResult.value

                await postIngest(context, logRecord, {
                  result: {
                    srcS3Bucket: result.srcS3Bucket,
                    srcS3Key: '',
                    uploadResults: result.uploadResults,
                  }
                })      

                return ok(ingestResult.value as any as JsonObject)
              }
              catch (e) {
                logger.exception(context, TAG, e)

                return err(ErrCode.EXCEPTION)
              }
            },
            next: State.Success,
          }),
          [State.Success]: succeed(),
        }
      }
    }
  }
})