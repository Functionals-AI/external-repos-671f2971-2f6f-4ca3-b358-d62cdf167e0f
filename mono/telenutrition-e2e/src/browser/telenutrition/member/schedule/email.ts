import { Result, ok, err } from 'neverthrow'

import { ErrCode } from '@mono/common/lib/error'
import { IContext } from '@mono/common/lib/context'
import { E2EBrowserContext } from '../../../e2e-context'
import { E2EScheduleVerificationMethods } from './base'
import { createMockMemberData, getVerificationCode } from '../../../../util/data/seed/member'
import { initialSignup, verificationCodeEntry, setMemberPassword, scheduleForSelf, insuranceVisit, scheduleByTime, appointmentTimeSlotPicker, agreeAndSchedule, visitScheduleConfirmation } from './pages'

const MTAG = ['telenutrition-e2e', 'browser', 'telenutrition', 'member', 'schedule', 'email']
const SCHEDULE_METHOD = E2EScheduleVerificationMethods.Email

/**
 * This function is responsible for end-to-end testing of appointment scheduling via Email
 * @param {IContext} context - The `context` parameter refers to the context or environment in
 * which the function is being executed. It contains any other relevant global context needed for the
 * function to operate.
 * @param {E2EBrowserContext} e2EContext - The `e2EContext` parameter is of type `E2EBrowserContext`
 * and is used to provide context information related to end-to-end testing in a browser environment.
 * This context may include information such as the browser instance, page elements, test
 * configurations, and other relevant data needed for testing
 */
export async function e2EScheduleEmail(context: IContext, e2EContext: E2EBrowserContext): Promise<Result<void, ErrCode>> {
  const { logger, config } = context
  const { page, baseUrl } = e2EContext
  const TAG = [...MTAG, 'e2EScheduleEmail']

  if (config.env === 'production') {
    logger.error(context, TAG, `Cannot run on ${config.env} environment`)

    return err(ErrCode.ENVIRONMENT_NOT_SUPPORTED)
  }

  const url = baseUrl ?? config.telenutrition_web.baseUrl
  logger.info(context, TAG, `url: ${url}`)
  try {
    const memberResult = await createMockMemberData(context)

    if (memberResult.isErr()) {
      logger.error(context, TAG, 'Error getting member seed data.', {
        error: memberResult.error
      })

      return err(memberResult.error)
    }

    const memberConfig = memberResult.value
    logger.info(context, TAG, `memberConfig: ${JSON.stringify(memberConfig, null, 2)}`)
    await page.goto(url)
    const title = await page.title()
    logger.info(context, TAG, title)

    // Initial Signup
    const initialSignupResult = await initialSignup(context, e2EContext, SCHEDULE_METHOD, memberConfig)
    if (initialSignupResult.isErr()) {
      return err(initialSignupResult.error)
    }

    //
    // Pull the verification code emailed to member directly from the database.
    //
    const verificationCodeResult = await getVerificationCode(context, e2EContext, SCHEDULE_METHOD, memberConfig)
    if (verificationCodeResult.isErr()) {
      return err(verificationCodeResult.error)
    }

    const verificationCode = verificationCodeResult.value

    const verificationCodeEntryResult = await verificationCodeEntry(context, e2EContext, verificationCode)
    if (verificationCodeEntryResult.isErr()) {
      return err(verificationCodeEntryResult.error)
    }

    //
    // Create password
    //
    const setMemberPasswordResult = await setMemberPassword(context, e2EContext, memberConfig.password)
    if (setMemberPasswordResult.isErr()) {
      return err(setMemberPasswordResult.error)
    }
  
    //
    // Schedule for self
    //
    const scheduleForSelfResult = await scheduleForSelf(context, e2EContext, memberConfig)
    if (scheduleForSelfResult.isErr()) {
      return err(scheduleForSelfResult.error)
    }

    //
    // Get patient ID from URL
    //
    const patientIdUrl = new URL(page.url())
    const patientId = patientIdUrl.searchParams.get('patient_id')
    logger.info(context, TAG, `patientId: ${patientId}`)

    //
    // Insurance or employer
    //
    const insurerVisitResult = await insuranceVisit(context, e2EContext, memberConfig)
    if (insurerVisitResult.isErr()) {
      return err(insurerVisitResult.error)
    }

    //
    // Schedule by time or...
    //
    const scheduleByTimeResult = await scheduleByTime(context, e2EContext)
    if (scheduleByTimeResult.isErr()) {
      return err(scheduleByTimeResult.error)
    }

    //
    // Schedule first available appointment appointment
    //
    const appointmentTimeSlotPickerResult = await appointmentTimeSlotPicker(context, e2EContext)
    if (appointmentTimeSlotPickerResult.isErr()) {
      return err(appointmentTimeSlotPickerResult.error)
    }

    //
    // Agreement
    //
    const agreeAndScheduleResult = await agreeAndSchedule(context, e2EContext)
    if (agreeAndScheduleResult.isErr()) {
      return err(agreeAndScheduleResult.error)
    }

    //
    // Confirmation
    //
    const visitScheduleConfirmationResult = await visitScheduleConfirmation(context, e2EContext)
    if (visitScheduleConfirmationResult.isErr()) {
      return err(visitScheduleConfirmationResult.error)
    }

    await page.waitForTimeout(4000) // For visible testing, update later.

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
