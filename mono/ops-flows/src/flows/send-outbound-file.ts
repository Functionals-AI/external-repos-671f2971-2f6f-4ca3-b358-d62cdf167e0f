import { choice, fail, succeed, workflow } from '@mono/common-flows/lib/builder'
import { EventTypes, publishEvent as publishEventTask } from '@mono/common-flows/lib/tasks/aws/eventbridge'
import { SendOutboundFile } from '../tasks/send-outbound-file'

const _DOMAIN = 'ops'
const _FLOW_NAME = 'outbound-sftp'

enum State {
  SendOutboundFile = 'SendOutboundFile',
  PublishCompletedEvent = 'PublishCompletedEvent',
  Success = 'Success',
}

export default workflow(function (config) {
  const srcBucket = config.ops_cdk?.data?.destBuckets?.externalData.name

  if (!srcBucket) {
    return undefined
  }

  return {
    event: {
      source: ['aws.s3'],
      detailType: ['Object Created'],
      detail: {
        bucket: {
          name: [srcBucket],
        },
        object: {
          key: [
            {
              // Temporarily only process for santa-clara/outbound/referrals
              // while verifying everything works.
              prefix: 'santa-clara/outbound/referrals',
              //wildcard: '*/outbound/*'
            },
          ],
        },
      },
    },
    startAt: State.SendOutboundFile,
    states: {
      [State.SendOutboundFile]: SendOutboundFile({
        flowName: _FLOW_NAME,
        next: State.PublishCompletedEvent,
      }),
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
