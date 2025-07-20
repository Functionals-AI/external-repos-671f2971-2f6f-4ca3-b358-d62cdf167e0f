import {ok, err} from 'neverthrow'
import {workflow, task, JsonObject, WorkflowBuilder} from '@mono/common-flows/lib/builder'
import Payment from '@mono/telenutrition/lib/scheduling/payment'
import { DateTime } from 'luxon'

enum State {
  CheckPaymentEligibility = 'CheckPaymentEligibility'
}

export default workflow(function (_config) {
  const builder: WorkflowBuilder = {
    rate: '1 day',
    startAt: State.CheckPaymentEligibility,
    states: {
      [State.CheckPaymentEligibility]: task({
        handler: async (context, _input) => {
          const date = DateTime.now().plus({ days: 1 }).toJSDate()

          const result = await Payment.Service.performAppointmentEligibilityChecks(context, date)

          if (result.isErr()) {
            return err(result.error)
          }

          const success = result.value

          return ok({success} as JsonObject)
        },
      }),
    }
  }

  return builder
})