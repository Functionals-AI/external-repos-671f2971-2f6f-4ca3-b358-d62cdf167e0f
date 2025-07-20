import {ok, err} from 'neverthrow'
import {workflow, task, WorkflowBuilder} from '@mono/common-flows/lib/builder'
import Zoom from '@mono/common/lib/integration/zoom'
import Appointment from '@mono/telenutrition/lib/scheduling/appointment'

export default workflow(function (_config) {
  const builder: WorkflowBuilder = {
    rate: '6 hours',
    startAt: 'SyncMeetingParticipants',
    states: {
      SyncMeetingParticipants: task({
        handler: async (context, input) => {
          const limit = typeof input['limit'] === 'number' ? input['limit'] : 1
          const meetingIdsResult = await Appointment.Store.selectPastMeetingIds(context, { numDays: limit })
          if (meetingIdsResult.isErr()) {
            return err(meetingIdsResult.error)
          }
          const meetingIds = meetingIdsResult.value
          const result = await Zoom.Sync.syncMeetingParticipants(context, meetingIds);

          if (result.isErr()) {
            return err(result.error)
          }
          return ok(result.value.length as any)
        },
      }),
    }
  }

  return builder
})

