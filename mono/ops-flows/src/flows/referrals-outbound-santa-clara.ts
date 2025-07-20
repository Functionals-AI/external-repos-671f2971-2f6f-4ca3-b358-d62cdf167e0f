import { succeed, workflow } from "@mono/common-flows/lib/builder"
import { EventTypes, publishEvent as publishEventTask } from '@mono/common-flows/lib/tasks/aws/eventbridge'
import { generateAndExportOutboundReferrals } from "../tasks/sources/santa-clara"

const _SOURCE = 'santa-clara'
const _DOMAIN = 'ops'
const _FLOW_NAME = `referrals-load-${_SOURCE}`

const MTAG = [ 'ops-flows', 'flows', _FLOW_NAME ]

enum State {
  GenerateAndExportOutboundReferrals = 'GenerateAndExportOutboundReferrals',
  PublishCompletedEvent = 'PublishCompletedEvent',
  Success = 'Success',
}

export default workflow(function(config) {
  const srcBucket = config.ops_cdk?.data?.destBuckets?.externalData.name

  if (!srcBucket) {
    return undefined
  }

  return {
    // Run at 7pm UTC/10am PST/11am PDT
    cron: '0 19 * * ? *',
    startAt: State.GenerateAndExportOutboundReferrals,
    states: {
      [State.GenerateAndExportOutboundReferrals]: generateAndExportOutboundReferrals(
        {
          flowName: _FLOW_NAME,
          next: State.PublishCompletedEvent,
        }
      ),
      [State.PublishCompletedEvent]: publishEventTask({
        eventDetail: {
          type: EventTypes.FlowCompleted,
          domain: _DOMAIN,
          flowName: _FLOW_NAME,
        },
        next: State.Success,
      }),
      [State.Success]: succeed(),
    },
  }
})
