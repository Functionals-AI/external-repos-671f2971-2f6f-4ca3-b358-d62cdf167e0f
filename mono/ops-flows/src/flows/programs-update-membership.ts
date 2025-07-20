import { err, ok } from 'neverthrow'

import { ErrCode } from '@mono/common/lib/error'
import { JsonObject, succeed, task, workflow } from '@mono/common-flows/lib/builder'
import { EventTypes, detailType } from '@mono/common-flows/lib/tasks/aws/eventbridge'
import { ProgramContract, ProgramMembershipUpdates, getProgramContracts, processProgramContracts, updateProgramMembership } from '@mono/common/lib/programs/service'

const _FLOW_NAME = 'programs-update-membership'

const IMPORT_FLOW_NAME = 'eligibility-import-legacy'

const MTAG = [ 'ops-flows', 'flows', _FLOW_NAME ]

enum State {
  GetProgramContracts = 'GetProgramContracts',
  ProcessProgramContracts = 'ProcessProgramContracts',
  UpdateProgramMembership = 'UpdateProgramMembership',
  DetermineSuccessOrFail = 'DetermineSuccessOrFail',
  Success = 'Success',
}

export default workflow(function(config) {
  return {
    event: {
      bus: 'default',
      source: [ 'foodsmart' ],
      detailType: [ detailType({
        type: EventTypes.FlowCompleted,
        domain: 'ops',
        flowName: IMPORT_FLOW_NAME,
      }) ],
    },
    startAt: State.GetProgramContracts,
    states: {
      [State.GetProgramContracts]: task({
        handler: async (context, input) => {
          const result = await getProgramContracts(context) 

          if (result.isErr()) {
            return err(result.error)
          }
          return ok(result.value as any as JsonObject)
        },
        output: function (output, input) {
          const newOutput = {
            input,
            get_program_contracts_result: output,
          }
    
          return newOutput
        },
        next: State.ProcessProgramContracts,
      }),
      [State.ProcessProgramContracts]: task({
        handler: async (context, input) => {
          const contracts: ProgramContract[] = input['get_program_contracts_result'] as unknown as ProgramContract[]
          const result = await processProgramContracts(context, contracts)

          if (result.isErr()) {
            return err(result.error)
          }

          return ok(result.value as any as JsonObject)
        },
        output: function (output, input) {
          const newOutput = {
            ...input,
            process_program_contracts_result: output,
          }
    
          return newOutput
        },
        next: State.UpdateProgramMembership,
      }),
      [State.UpdateProgramMembership]: task({
        handler: async (context, input) => {
          const updates: ProgramMembershipUpdates[] = (input.process_program_contracts_result as JsonObject).updates as unknown as ProgramMembershipUpdates[]
          const result = await updateProgramMembership(context, updates)

          if (result.isErr()) {
            return err(result.error)
          }

          return ok(result.value as any as JsonObject)
        },
        output: function (output, input) {
          const newOutput = {
            ...input,
            update_program_membership_result: output,
          }
    
          return newOutput
        },
        next: State.DetermineSuccessOrFail,
      }),
      [State.DetermineSuccessOrFail]: task({
        handler: async (context, input) => {
          //
          //
          // {
          //   .
          //   "process_program_contracts_result": {
          //     "processCount": 1,
          //     "processErrorCount": 0,
          //     "updates": ...
          // },
          // "update_program_membership_result": {
          //   "updateCount": 1,
          //   "updateErrorCount": 0,
          //   .
          //
          const inputRecord = input as Record<string, any>
          const success = 
            inputRecord?.process_program_contracts_result?.processErrorCount === 0 && 
            inputRecord?.update_program_membership_result?.updateErrorCount === 0
          
          if (!success) {
            const { logger } = context
            const TAG = [...MTAG, State.DetermineSuccessOrFail]
          
            logger.error(context, TAG, 'Errors encountered in referral processing.', {
              input,
            })
          
            return err(ErrCode.SERVICE)
          }
          return ok(input)
        },
        next: State.Success,
      }),
      [State.Success]: succeed()
    }
  }
})