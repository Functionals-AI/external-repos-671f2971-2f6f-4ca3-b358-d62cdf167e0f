import { Result, ok, err } from 'neverthrow'
import { ErrCode } from '@mono/common/lib/error'
import { workflow, task, JsonObject, succeed, TaskBuilder } from '@mono/common-flows/lib/builder'
import { IContext } from '@mono/common/lib/context'
import { E2EScheduleVerificationMethod, E2EScheduleVerificationMethods } from '../browser/telenutrition/member/schedule/base'
import { e2ESchedule } from '../browser/telenutrition/member/schedule/scheduling'
import { createBrowserContext, destroyBrowserContext } from '../browser/e2e-context'

const MTAG = [ 'telenutrition-e2e', 'flows', 'browser-schedule-email' ]

enum State {
  E2ESchedulingEmail = 'E2ESchedulingEmail',
  Success = 'Success'
}

export interface E2EScheduleOptions extends Omit<TaskBuilder, 'handler' | 'type'> {
   verificationMethod: E2EScheduleVerificationMethod
}

/**
 * Patient Schedule
 * @param options Schedule options used to configure task
 * verificationMethod - Email, SMS, or EnrollmentToken
 */
export function schedule(options: E2EScheduleOptions): TaskBuilder {
  const { verificationMethod } = options

  return task({
    ...options,
    handler: async function (context: IContext, input: JsonObject): Promise<Result<JsonObject, ErrCode>> {
      const { logger } = context
      const headed = input?.headed !== undefined ? (input?.headed === 'true' ? true : false) : false
      const debug = input?.debug !== undefined ? (input?.debug === 'true' ? true : false) : false

      try {
        const createBrowserContextResult = await createBrowserContext(context, debug, headed)

        if (createBrowserContextResult.isErr()) {
          return err(createBrowserContextResult.error)
        }

        console.log(`\t\tContext created\n`)

        const browserContext = createBrowserContextResult.value
        const result = await e2ESchedule(context, browserContext, verificationMethod)

        if (result.isErr()) {
          return err(result.error)
        }
        const destroyContextResult = await destroyBrowserContext(context, browserContext)

        if (destroyContextResult.isErr()) {
          return err(destroyContextResult.error)
        }

        return ok({})
      } catch (e) {
        logger.exception(context, '', e)
        return err(ErrCode.EXCEPTION)
      }
    }
  })
}

export default workflow(function (config) {
  return {
    rate: '1 day',
    startAt: State.E2ESchedulingEmail,
    states: {
      [State.E2ESchedulingEmail]: schedule({
        verificationMethod: E2EScheduleVerificationMethods.Email,
        next: State.Success
      }),
      [State.Success]: succeed()
    }
  }
})
