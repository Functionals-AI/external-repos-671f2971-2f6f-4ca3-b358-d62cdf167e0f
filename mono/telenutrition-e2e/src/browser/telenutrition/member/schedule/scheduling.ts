import { Result, ok, err } from 'neverthrow'

import { ErrCode } from '@mono/common/lib/error'
import { IContext } from '@mono/common/lib/context'
import { createBrowserContext, destroyBrowserContext, E2EBrowserContext } from '../../../e2e-context'

import { E2EScheduleVerificationMethods, E2EScheduleVerificationMethod } from './base'
import { e2EScheduleEmail } from './email'
import { e2EScheduleSMS } from './sms'
import { e2EScheduleEnrollmentToken } from './enrollment-token'
import { JsonObject } from '@mono/common-flows/lib/builder'
export { Page } from 'playwright'

const MTAG = ['telenutrition-e2e', 'browser', 'telenutrition', 'member', 'schedule', 'scheduling']

export async function e2ESchedule(context: IContext, e2EContext: E2EBrowserContext, method: E2EScheduleVerificationMethod): Promise<Result<void, ErrCode>> {
  const { logger, config } = context
  const { browser, browserContext, page, baseUrl } = e2EContext
  const TAG = [...MTAG, 'e2ESchedule']

  if (config.env === 'production') {
    logger.error(context, TAG, `Cannot run on ${config.env} environment`)

    return err(ErrCode.ENVIRONMENT_NOT_SUPPORTED)
  }

  try {
    // Subscribe to 'request', 'response', and error events.
    if (e2EContext?.extendedLogging !== undefined && e2EContext?.extendedLogging === true) {
      page.on('request', async request => {
        logger.info(context, TAG, `on request >> ${request.method()} ${request.url()}`)
      })

      page.on('response', async response => {
        logger.info(context, TAG, `on response << ${response.status()} ${response.url()}`)
      })

      page.on('requestfailed', async request => {
        logger.info(context, TAG, `on requestfailed request.method() >> ${request.method()}`)
        logger.info(context, TAG, `on requestfailed >> ${request.url()} ${request.failure()?.errorText}`)
        logger.info(context, TAG, `on requestfailed request.headers() >> ${JSON.stringify(request.headers(), null, 2)}`)
        logger.info(context, TAG, `on requestfailed request.postData() >> ${request.postData()}`)
      })

      page.on('pageerror', exception => {
        logger.info(context, TAG, `on pageerror Uncaught exception: "${JSON.stringify(exception, null, 2)}"`)
      })

      page.on('console', msg => {
        logger.info(context, TAG, `on console: ${JSON.stringify(msg, null, 2)}`)
      })
    }

    switch (method) {
      case E2EScheduleVerificationMethods.Email:
        const emailResult = await e2EScheduleEmail(context, e2EContext)

        if (emailResult.isErr()) {
          logger.error(context, TAG, 'Error running e2e email test.', {
            error: emailResult.error
          })
    
          return err(emailResult.error)
        }
        return emailResult
        break;
      case E2EScheduleVerificationMethods.SMS:
        const smsResult = await e2EScheduleSMS(context, e2EContext)

        if (smsResult.isErr()) {
          logger.error(context, TAG, 'Error running e2e SMS test.', {
            error: smsResult.error
          })
    
          return err(smsResult.error)
        }
        return smsResult
        break;
      case E2EScheduleVerificationMethods.EnrollmentToken:
        const tokenResult = await e2EScheduleEnrollmentToken(context, e2EContext)

        if (tokenResult.isErr()) {
          logger.error(context, TAG, 'Error running e2e Enrollment Token test.', {
            error: tokenResult.error
          })
    
          return err(tokenResult.error)
        }
        return tokenResult
        break;
      default:
        logger.error(context, TAG, `Unknown verification method: ${method}`)
        return err(ErrCode.INVALID_CONFIG)
    }

    return ok(undefined)
  } catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  } finally {
    /*****************************************************
    ***** CLEAN UP CREATED OBJECTS & GENERATE REPORT *****
    *****************************************************/
  }
}

export async function runBrowserE2E(context: IContext, debug: boolean, headed: boolean, verificationMethod: E2EScheduleVerificationMethod): Promise<Result<JsonObject, ErrCode>> {
  const { logger } = context
  const TAG = [ ...MTAG, 'runBrowserE2E' ]

  try {
    const createBrowserContextResult = await createBrowserContext(context, debug, headed)

    if (createBrowserContextResult.isErr()) {
      return err(createBrowserContextResult.error)
    }
  
    logger.info(context, TAG, `\t\tContext created\n`)
  
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
    logger.exception(context, `${TAG}.error`, e)
    return err(ErrCode.EXCEPTION)
  }
}

export default {
  e2ESchedule,
  runBrowserE2E
}
