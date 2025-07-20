import { Result, err, ok } from 'neverthrow'
import { DateTime } from 'luxon'

import { IContext } from '@mono/common/lib/context'
import { ErrCode } from '@mono/common/lib/error'
import { JsonObject, succeed, task, workflow } from "@mono/common-flows/lib/builder"
import { EventTypes, publishEvent as publishEventTask } from '@mono/common-flows/lib/tasks/aws/eventbridge'
import { getServices } from '@mono/common/lib/integration/cal-optima-connect/browser'
import { importInboundReferrals } from '@mono/ops/lib/referral/sources/caloptima'
import ReferralsTasks from '../tasks/referrals'

const _DOMAIN = 'ops'
const _SOURCE = 'caloptima'
export const _FLOW_NAME = `referrals-ingest-${_SOURCE}`

const MTAG = [ 'ops-flows', 'flows', _FLOW_NAME ]

const SRC_PREFIX = 'caloptima/'
const FILE_PREFIX='2' // All files have same prefix.

enum State {
  GetCaloptimaServices = 'GetCaloptimaServices',
  Import = 'Import',
  PublishCompletedEvent = 'PublishCompletedEvent',
  Success = 'Success',
}

export default workflow(function(config) {
  const srcBucket = config.ops_cdk?.data?.destBuckets?.externalData.name

  return {
    //
    // Allow importing a file in all envs.
    //
    ...(srcBucket && {
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
      }
    }),
    startAt: State.GetCaloptimaServices,
    states: {
      [State.GetCaloptimaServices]: task({
        handler: async function(context: IContext, input: JsonObject): Promise<Result<JsonObject, ErrCode>> {
          const { logger } = context
          const TAG = [ ...MTAG, State.GetCaloptimaServices ]

          try {
            const detail = input['detail']
            const s3Bucket = detail['bucket']['name']
            const s3Key = detail['object']['key']

            const getResult = await getServices(context)

            if (getResult.isErr()) {
              logger.error(context, TAG, 'Error getting services.')

              return err(getResult.error)
            }
  
            return ok({
              referral: {
                s3_bucket: s3Bucket,
                s3_key: s3Key,
              },
              services: getResult.value.map(service => ({
                ...service,
                dob: DateTime.fromJSDate(service.dob, { zone: 'UTC' }).toISODate(),
                serviceDate: DateTime.fromJSDate(service.serviceDate, { zone: 'UTC' } ).toISO()
              }))
            })
          }
          catch (e) {
            logger.exception(context, TAG, e)

            return err(ErrCode.EXCEPTION)
          }
        },
        //
        // Most of the time as of 12/2024, the initial attempt to interact with the CalOptima website
        // after new referrals are received fails with timeouts. Hence, configure retries where:
        //
        //  - interval: 300 sec., give a generous initial interval of 300 sec. before attempting again.
        //  - backoffRate: 2, double on each retry.
        //  - maxAttempts: 3, try 3 times,
        //  - maxDelay: 3600 sec, don't wait more than an hour.
        //
        // Hopefully, have 3 retries of no more than an hour things fix themselves.
        //
        retry: {
          interval: 900,
          backoffRate: 2,
          maxAttempts: 3,
          maxDelay: 3600,
        },
        next: State.Import
      }),
      [State.Import]: ReferralsTasks.importInboundReferrals({
        flowName: _FLOW_NAME,
        importFunction: importInboundReferrals,
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
