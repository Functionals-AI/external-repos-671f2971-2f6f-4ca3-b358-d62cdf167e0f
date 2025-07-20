import {ok, err} from 'neverthrow'
import {workflow, task, WorkflowBuilder} from '@mono/common-flows/lib/builder'
import Scheduling from '@mono/telenutrition/lib/scheduling'


export default workflow(function (_config) {
  const builder: WorkflowBuilder = {
    cron: '30 23 * * ? *',
    startAt: 'RemapZoomLinks',
    states: {
      RemapZoomLinks: task({
        handler: async (context, input) => {

          const limit = typeof input['limit'] === 'number' ? input['limit'] : undefined
          const result = await Scheduling.Sync.updateMeetingLinks(context, { limit })

          if (result.isErr()) {
            return err(result.error)
          }

          return ok(result.value as any)
        },
      }),
    }
  }

  return builder
})

