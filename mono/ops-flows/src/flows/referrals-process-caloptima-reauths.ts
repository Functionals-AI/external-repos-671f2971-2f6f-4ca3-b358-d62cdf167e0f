import { err,ok, Result } from 'neverthrow'

import { IContext } from '@mono/common/lib/context'
import { ErrCode } from '@mono/common/lib/error'
import { JsonObject, succeed, task, workflow } from '@mono/common-flows/lib/builder'
import { EventTypes, publishEvent as publishEventTask } from '@mono/common-flows/lib/tasks/aws/eventbridge'
import { importInboundReferrals, processReferralsForReauth } from '@mono/ops/lib/referral/sources/caloptima'

const _DOMAIN = 'ops'
const _SOURCE = 'caloptima'
export const _FLOW_NAME = `referrals-process-${_SOURCE}-reauths`

const MTAG = [ 'ops-flows', 'flows', _FLOW_NAME ]

//
// All files with a TO_PROCESS_PREFIX will be processed.
// It is expected at:
//  - Any errors are written to PROCESSED_ERRORS_PREFIX.
//  - To reprocess errors, files will be dropped into:
//    - REPROCESS_ERRORS_PREFIX.
// Hence, TO_PROCESS_PREFIX  and REPROCESS_ERRORS_PREFIX will both be s3 triggers.
//
const TO_PROCESS_PREFIX = 'referrals/caloptima/reauths/to-process/'
const REPROCESS_ERRORS_PREFIX = 'referrals/caloptima/reauths/reprocess-errors/'
const PROCESSED_ERRORS_PREFIX = 'referrals/caloptima/reauths/processed/errors/'

enum State {
  ProcessReferralsForReauth = 'ProcessReferralsForReauth',
  PublishCompletedEvent = 'PublishCompletedEvent',
  Success = 'Success',
}

export default workflow(function(config) {
  const dataBucket = config.ops_cdk?.data?.destBuckets?.commonData.name

  return {
    ...((config.isStaging || config.isProduction) && dataBucket && {
      event: {
        source: ['aws.s3'],
        detailType: [ 'Object Created' ],
        detail: {
          bucket: {
            name: [ dataBucket ],
          },
          object: {
            key: [ 
              { prefix: `${TO_PROCESS_PREFIX}` },
              { prefix: `${REPROCESS_ERRORS_PREFIX}` },
            ]
          }
        }
      }
    }),
    startAt: State.ProcessReferralsForReauth,
    states: {
      [State.ProcessReferralsForReauth]: task({
        handler: async function(context: IContext, input: JsonObject): Promise<Result<JsonObject, ErrCode>> {
          const { logger } = context
          const TAG = [ ...MTAG, State.ProcessReferralsForReauth ]

          try {
            const detail = input['detail']
            const s3Bucket = detail['bucket']['name']
            const s3Key = detail['object']['key']

            const result = await processReferralsForReauth(context, s3Bucket, s3Key, {
              errorsOutputS3Bucket: dataBucket,
              errorsOutputS3Prefix: PROCESSED_ERRORS_PREFIX,
            })

            if (result.isErr()) {
              logger.error(context, TAG, 'Error processing re-auths.', {
                s3Bucket,
                s3Key,
              })

              return err(result.error)
            }

            return ok({
              ...result.value,
            })
          }
          catch (e) {
            logger.exception(context, TAG, e) 

            return err(ErrCode.EXCEPTION)
          }
        },
        next: State.PublishCompletedEvent,
      }),
      PublishCompletedEvent: publishEventTask({
        eventDetail: {
          type: EventTypes.FlowCompleted,
          domain: _DOMAIN,
          flowName: _FLOW_NAME,
        },
        next: State.Success,
      }),
      [State.Success]: succeed(),
    }
  }
})
