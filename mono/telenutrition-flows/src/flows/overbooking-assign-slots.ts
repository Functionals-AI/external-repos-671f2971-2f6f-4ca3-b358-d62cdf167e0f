import {ok, err} from 'neverthrow'
import {workflow, task, JsonObject, WorkflowBuilder} from '@mono/common-flows/lib/builder'
import Vacancy from "@mono/telenutrition/lib/scheduling/vacancy";

enum State {
  AssignOverbookingSlots = 'AssignOverbookingSlots'
}

export default workflow(function (_config) {
  const builder: WorkflowBuilder = {
    cron: '45 * * * ? *',
    startAt: State.AssignOverbookingSlots,
    states: {
      [State.AssignOverbookingSlots]: task({
        handler: async (context, _input) => {
          const result = await Vacancy.Service.autoAssignOverbookingSlots(context)

          if (result.isErr()) {
            return err(result.error)
          }

          return ok({...result.value} as JsonObject)
        },
      }),
    }
  }

  return builder
})