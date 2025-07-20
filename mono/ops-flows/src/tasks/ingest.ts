
import { createHash } from 'node:crypto'
import * as _ from "lodash"
import { err, ok, Result } from "neverthrow"

import { IContext } from "@mono/common/lib/context"
import { ErrCode } from "@mono/common/lib/error"
import { JsonObject, task, TaskBuilder } from "@mono/common-flows/lib/builder"
import { logger as taskLogger, FlowTaskInitialStatus, FlowTaskFinalStatus, StartNewRecord, StartRecord, EndRecord } from "@mono/common-flows/lib/logging"
import { SFTPToS3Result } from '@mono/common-flows/lib/tasks/sftp'
import { IngestFunction, IngestResult } from '@mono/ops/lib/data/ingest'
import { S3ObjectMetaData, getObjectMetaData } from '@mono/ops/lib/data/s3'

export { FlowTaskInitialStatus, FlowTaskFinalStatus } from '@mono/common-flows/lib/logging'

const MTAG = [ 'ops-flows', 'tasks', 'ingest' ]

type IngestData = {
  sourceId: string,
  s3Bucket: string,
  s3Keys: string[],
}

/**
 * @typedef {object} PreIngestOptions - Options for preIngest.
 * @property {boolean} doNotSkip - Disable skipping of execution.
 */
type PreIngestOptions = {
  doNotSkip?: boolean,
}

/**
 * Prior to ingest:
 *  - Compute object's meta-data
 *  - Log to the "flot=w task logger", using it to "guard" aginst:
 *    1. Running multiple invokations concurrently (logger will wait),
 *    2. Processing data that has already been processed (skip invokation).
 */
export async function preIngest(context: IContext, flowId: string, taskId: string, data: IngestData, options?: PreIngestOptions): Promise<Result<StartRecord, ErrCode>> {
  const { logger } = context
  const TAG = [ ...MTAG, 'preIngest' ]

  try {
    const { s3Bucket, s3Keys } = data
    const doNotSkip = options?.doNotSkip ?? false

    const inputMetaData: S3ObjectMetaData[] = []

    for (const s3Key of s3Keys) {
      const getObjectMetaDataResult = await getObjectMetaData(context, s3Bucket, s3Key)

      if (getObjectMetaDataResult.isErr()) {
        logger.error(context, TAG, 'Error getting object metadata.', {
          s3Bucket,
          s3Key,
        })

        return err(getObjectMetaDataResult.error)
      }
      inputMetaData.push(getObjectMetaDataResult.value)
    }

    const input = {
      s3Bucket: s3Bucket,
      objects: inputMetaData as any as JsonObject
    }

    let inputHash: string = ''

    if ( inputMetaData.length === 1 ) { 
      inputHash = inputMetaData[0].hash
    }
    else {
      const hash = createHash('md5')

      hash.update(JSON.stringify(input))
      inputHash = hash.digest('hex')
    }

    const startRecord: StartNewRecord = {
      flowId,
      taskId,
      inputId: data.sourceId,
      input,
      inputHash,
      startAt: new Date(),
    }

    logger.debug(context, TAG, 'Pre ingest task start.', {
      startRecord,
      doNotSkip,
    })
    
    const logResult = await taskLogger.taskStart(context, startRecord, {
      waitOn: new Set([ "flowId", "taskId", "inputId", "status" ]),
      ...(doNotSkip === false && { skipOn: new Set([ "flowId", "taskId", "inputId", "inputHash", "status" ]) }),
    })

    if (logResult.isErr()) {
      logger.error(context, TAG, 'Error logging start of task.', {
        startRecord,
        error: logResult.error,
      })

      return err(logResult.error)
    }

    return ok(logResult.value)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

interface PostIngestOptions {
  result?: IngestResult,
  error?: ErrCode,
}

export async function postIngest(context: IContext, record: EndRecord, options?: PostIngestOptions): Promise<Result<StartRecord, ErrCode>> {
  const { logger } = context
  const TAG = [ ...MTAG, 'postIngest' ]

  try {
    const result = options?.result
    const error = options?.error

    if (result) {
      record.output = result as any as JsonObject
    }

    if (error) {
      record.status = FlowTaskFinalStatus.FAILED
      record.meta = { error, }
    }
    else {
      record.status = FlowTaskFinalStatus.SUCCEEDED
    }

    const logResult = await taskLogger.taskEnd(context, record)

    if (logResult.isErr()) {
      logger.error(context, TAG, 'Error logging end of task.', {
        record,
      })

      return err(logResult.error)
    }

    return ok(logResult.value)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export interface IngestTaskOptions extends Omit<TaskBuilder, 'handler' | 'type'> {
  flowName: string, // Snake cased name for logging consistency.
  sourceId: string, // Source / client name correspnding to that found in OPS config.
  ingestFunction: IngestFunction,
}

/**
 * Ops data ingest Task for objects received from S3.
 */
export function ingest(options: IngestTaskOptions): TaskBuilder {
  const { flowName, ingestFunction, sourceId } = options
  return task({
    ...options,
    /**
     * 
     * @param context 
     * @param input 
     * @param input.detail - s3 object
     * @param input.always_run - prevent flow logging to skip execution if true.
     * @returns 
     */
    handler: async function (context: IContext, input: JsonObject): Promise<Result<JsonObject, ErrCode>> {
      const { logger } = context 
      const TAG = [ 'ops-flows', 'flows', flowName, 'Ingest' ]

      try {
        const detail = input['detail']
        const srcBucket = detail['bucket']['name']
        const srcKey = detail['object']['key']
        const flowId = _.camelCase(flowName)
        const doNotSkip = Boolean(input['do_not_skip'] ?? false)

        const preIngestResult = await preIngest(
          context, 
          flowId, 
          'Ingest', 
          {
            sourceId,
            s3Bucket: srcBucket,
            s3Keys: [ srcKey ],
          },
          {
            doNotSkip,
          }
        )

        if (preIngestResult.isErr()) {
          logger.error(context, TAG, 'Pre. ingest error.', {
            flowName,
            sourceId,
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

          return ok({
            srcS3Bucket: srcBucket,
            srcS3Key: srcKey,
            uploadResult: []
          })
        }

        const result = await ingestFunction(context, srcKey)

        if (result.isOk()) {
          logRecord.status = FlowTaskFinalStatus.SUCCEEDED

          await postIngest(context, logRecord, {
            result: result.value
          })

          return ok( result.value as any as JsonObject)
        }
        else {
          logger.error(context, TAG, 'Error ingesting.', {
            object: detail['object']
          })

          logRecord.status = FlowTaskFinalStatus.FAILED

          //
          // Execute postIngest in order to log, but don't await. Fire and forget.
          //
          await postIngest(context, logRecord)

          return err(result.error)
        }
      }
      catch (e) {
        logger.exception(context, TAG, e)

        return err(ErrCode.EXCEPTION)
      }
    },
  })
}

/**
 * Ops data ingest task for objects received from an SFTP host.
 */
export function ingestFromSFTP(options: IngestTaskOptions): TaskBuilder {
  const { flowName, ingestFunction, sourceId } = options
  const flowId = _.camelCase(flowName)

  return task({
    ...options,
    handler: async function (context: IContext, input: JsonObject): Promise<Result<JsonObject, ErrCode>> {
      const { logger, config } = context 
      const TAG = [ 'ops-flows', 'flows', flowName, 'Ingest' ]

      try {
        const destBucket = config.ops_cdk?.data?.destBuckets?.externalData?.name
        const sftpResults: SFTPToS3Result[] = input['results'] as any as SFTPToS3Result[]
        const doNotSkip = Boolean(input['do_not_skip'] ?? false)
        const ingestResults: any = []

        if (destBucket === undefined) {
          logger.error(context, TAG, "destination bucket unavailble.", {
            flowName,
            sourceId,
          })

          return err(ErrCode.SERVICE)
        }

        for (const sftpResult of sftpResults) {
          const destKey = sftpResult.destKey
          const preIngestResult = await preIngest(
            context, 
            flowId, 
            'Ingest', 
            {
              sourceId,
              s3Bucket: destBucket,
              s3Keys: [ destKey ],
            },
            {
              doNotSkip,
            })
  
          if (preIngestResult.isErr()) {
            logger.error(context, TAG, 'Pre. ingest error.', {
              flowName,
              sourceId,
              destBucket,
              destKey,
            })
  
            return err(preIngestResult.error)
          }
  
          const logRecord = preIngestResult.value
  
          if (logRecord.status === FlowTaskInitialStatus.SKIPPED) {
            logger.info(context, TAG, "Skipping ingest as data already ingested.", {
              flowId,
              destBucket,
              destKey,
            })
          }
          else {
            const result = await ingestFunction(context, sftpResult.destKey)

            if (result.isOk()) {
              logRecord.status = FlowTaskFinalStatus.SUCCEEDED

              //
              // Execute postIngest in order to log.
              //
              await postIngest(context, logRecord, { result: result.value })
  
              logger.info(context, TAG, 'Ingest complete.', {
                result: result.value
              })
            
              ingestResults.push(result.value)
            }
            else {
              logger.error(context, TAG, 'Error ingesting.', {
                sftpResult,
              })

              logRecord.status = FlowTaskFinalStatus.FAILED

              //
              // Execute postIngest in order to log.
              //
              await postIngest(context, logRecord)  

              return err(result.error)
            }
          }
        }
        return ok({ 
          sftp_results: sftpResults,
          ingest_results: ingestResults 
        } as any as JsonObject)
      }
      catch (e) {
        logger.exception(context, TAG, e)

        return err(ErrCode.EXCEPTION)
      }
    },
  })
}

export default {
  ingest,
  ingestFromSFTP,
}