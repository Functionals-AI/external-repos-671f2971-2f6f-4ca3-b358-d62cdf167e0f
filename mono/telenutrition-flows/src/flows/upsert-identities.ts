/**
 * Upsert identities upon completion of eligibility imports.
 */
import { err, ok } from 'neverthrow'

import { JsonObject, task, workflow } from '@mono/common-flows/lib/builder'
import { EventTypes, detailType } from '@mono/common-flows/lib/tasks/aws/eventbridge'
import { upsertIdentities } from '@mono/telenutrition/lib/eligibility/service'

//
// Eligibility import flow name. Would be nice to import from the flow, but that's in the OPs domain.
//
const IMPORT_FLOW_NAME = 'eligibility-import-legacy'

enum State {
  UpsertIdentities = 'UpsertIdentities',
  Success = 'Success',
}

export default workflow(function(_config) {
  return {
    //
    // Trigger upon whenever an eligibility import has been completed.
    //
    event: {
      bus: 'default',
      source: [ 'foodsmart' ],
      detailType: [ detailType({
        type: EventTypes.FlowCompleted,
        domain: 'ops',
        flowName: IMPORT_FLOW_NAME,
      }) ],
    },
    startAt: State.UpsertIdentities,
    states: {
      [State.UpsertIdentities]: task({
        handler: async (context, _input) => {
          const result = await upsertIdentities(context) 

          if (result.isErr()) {
            return err(result.error)
          }
          return ok(result.value as any as JsonObject)
        },
      })
    }
  }
})
