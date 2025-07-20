/**
 * Test task retries. Specifically:
 * 
 * 1.a. Success, no retry needed. 
 *    - No retry  configured.
 * 1.b. Success, no retry needed.
 *    - Retry configured  with empty  object implying all defaults.
 * 1.c. Failure, no retry configured or executed.
 *    - No retry configured.
 * 2. Failure, all retries failed. 
 *    - Retry configured with empty object implying all defaults.
 * 3. Failure, first and only retry failed.
 *    - maxAttempts = 1
 * 4. Success on first retry.
 *    - maxAttempts = 2
 * 5. Success on final retry.
 *    - maxAttempts = 2
 * 6. Success on firsst retry, interval of 20 for an initial delay.
 *    - interval = 20
 * 7. Success on final retry, maxDelay of 2.
 *    - interval = 1,
 *    - backoffRate = 2
 *    - maxDelay = 4
 *    - maxAttempts = 5
 *    ie:
 *      - t0 -> first execution
 *      - t0 + 1 -> 1st retry
 *      - t0 + 2 -> 2nd retry
 *      - t0 + 4 -> 3rd retry
 *      - t0 + 4 -> 4th retry
 *      - t0 + 4 -> 5th retry
 * 
 * Note, only enables in AWS dev.
 */

import { Result, err, ok } from 'neverthrow'

import { ErrCode } from '@mono/common/lib/error'
import { IContext } from '@mono/common/lib/context'
import { JsonObject, succeed, task, workflow } from '@mono/common-flows/lib/builder'

const MTAG = [ 'common-flows', 'flows', 'test', 'test-retry' ]

enum State {
  SuccessNoRetryConfigured = 'SuccessNoRetryConfigured',
  SuccessRetryConfigured = 'SuccessRetryConfigured',
  FailureNoRetry = 'FailureNoRetry',
  FailureAllRetries = 'FailureAllRetries',
  FailureOnOnlyRetry = 'FailureOnOnlyRetry',
  SuccessOnFirstRetry = 'SuccessOnFirstRetry',
  SuccessOnFinalRetry = 'SuccessOnFinalRetry',
  SuccessOnRetryInitialDelay = 'SuccessOnRetryInitialDelay',
  SuccessOnFinalRetryMaxDelay = 'SuccessOnFinalRetryMaxDelay',
  Success = 'Success'
}

class TaskState {
  id: string
  retry: number

  constructor(id: string) {
    this.id = id
    this.retry = Number(process.env['RETRY_COUNT'] ?? 0)
  }

  isRetry() {
    return this.retry > 0
  }
}

const taskStates = {
  [State.SuccessNoRetryConfigured]: new TaskState('SuccessNoRetryConfigured'),
  [State.SuccessRetryConfigured]: new TaskState('SuccessRetryConfigured'),
  [State.FailureNoRetry]: new TaskState('FailureNoRetry'),
  [State.FailureAllRetries]: new TaskState('FailureAllRetries'),
  [State.FailureOnOnlyRetry]: new TaskState('FailureOnOnlyRetry'),
  [State.SuccessOnFirstRetry]: new TaskState('SuccessOnFirstRetry'),
  [State.SuccessOnFinalRetry]: new TaskState('SuccessOnFinalRetry'),
  [State.SuccessOnRetryInitialDelay]: new TaskState('SuccessOnRetryInitialDelay'),
  [State.SuccessOnFinalRetryMaxDelay]: new TaskState('SuccessOnFinalRetryMaxDelay'),
}

export default workflow(function(config) {
  if (!config.isDevelopment) {
    console.log(`Flow skipped in environment.`, {
      env: config.env,
    })
    //
    // No need to test basic flow infra. in non-development environments.
    //
    return
  }
  return {
    startAt: State.SuccessNoRetryConfigured,
    states: {
      // 1.a. Success, no retry needed. 
      [State.SuccessNoRetryConfigured]: task({
        handler: async function(context: IContext): Promise<Result<JsonObject, ErrCode>> {
          const { logger } = context
          const TAG = [ ...MTAG, State.SuccessNoRetryConfigured ]

          logger.info(context, TAG, 'Success with no retry configured.')

          return ok({})
        },
        next: State.SuccessRetryConfigured,
      }),
      // 1.b. Success, no retry needed.
      [State.SuccessRetryConfigured]: task({
        handler: async function(context: IContext): Promise<Result<JsonObject, ErrCode>> {
          const { logger } = context
          const TAG = [ ...MTAG, State.SuccessRetryConfigured ]

          logger.info(context, TAG, 'Success with retry configured.')

          return ok({})
        },
        retry: {},
        next: State.FailureNoRetry,
      }),
      // 1.c. Failure, no retry configured or executed.
      [State.FailureNoRetry]: task({
        handler: async function(context: IContext): Promise<Result<JsonObject, ErrCode>> {
          const { logger } = context
          const TAG = [ ...MTAG, State.FailureNoRetry ]

          logger.error(context, TAG, 'Failure with no retry configured.')

          return err(ErrCode.SERVICE)
        },
        catch: {
          next: State.FailureAllRetries,
        },
        next: State.FailureAllRetries
      }),
      // 2. Failure, all retries failed. 
      [State.FailureAllRetries]: task({
        handler: async function(context: IContext, input: JsonObject): Promise<Result<JsonObject, ErrCode>> {
          const { logger } = context
          const TAG = [ ...MTAG, State.FailureAllRetries ]

          const state = taskStates[State.FailureAllRetries]

          logger.error(context, TAG, 'Failure with default retry policy.', { 
            retry: state.retry,
          })

          return err(ErrCode.SERVICE)
        },
        retry: {},
        catch: {
          next: State.FailureOnOnlyRetry,
        },
        next: State.FailureOnOnlyRetry,
      }),
      // 3. Failure, first and only retry failed.
      [State.FailureOnOnlyRetry]: task({
        handler: async function(context: IContext, input: JsonObject): Promise<Result<JsonObject, ErrCode>> {
          const { logger } = context
          const TAG = [ ...MTAG, State.FailureOnOnlyRetry ]

          const state = taskStates[State.FailureOnOnlyRetry]

          logger.error(context, TAG, 'Failure on only retry.', {
            retry: state.retry,
          })

          return err(ErrCode.SERVICE)
        },
        retry: {
          maxAttempts: 1,
        },
        catch: {
          next: State.SuccessOnFirstRetry,
        },
        next: State.SuccessOnFirstRetry,
      }),
      // 4. Success on first retry.
      [State.SuccessOnFirstRetry]: task({
        handler: async function(context: IContext, input: JsonObject): Promise<Result<JsonObject, ErrCode>> {
          const { logger } = context
          const TAG = [ ...MTAG, State.SuccessOnFirstRetry ]

          const state = taskStates[State.SuccessOnFirstRetry]

          if (!state.isRetry()) {
            logger.error(context, TAG, 'Error on initial invokation.', {
              retry: state.retry,
            })
          
            return err(ErrCode.SERVICE)
          }
          logger.info(context, TAG, 'Success on first retry.', {
            retry: state.retry,
          })

          return ok({})
        },
        retry: {
          maxAttempts: 2,
        },
        next: State.SuccessOnFinalRetry,
      }),
      // 5. Success on final retry.
      [State.SuccessOnFinalRetry]: task({
        handler: async function(context: IContext, input: JsonObject): Promise<Result<JsonObject, ErrCode>> {
          const { logger } = context
          const TAG = [ ...MTAG, State.SuccessOnFinalRetry ]

          const state = taskStates[State.SuccessOnFinalRetry]

          if (!state.isRetry()) {
            logger.error(context, TAG, 'Error on initial invokation.', {
              retry: state.retry,
            })
          
            return err(ErrCode.SERVICE)
          }
          else if (state.retry === 2) {
            logger.info(context, TAG, 'Success on final retry.', {
              retry: state.retry,
            })

            return ok({})
          }
          else {
            logger.error(context, TAG, 'Error on retry.', {
              retry: state.retry,
            })

            return err(ErrCode.SERVICE)
          }
        },
        retry: {
          maxAttempts: 2,
        },
        next: State.SuccessOnRetryInitialDelay,
      }),
      // 6. Success on first retry, interval of 20 for an initial delay.
      [State.SuccessOnRetryInitialDelay]: task({
        handler: async function(context: IContext, input: JsonObject): Promise<Result<JsonObject, ErrCode>> {
          const { logger } = context
          const TAG = [ ...MTAG, State.SuccessOnRetryInitialDelay ]

          const state = taskStates[State.SuccessOnRetryInitialDelay]

          logger.debug(context, TAG, 'Invoking.', {
            retry: state.retry,
          })

          if (!state.isRetry()) {
            logger.error(context, TAG, 'Error on initial invokation.', {
              retry: state.retry,
            })
          
            return err(ErrCode.SERVICE)
          }
          logger.info(context, TAG, 'Success on first retry.', {
            retry: state.retry,
          })

          return ok({})
        },
        retry: {
          interval: 20,
        },
        next: State.SuccessOnFinalRetryMaxDelay,
      }),
      // 7. Success on final retry, maxDelay of 2.
      [State.SuccessOnFinalRetryMaxDelay]: task({
        handler: async function(context: IContext, input: JsonObject): Promise<Result<JsonObject, ErrCode>> {
          const { logger } = context
          const TAG = [ ...MTAG, State.SuccessOnFinalRetryMaxDelay ]

          const state = taskStates[State.SuccessOnFinalRetryMaxDelay]

          if (!state.isRetry()) {
            logger.error(context, TAG, 'Error on initial invokation.', {
              retry: state.retry,
            })
          
            return err(ErrCode.SERVICE)
          }
          else if (state.retry === 5) {
            logger.info(context, TAG, 'Success on final retry.', {
              retry: state.retry,
            })

            return ok({})
          }
          else {
            logger.error(context, TAG, 'Error on retry.', {
              retry: state.retry
            })

            return err(ErrCode.SERVICE)
          }
        },
        retry: {
          interval: 1,
          backoffRate: 2,
          maxDelay: 4,
          maxAttempts: 5,
        },
        next: State.Success,
      }),
      [State.Success]: succeed(),
    }
  }
})