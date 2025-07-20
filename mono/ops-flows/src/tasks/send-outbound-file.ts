import { JsonObject, task, TaskBuilder } from '@mono/common-flows/lib/builder'
import { IContext } from '@mono/common/lib/context'
import { ErrCode } from '@mono/common/lib/error'
import { err, ok, Result } from 'neverthrow'
import { UploadOutboundFileDetails, uploadOutboundFile as uploadFile } from '@mono/ops/lib/data/upload-outbound-file'

export interface SendOutboundFileOptions extends Omit<TaskBuilder, 'handler' | 'type'> {
  flowName: string
}

type EventBridgeS3Document = {
  bucket?: {
    name?: string
  }
  object?: {
    key?: string
  }
}

function getUploadOutboundFileDetailsFromS3Event(
  context: IContext,
  flowName: string,
  detail: EventBridgeS3Document
): Result<UploadOutboundFileDetails, ErrCode> {
  const { logger } = context
  const TAG = ['ops', 'data', 'SendOutboundFile', 'getUploadOutboundFileDetailsFromBucketAndKey']

  const bucket = detail?.bucket?.name
  const key = detail?.object?.key
  if (!bucket || !key) {
    logger.error(context, TAG, `Invalid S3 event detail for ${flowName}`, { detail })
    return err(ErrCode.ARGUMENT_ERROR)
  }

  logger.info(context, TAG, `Received S3 event for ${flowName}`, { bucket, key })

  // Parses out as `<source>/outbound`
  // Note that `source` will be in the root & contain no directories before `outbound`
  const regex = /^\/?([^\/]+)\/outbound\//

  let matches = key.match(regex)
  if (!matches) {
    logger.warn(context, TAG, 'Failed to parse `source` from s3 key', {
      bucket,
      key,
    })

    return err(ErrCode.ARGUMENT_ERROR)
  }

  return ok({
    bucket,
    key,

    source: matches[1]
  })
}

export function SendOutboundFile(options: SendOutboundFileOptions): TaskBuilder {
  const { flowName } = options

  return task({
    ...options,
    handler: async function (context: IContext, input: JsonObject): Promise<Result<JsonObject, ErrCode>> {
      const { logger } = context
      const TAG = ['ops-flows', 'tasks', flowName, 'SendOutboundFile']

      try {
        const details = getUploadOutboundFileDetailsFromS3Event(
          context,
          flowName,
          input.detail as EventBridgeS3Document
        )
        if (details.isErr()) {
          return err(details.error)
        }

        const result = await uploadFile(context, details.value)
        if (result.isErr()) {
          return err(result.error)
        }

        return ok({})
      } catch (e) {
        logger.error(context, TAG, `Failed to send to SFTP for ${flowName}`, { error: e })
        return err(ErrCode.EXCEPTION)
      }
    },
  })
}

export default {
  SendOutboundFile,
}
