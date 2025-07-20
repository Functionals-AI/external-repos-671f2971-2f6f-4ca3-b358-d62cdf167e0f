/**
 * Given new "user activities" (telenutrition.activity_user), execute "incentive rules" associated with
 * "incentives" and "incentive contracts" to identify completed activities which are rewardable, and
 * grant the reward.
 */
import { ok, err } from 'neverthrow'

import { IContext } from '@mono/common/lib/context'
import { JsonObject, choice, succeed, task, workflow } from '@mono/common-flows/lib/builder'
import Activity from '@mono/telenutrition/lib/activity'
import { UserRewardable } from '@mono/telenutrition/lib/rewards/service'
import Rewards from '@mono/telenutrition/lib/rewards'

const MTAG = [ 'telenutrition-flows', 'incentives-grant-rewards' ]

enum State {
  InitInput = 'InitInput',
  ExtractContracts = 'ExtractContracts',
  ProcessContracts = 'ProcessContracts',
  BranchOnProcessedContracts = 'BranchOnProcessedContracts',
  GrantRewards = 'GrantRewards',
  Success = 'Success',
}

export default workflow(function(_config) {
  return {
    event: {
      bus: Activity.Events.eventBusName,
      source: [ 'foodsmart' ],
      detailType: [ Activity.Events.EventTypes.UserActivitiesCreated ],
    },
    startAt: State.InitInput,
    states: {
      [State.InitInput]: task({
        handler: async (context, input) => {
          return ok({
            //
            // WRT dry_run, if explicity provided use it, otherwise force dry_run in production.
            //
            // This implies when the flow is run automatically, it will run in dry run mode.
            // Once, we are comfortable it is working properly after manual invokations in production,
            // dry run will default to false.
            //
            dry_run: input.dry_run !== undefined ? (input.dry_run === true ? 'true' : 'false') : 'false',
          } as JsonObject)
        },
        next: State.ExtractContracts,
      }),
      [State.ExtractContracts]: task({
        handler: async (context: IContext, _input) => {
          const result = await Rewards.Service.getIncentiveContracts(context)

          if (result.isErr()) {
            return err(result.error)
          }

          return ok({ contracts: result.value as any });
        },
        output: function (output, input) {
          return {
            ...input,
            ...output,
          }
        },
        next: State.ProcessContracts,
      }),
      [State.ProcessContracts]: task({
        handler: async (context: IContext, input: any) => {
          const { logger } = context
          const TAG = [ ...MTAG, State.ProcessContracts]

          const result = await Rewards.Service.processIncentiveContracts(context, input.contracts)

          if (result.isErr()) {
            return err(result.error)
          }

          logger.info(context, TAG, 'Processed contracts.', {
            rewardables_count: result.value.length
          })
          return ok({ rewardables: result.value as any });
        },
        output: function (output, input) {
          return {
            ...input,
            ...output,
          }
        },
        next: State.BranchOnProcessedContracts,
      }),
      //
      // On a dry run, skip granting of rewards.
      //
      [State.BranchOnProcessedContracts]: choice({
        choices: [
          {
            variable: '$.dry_run',
            stringEquals: 'true',
            next: State.Success,
          }
        ],
        default: State.GrantRewards,
      }),
      [State.GrantRewards]: task({
        handler: async (context, input) => {
          const { logger } = context
          const TAG = [ ...MTAG, State.GrantRewards]
          const rewardables: UserRewardable[] = input.rewardables as UserRewardable[]

          const result = await Rewards.Service.grantRewards(context, rewardables)

          if (result.isErr()) {
            return err(result.error)
          }

          logger.info(context, TAG, 'Rewards granted.', {
            rewardables_count: rewardables.length,
            granted_count: result.value.length
          })

          return ok({ granted: result.value as any })
        },
        output: function(output, input) {
          return {
            ...input,
            ...output,
          }
        },
        next: State.Success,
      }),
      [State.Success]: succeed()
    }
  }
})
