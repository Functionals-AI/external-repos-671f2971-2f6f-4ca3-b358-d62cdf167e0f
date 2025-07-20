import { succeed, workflow } from "@mono/common-flows/lib/builder"
import { EventTypes, publishEvent as publishEventTask } from '@mono/common-flows/lib/tasks/aws/eventbridge'
import ReferralTasks from "../tasks/referrals"
import { doImport } from '@mono/ops/lib/referral/sources/santa-clara'

const _SOURCE = 'santa-clara'
const _DOMAIN = 'ops'
const _FLOW_NAME = `referrals-load-${_SOURCE}`

const MTAG = [ 'ops-flows', 'flows', _FLOW_NAME ]

const S3_KEY_PREFIX = 'santa-clara/'
const S3_FILENAME_PREFIX_PROD = 'Prod_Foodsmart_MTMMSFReferrals_'
const S3_FILENAME_PREFIX_TEST = 'Test_Foodsmart_MTMMSFReferrals_'

enum State {
  LoadReferrals = 'LoadReferrals',
  PublishCompletedEvent = 'PublishCompletedEvent',
  Success = 'Success',
}

interface S3EventDetail {
  bucket: {
    name: string[]
  }
  object: {
    key: string[]
  }
}

export default workflow(function(config) {
  const srcBucket = config.ops_cdk?.data?.destBuckets?.externalData.name

  if (!srcBucket) {
    return undefined
  }

  return {
    event: {
      source: ['aws.s3'],
      detailType: [ 'Object Created' ],
      detail: {
        bucket: {
          name: [ srcBucket ],
        },
        object: {
          key: [ { prefix: config.env === 'production' ? `${S3_KEY_PREFIX}${S3_FILENAME_PREFIX_PROD}` : `${S3_KEY_PREFIX}${S3_FILENAME_PREFIX_TEST}` } ]
        }
      }
    },
    startAt: State.LoadReferrals,
    states: {
      [State.LoadReferrals]: ReferralTasks.importInboundReferrals({
        flowName: _FLOW_NAME,
        importFunction: doImport,
        input: function (input) {
          const detail = input.detail as unknown as S3EventDetail

          input['referral'] = {
            // Input to the flow expected to be an S3 event.
            s3_bucket: detail.bucket.name,
            s3_key: detail.object.key,
          }

          return input
        },
        next: State.PublishCompletedEvent,
      }),
      [State.PublishCompletedEvent]: publishEventTask({
        eventDetail: {
          type: EventTypes.FlowCompleted,
          domain: _DOMAIN,
          flowName: _FLOW_NAME,
        },
      }),
      [State.Success]: succeed(),
    },
  }
})
