import { succeed, workflow } from '@mono/common-flows/lib/builder';
import { EventTypes, publishEvent as publishEventTask } from '@mono/common-flows/lib/tasks/aws/eventbridge';
import { processReferralLifecyclesTaskBuilder } from '../tasks/referrals/process-referral-lifecycles';

const _DOMAIN = 'telenutrition';
const _FLOW_NAME = `referral-lifecycle-process`;

enum State {
  ProcessReferralsLifecycle = 'ProcessReferralLifecycle',
  PublishCompletedEvent = 'PublishCompletedEvent',
  Success = 'Success',
}

export default workflow(function (_config) {
  return {
    rate: '20 minutes',
    event: {
      bus: 'default',
      source: ['foodsmart'],
      domain: _DOMAIN,
      flowName: _FLOW_NAME,
    },
    startAt: State.ProcessReferralsLifecycle,
    states: {
      [State.ProcessReferralsLifecycle]: processReferralLifecyclesTaskBuilder({
        flowName: _FLOW_NAME,
        dryRun: false,
        next: State.Success,
      }),
      PublishCompletedEvent: publishEventTask({
        eventDetail: {
          type: EventTypes.FlowCompleted,
          domain: _DOMAIN,
          flowName: _FLOW_NAME,
        },
      }),
      [State.Success]: succeed(),
    },
  };
});
