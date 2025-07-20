import { err, ok, Result } from "neverthrow";
import { JsonObject, succeed, task, workflow } from '@mono/common-flows/lib/builder'

import { IContext } from '@mono/common/lib/context'
import { ErrCode } from "@mono/common/lib/error"

const MTAG = [ 'telenutrition-e2e', 'flows', 'health-check' ]

enum State {
  E2EStackHealthCheck = 'E2EStackHealthCheck',
  Success = 'Success'
}

export default workflow(function (config) {
  return {
    rate: '1 day',
    startAt: State.E2EStackHealthCheck,
    states: {
      [State.E2EStackHealthCheck]: task({
        handler: async function (context: IContext, input: JsonObject): Promise<Result<JsonObject, ErrCode>> {
          const { logger } = context
          const TAG = [...MTAG, 'E2EStackHealthCheck']

          try {
            logger.info(context, TAG, 'Telenutrition E2E Stack operational.')

            return ok({msg: "Telenutrition E2E Stack operational."})
          } catch (e) {
            logger.exception(context, 'Telenutrition E2E Stack failed to execute health check flow.', e)
            return err(ErrCode.EXCEPTION)
          }
        },
        next: State.Success
      }),
      [State.Success]: succeed()
    }
  }
})
