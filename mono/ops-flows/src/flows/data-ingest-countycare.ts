import * as _ from 'lodash'
import { ok, err } from 'neverthrow'
import { ErrCode } from '@mono/common/lib/error'
import { JsonObject, task, succeed, workflow } from '@mono/common-flows/lib/builder'
import { CountyCare } from '@mono/ops/lib/data'
import { IngestResult } from '@mono/ops/lib/data/ingest'
import { FlowTaskInitialStatus, FlowTaskFinalStatus, preIngest, postIngest } from '../tasks/ingest'

const SOURCE = 'countycare'
const FLOW_NAME = `data-ingest-${SOURCE}`
const MTAG = [ 'ops-flows', 'flows', FLOW_NAME ]

enum State {
  Ingest = 'Ingest',
  LoadProviders = 'LoadProviders',
  Success = 'Success',
}

const SFTP_ARCHIVE_PREFIX = 'cookcounty/'
const FILE_PREFIX='vh_datashare_'
  
export default workflow(function(config) {
  if (config.isProduction) {
    const srcBucket = config.ops_cdk?.sftp?.sftpArchiveBucket?.name

    if (srcBucket) {
      return {
        event: {
          source: ['aws.s3'],
          detailType: [ 'Object Created' ],
          detail: {
            bucket: {
              name: [ srcBucket ],
            },
            object: {
              key: [ { prefix: `${SFTP_ARCHIVE_PREFIX}${FILE_PREFIX}` } ]
            }
          }
        },
        startAt: 'Ingest',
        states: {
          [State.Ingest]: task({
            handler: async (context, input) => {
              const { logger } = context 
              const TAG = [ ...MTAG, State.Ingest ]

              try {
                const detail = input['detail']
                const srcKey = detail['object']['key']
                const flowId = _.camelCase(FLOW_NAME)
                const doNotSkip = Boolean(input['do_not_skip'] ?? false)

                const preIngestResult = await preIngest(
                  context, 
                  flowId,
                  'Ingest', 
                  {
                    sourceId: SOURCE,
                    s3Bucket: srcBucket,
                    s3Keys: [ srcKey ],
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
                    srcKey,
                  })
        
                  return err(preIngestResult.error)
                }
        
                const logRecord = preIngestResult.value
        
                if (logRecord.status === FlowTaskInitialStatus.SKIPPED) {
                  logger.info(context, TAG, "Skipping ingestion as it has already been performed.", {
                    flowId,
                    srcBucket,
                    srcKey,
                    logRecord,
                  })
        
                  return ok({})
                }

                const ingestResult = await CountyCare.ingest(context, srcKey)

                if (ingestResult.isErr()) {
                  logger.error(context, TAG, 'Error ingesting.', {
                    object: detail['object']
                  })

                  logRecord.status = FlowTaskFinalStatus.FAILED
        
                  //
                  // Execute postIngest in order to log, but don't await. Fire and forget.
                  //
                  await postIngest(context, logRecord)

                  return err(ingestResult.error)
                }

                logger.info(context, TAG, 'Ingest success.', {
                  srcKey,
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

                return ok( ingestResult.value as any as JsonObject)
              }
              catch (e) {
                logger.exception(context, TAG, e)

                return err(ErrCode.EXCEPTION)
              }
            },
            next: State.LoadProviders
          }),
          [State.LoadProviders]: task({
            handler: async (context, input) => {
              const { logger } = context
              const TAG = [ ...MTAG, State.LoadProviders]

              try {
                const result = await CountyCare.loadProviders(context, input as unknown as IngestResult)

                if (result.isErr()) {
                  logger.error(context, TAG, 'Error loading providers.', {
                    input, 
                    error: result.error
                  })

                  return err(result.error)
                }

                return ok( result.value as any as JsonObject)
              }
              catch (e) {
                logger.exception(context, TAG, e)

                return err(ErrCode.EXCEPTION)
              }
            },
            next: State.Success
          }),
          [State.Success]: succeed(),
        }
      }
    }
    else {
      console.log(`Source bucket / prefix required.`)
    }
  }
})
