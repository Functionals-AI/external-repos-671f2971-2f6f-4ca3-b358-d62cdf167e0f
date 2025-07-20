import {ok, err} from 'neverthrow'
import {task, workflow} from '@mono/common-flows/lib/builder'
import Cio from '@mono/common/lib/integration/customerio'
import Appointment from '@mono/telenutrition/lib/scheduling/appointment'

enum State {
  SyncCancelledAppointments = 'SyncCancelledAppointments',
}

export default workflow(function (_config) {
  return {
    rate: '1 hour',
    startAt: State.SyncCancelledAppointments,
    states: {
      [State.SyncCancelledAppointments]: task({
        handler: async (context, _input) => {
          const getCancelledAppointmentIdsResults = await Appointment.Service.getCancelledAppointmentIds(context)

          if (getCancelledAppointmentIdsResults.isErr()) {
            return err(getCancelledAppointmentIdsResults.error)
          }

          const appointmentIds = getCancelledAppointmentIdsResults.value
          const cioUpdate = await Cio.Service.updateCollection(context, 'cancelled_appointments', appointmentIds.map(id => ({ id })))
          if (cioUpdate.isErr()) {
            return err(cioUpdate.error)
          }

          return ok({})
        },
      }),
    }
  }
})

