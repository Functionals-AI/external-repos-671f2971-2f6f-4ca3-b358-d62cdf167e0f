import { err, ok } from 'neverthrow'

import { ErrCode } from '@mono/common/lib/error'
import { fail, parallel, succeed, task, workflow } from '@mono/common-flows/lib/builder'
import { EventTypes, detailType, publishEvent as publishEventTask } from '@mono/common-flows/lib/tasks/aws/eventbridge'
import { Sources as ReferralSources } from '@mono/common/lib/referral/service'
import ReferralsTasks from '../tasks/referrals'
import { _FLOW_NAME as _IMPORT_FLOW_NAME } from './referrals-import-caloptima'

const _DOMAIN = 'ops'
const _SOURCE = 'caloptima'
export const _FLOW_NAME = `referrals-process-${_SOURCE}`

const MTAG = [ 'ops-flows', 'flows', _FLOW_NAME ]

enum State {
  ProcessRequestedReferrals = 'ProcessRequestedReferrals',
  AfterRequested = 'AfterRequested',
  LoadNewLeads = 'LoadNewLeads',
  ProcessAcceptedReferrals = 'ProcessAcceptedReferrals',
  ProcessInProgressReferrals = 'ProcessInProgressReferrals',
  ProcessCompletedReferrals = 'ProcessCompletedReferrals',
  PublishCompletedEvent = 'PublishCompletedEvent',
  DetermineSuccessOrFail = 'DetermineSuccessOrFail',
  Fail = 'Fail',
  Success = 'Success',
}

export default workflow(function(config) {
  const srcBucket = config.ops_cdk?.data?.destBuckets?.externalData.name

  return {
    //
    // Trigger upon completion of referral import. Note, in reality this flow should run periodically,
    // however due to utilization browser interaction on the CalOptimaConnect website, two overlapping
    // flows cannot execute.
    //
    event: {
      bus: 'default',
      source: [ 'foodsmart' ],
      detailType: [ detailType({
        type: EventTypes.FlowCompleted,
        domain: 'ops',
        flowName: _IMPORT_FLOW_NAME,
      }) ],
    },
    startAt: State.ProcessRequestedReferrals,
    states: {
      [State.ProcessRequestedReferrals]: ReferralsTasks.processRequestedReferrals({
        flowName: _FLOW_NAME,
        source: ReferralSources.CalOptima,
        dryRun: false,
        output: function (output, input) {
          const newOutput = {
            input,
            process_requested_result: output,
          }
    
          return newOutput
        },
        next: State.ProcessAcceptedReferrals,
      }),
      [State.ProcessAcceptedReferrals]: ReferralsTasks.processAcceptedReferrals({
        flowName: _FLOW_NAME,
        source: ReferralSources.CalOptima,
        dryRun: false,
        output: function (output, input) {
          const newOutput = {
            ...input,
            process_accepted_result: output,
          }
    
          return newOutput
        },
        next: State.ProcessInProgressReferrals,
      }),
      [State.ProcessInProgressReferrals]: ReferralsTasks.processInProgressReferrals({
        flowName: _FLOW_NAME,
        source: ReferralSources.CalOptima,
        dryRun: false,
        output: function (output, input) {
          const newOutput = {
            ...input,
            process_in_progress_result: output,
          }
    
          return newOutput
        },
        next: State.ProcessCompletedReferrals,
      }),
      [State.ProcessCompletedReferrals]: ReferralsTasks.processCompletedReferrals({
        flowName: _FLOW_NAME,
        source: ReferralSources.CalOptima,
        dryRun: false,
        output: function (output, input) {
          const newOutput = {
            ...input,
            process_completed_result: output,
          }
    
          return newOutput
        },
        next: State.PublishCompletedEvent,
      }),
      [State.PublishCompletedEvent]: publishEventTask({
        eventDetail: {
          type: EventTypes.FlowCompleted,
          domain: _DOMAIN,
          flowName: _FLOW_NAME,
        },
        output: function (output, input) {
          return { ...input, ...output }
        },
        next: State.DetermineSuccessOrFail,
      }),
      [State.DetermineSuccessOrFail]: task({
        handler: async (context, input) => {
          const fail = Object.values(input as Record<string, any>).reduce((fail, result) => fail || result?.num_errors > 0, false)
    
          if (fail) {
            const { logger } = context
            const TAG = [...MTAG, State.DetermineSuccessOrFail]
    
            logger.error(context, TAG, 'Errors encountered in referral processing.', {
              input,
            })
    
            return err(ErrCode.SERVICE)
          }
          return ok(input)
        },
      }),
      [State.Success]: succeed(),
      [State.Fail]: fail(),
    }
  }
})
