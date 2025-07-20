import { Result, ok, err } from 'neverthrow'
import { Page } from 'playwright'

import { ErrCode } from '@mono/common/lib/error'
import { IContext } from '@mono/common/lib/context'
import { E2EBrowserContext } from '../../../e2e-context'
import { E2EScheduleVerificationMethod, E2EScheduleVerificationMethods } from './base'
import { E2ERawMemberRecord } from '../../../../util/data/seed/member'
import { saveScreenshot } from '../../../../util/data/file'

const MTAG = ['telenutrition-e2e', 'browser', 'telenutrition', 'member', 'schedule', 'pages']


async function waitForLoader(page: Page, options?: any): Promise<void> {
  await page.waitForFunction(() => {
    const loader = document.getElementById('fullScreenAjaxLoaderDiv')
    return !loader || !loader.style.visibility
  }, options)
  await page.waitForLoadState("networkidle")
}


/**
 * This function handles the initial signup process for a member using the provided context and
 * configuration data.
 * @param {IContext} context - The `context` parameter refers to the context or environment in
 * which the function is being executed. It contains any other relevant global context needed for the
 * function to operate.
 * @param {E2EBrowserContext} e2EContext - The `e2EContext` parameter is of type `E2EBrowserContext`
 * and is used to provide context information related to end-to-end testing in a browser environment.
 * This context may include information such as the browser instance, page elements, test
 * configurations, and other relevant data needed for testing
 * @param {E2EScheduleVerificationMethod} method - E2EScheduleVerificationMethod is a type that
 * represents the method used for schedule verification in an end-to-end testing scenario. It could
 * include options like email verification, SMS verification, or any other method specified in the
 * testing environment.
 * @param {E2ERawMemberRecord} memberConfig - The `memberConfig` parameter in the `initialSignup`
 * function contains information about a new member being signed up, such as their personal details,
 * account settings, or any other relevant information needed for the signup process. This information
 * is in a raw format and will be used during the signup process
 */
export async function initialSignup(context: IContext, e2EContext: E2EBrowserContext, method: E2EScheduleVerificationMethod, memberConfig: E2ERawMemberRecord): Promise<Result<void, ErrCode>> {
  const { logger, config } = context
  const { browser, browserContext, page, baseUrl } = e2EContext
  const TAG = [...MTAG, 'initialSignup']

  try {
    await waitForLoader(page)

    const startScreenshotResult = await saveScreenshot(context, {
      e2e_context: e2EContext,
      tags: [...TAG, 'start']
    })
  
    let dob = memberConfig.dob
    switch (method) {
      case E2EScheduleVerificationMethods.Email:
        await page.locator('button:text("Email")').click()
        await page.getByLabel('Email').click()
        await page.getByLabel('Email').fill(memberConfig.email)
        break;
      case E2EScheduleVerificationMethods.SMS:
        await page.getByRole('button', { name: 'Phone' }).click()
        await page.getByLabel('Phone').click()
        await page.getByLabel('Phone').fill(memberConfig.phone)
        break;
      case E2EScheduleVerificationMethods.EnrollmentToken:
        await page.locator('button:text("Email")').click()
        await page.getByLabel('Email').click()
        await page.getByLabel('Email').fill(memberConfig.email)
        break;
    }

    await page.getByLabel('First Name').click()
    await page.getByLabel('First Name').fill(memberConfig.firstName)
    await page.getByLabel('Last Name').fill(memberConfig.lastName)
    await page.getByLabel('Last Name').press('Tab')
    await page.getByLabel('Birthday').fill(dob)
    await page.getByLabel('Birthday').press('Tab')
    await page.getByLabel('Zip Code').fill(memberConfig.zipcode)
    await page.getByLabel('By checking this box, I have').check()

    await waitForLoader(page)

    const preclickScreenshotResult = await saveScreenshot(context, {
      e2e_context: e2EContext,
      tags: [...TAG, 'preclick']
    })

    await page.getByRole('button', { name: 'Next' }).click()
    
    const endScreenshotResult = await saveScreenshot(context, {
      e2e_context: e2EContext,
      tags: [...TAG, 'end']
    })
  } catch (e) {
    const exceptionScreenshotResult = await saveScreenshot(context, {
      e2e_context: e2EContext,
      tags: [...TAG, 'exception']
    })

    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }

  return ok(undefined)
}

/**
 * This function handles the entry of an email or SMS verification code.
 * @param {IContext} context - The `context` parameter refers to the context or environment in
 * which the function is being executed. It contains any other relevant global context needed for the
 * function to operate.
 * @param {E2EBrowserContext} e2EContext - The `e2EContext` parameter is of type `E2EBrowserContext`
 * and is used to provide context information related to end-to-end testing in a browser environment.
 * This context may include information such as the browser instance, page elements, test
 * configurations, and other relevant data needed for testing
 * @param {string} code - The verification code sent to the user for verification purposes.
 */
export async function verificationCodeEntry(context: IContext, e2EContext: E2EBrowserContext, code: string): Promise<Result<void, ErrCode>> {
  const { logger, config } = context
  const { browser, browserContext, page, baseUrl } = e2EContext
  const TAG = [...MTAG, 'verificationCodeEntry']

  try {
    await waitForLoader(page)

    const startScreenshotResult = await saveScreenshot(context, {
      e2e_context: e2EContext,
      tags: [...TAG, 'start']
    })

    await page.getByLabel('Enter verification code sent').click()
    await page.getByLabel('Enter verification code sent').fill(code)

    await waitForLoader(page)
    
    const preclickScreenshotResult = await saveScreenshot(context, {
      e2e_context: e2EContext,
      tags: [...TAG, 'preclick']
    })

    await page.getByRole('button', { name: 'Verify Code' }).click()

    await waitForLoader(page)

    const endScreenshotResult = await saveScreenshot(context, {
      e2e_context: e2EContext,
      tags: [...TAG, 'end']
    })
  } catch (e) {
    const exceptionScreenshotResult = await saveScreenshot(context, {
      e2e_context: e2EContext,
      tags: [...TAG, 'exception']
    })

    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }

  return ok(undefined)
}

/**
 * This function sets a password for a member.
 * @param {IContext} context - The `context` parameter refers to the context or environment in
 * which the function is being executed. It contains any other relevant global context needed for the
 * function to operate.
 * @param {E2EBrowserContext} e2EContext - The `e2EContext` parameter is of type `E2EBrowserContext`
 * and is used to provide context information related to end-to-end testing in a browser environment.
 * This context may include information such as the browser instance, page elements, test
 * configurations, and other relevant data needed for testing
 * @param {string} password - The password to set for the member:
 */
export async function setMemberPassword(context: IContext, e2EContext: E2EBrowserContext, password: string): Promise<Result<void, ErrCode>> {
  const { logger, config } = context
  const { browser, browserContext, page, baseUrl } = e2EContext
  const TAG = [...MTAG, 'setMemberPassword']

  try {
    await waitForLoader(page)

    const startScreenshotResult = await saveScreenshot(context, {
      e2e_context: e2EContext,
      tags: [...TAG, 'start']
    })

    await page.getByLabel('Password *', { exact: true }).click();
    await page.getByLabel('Password *', { exact: true }).fill(password)
    await page.getByLabel('Password *', { exact: true }).press('Tab')
    await page.getByLabel('Confirm Password').fill(password)

    await waitForLoader(page)
    
    const preclickScreenshotResult = await saveScreenshot(context, {
      e2e_context: e2EContext,
      tags: [...TAG, 'preclick']
    })

    await page.getByRole('button', { name: 'Create Account' }).click()

    await waitForLoader(page)

    const endScreenshotResult = await saveScreenshot(context, {
      e2e_context: e2EContext,
      tags: [...TAG, 'end']
    })
  } catch (e) {
    const exceptionScreenshotResult = await saveScreenshot(context, {
      e2e_context: e2EContext,
      tags: [...TAG, 'exception']
    })

    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }

  return ok(undefined)
}

/**
 * This function selects schedule for self and fills out the form for the current user using the provided 
 * context and member configuration.
 * @param {IContext} context - The `context` parameter refers to the context or environment in
 * which the function is being executed. It contains any other relevant global context needed for the
 * function to operate.
 * @param {E2EBrowserContext} e2EContext - The `e2EContext` parameter is of type `E2EBrowserContext`
 * and is used to provide context information related to end-to-end testing in a browser environment.
 * This context may include information such as the browser instance, page elements, test
 * configurations, and other relevant data needed for testing
 * @param {E2ERawMemberRecord} memberConfig - The `memberConfig` parameter is of type
 * `E2ERawMemberRecord` and likely contains configuration settings or data specific to a member in your
 * application or system. It is being passed as an argument to the `scheduleForSelf` function along
 * with `context` of type `IContext`
 */
export async function scheduleForSelf(context: IContext, e2EContext: E2EBrowserContext, memberConfig: E2ERawMemberRecord): Promise<Result<void, ErrCode>> {
  const { logger, config } = context
  const { browser, browserContext, page, baseUrl } = e2EContext
  const TAG = [...MTAG, 'scheduleForSelf']

  try {
    await waitForLoader(page)

    const startScreenshotResult = await saveScreenshot(context, {
      e2e_context: e2EContext,
      tags: [...TAG, 'start']
    })

    await page.getByRole('button', { name: 'Schedule for Self' }).click()

    await page.getByLabel('Phone').click()
    await page.getByLabel('Phone').fill(memberConfig.phone)
    await page.getByLabel('Email').click()
    await page.getByLabel('Email').fill(memberConfig.email)
    await page.getByLabel('Sex').selectOption(memberConfig.sex)
    await page.getByLabel('Address *').click()
    await page.getByLabel('Address *').fill(memberConfig.addressLine1)
    await page.getByLabel('Address 2').click()
    await page.getByLabel('Address 2').fill(memberConfig.addressLine2)
    await page.getByLabel('City').click();
    await page.getByLabel('City').fill(memberConfig.city)
    await page.getByLabel('State').selectOption(memberConfig.state)

    if (await page.getByText('Not a valid phone number').isVisible()) {
      logger.info(context, TAG, `Not a valid phone number: ${memberConfig.phone}`)
    }

    if (await page.getByLabel('What timezone will you be in during your visit?').isVisible()) {
      await page.getByLabel('What timezone will you be in during your visit?').selectOption({ index: 1 })
    } else if (await page.getByLabel('Timezone').isVisible()) {
      await page.getByLabel('Timezone').selectOption({ index: 1 })
    }

    await waitForLoader(page)
    
    const preclickScreenshotResult = await saveScreenshot(context, {
      e2e_context: e2EContext,
      tags: [...TAG, 'preclick']
    })

    await page.getByRole('button', { name: 'Next' }).click()

    await waitForLoader(page)

    const endScreenshotResult = await saveScreenshot(context, {
      e2e_context: e2EContext,
      tags: [...TAG, 'end']
    })
  } catch (e) {
    const exceptionScreenshotResult = await saveScreenshot(context, {
      e2e_context: e2EContext,
      tags: [...TAG, 'exception']
    })

    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }

  return ok(undefined)
}

/**
 * This function `selfPayVisit` selects self-pay from the available options.
 * @param {IContext} context - The `context` parameter refers to the context or environment in
 * which the function is being executed. It contains any other relevant global context needed for the
 * function to operate.
 * @param {E2EBrowserContext} e2EContext - The `e2EContext` parameter is of type `E2EBrowserContext`
 * and is used to provide context information related to end-to-end testing in a browser environment.
 * This context may include information such as the browser instance, page elements, test
 * configurations, and other relevant data needed for testing
 */
export async function selfPayVisit(context: IContext, e2EContext: E2EBrowserContext): Promise<Result<void, ErrCode>> {
  const { logger, config } = context
  const { browser, browserContext, page, baseUrl } = e2EContext
  const TAG = [...MTAG, 'selfPayVisit']

  try {
    await waitForLoader(page)

    const startScreenshotResult = await saveScreenshot(context, {
      e2e_context: e2EContext,
      tags: [...TAG, 'start']
    })
    
    await page.getByLabel('Is your visit covered by your').selectOption('self-pay')

    await waitForLoader(page)
    
    const preclickScreenshotResult = await saveScreenshot(context, {
      e2e_context: e2EContext,
      tags: [...TAG, 'preclick']
    })

    await page.getByRole('button', { name: 'Next' }).click()
    
    await waitForLoader(page)

    const endScreenshotResult = await saveScreenshot(context, {
      e2e_context: e2EContext,
      tags: [...TAG, 'end']
    })
  } catch (e) {
    const exceptionScreenshotResult = await saveScreenshot(context, {
      e2e_context: e2EContext,
      tags: [...TAG, 'exception']
    })

    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }

  return ok(undefined)
}

/**
 * This function `insuranceVisit` selects insurance from the available options.
 * @param {IContext} context - The `context` parameter refers to the context or environment in
 * which the function is being executed. It contains any other relevant global context needed for the
 * function to operate.
 * @param {E2EBrowserContext} e2EContext - The `e2EContext` parameter is of type `E2EBrowserContext`
 * and is used to provide context information related to end-to-end testing in a browser environment.
 * This context may include information such as the browser instance, page elements, test
 * configurations, and other relevant data needed for testing
 */
export async function insuranceVisit(context: IContext, e2EContext: E2EBrowserContext, memberConfig: E2ERawMemberRecord, insurer = 'Cigna National'): Promise<Result<void, ErrCode>> {
  const { logger, config } = context
  const { browser, browserContext, page, baseUrl } = e2EContext
  const TAG = [...MTAG, 'insuranceVisit']

  try {
    await waitForLoader(page)

    const startScreenshotResult = await saveScreenshot(context, {
      e2e_context: e2EContext,
      tags: [...TAG, 'start']
    })
    
    await page.getByLabel('Is your visit covered by your').selectOption('plan')

    await waitForLoader(page)

    const insurerSelect = page.locator('[name="insurance_id"]')
    await insurerSelect.waitFor()
    
    insurerSelect.selectOption(insurer)

    const groupIdInput = page.locator('[name="group_id"]')
    await groupIdInput.waitFor()
    
    groupIdInput.click()
    groupIdInput.fill(memberConfig?.groupId ?? '')

    const memberIdInput = page.locator('[name="member_id"]')
    await memberIdInput.waitFor()
    
    memberIdInput.click()
    memberIdInput.fill(memberConfig?.memberId ?? '')
    
    await waitForLoader(page)

    const preclickScreenshotResult = await saveScreenshot(context, {
      e2e_context: e2EContext,
      tags: [...TAG, 'preclick']
    })

    await page.getByRole('button', { name: 'Next' }).click()
    
    await waitForLoader(page)

    const endScreenshotResult = await saveScreenshot(context, {
      e2e_context: e2EContext,
      tags: [...TAG, 'end']
    })
  } catch (e) {
    const exceptionScreenshotResult = await saveScreenshot(context, {
      e2e_context: e2EContext,
      tags: [...TAG, 'exception']
    })

    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }

  return ok(undefined)
}

/**
 * This function selects the option to schedule an appointment by time.
 * @param {IContext} context - The `context` parameter refers to the context or environment in
 * which the function is being executed. It contains any other relevant global context needed for the
 * function to operate.
 * @param {E2EBrowserContext} e2EContext - The `e2EContext` parameter is of type `E2EBrowserContext`
 * and is used to provide context information related to end-to-end testing in a browser environment.
 * This context may include information such as the browser instance, page elements, test
 * configurations, and other relevant data needed for testing
 */
export async function scheduleByTime(context: IContext, e2EContext: E2EBrowserContext): Promise<Result<void, ErrCode>> {
  const { logger, config } = context
  const { browser, browserContext, page, baseUrl } = e2EContext
  const TAG = [...MTAG, 'scheduleByTime']

  try {
    await waitForLoader(page)

    const startScreenshotResult = await saveScreenshot(context, {
      e2e_context: e2EContext,
      tags: [...TAG, 'start']
    })

    await waitForLoader(page)
    
    const scheduleSelect = page.locator('[name="scheduleByType"]')
    await scheduleSelect.waitFor()
    
    scheduleSelect.selectOption('Select a time')

    await waitForLoader(page)
    
    const preclickScreenshotResult = await saveScreenshot(context, {
      e2e_context: e2EContext,
      tags: [...TAG, 'preclick']
    })

    await page.getByRole('button', { name: 'Next' }).click()

    await waitForLoader(page)

    const endScreenshotResult = await saveScreenshot(context, {
      e2e_context: e2EContext,
      tags: [...TAG, 'end']
    })
  } catch (e) {
    const exceptionScreenshotResult = await saveScreenshot(context, {
      e2e_context: e2EContext,
      tags: [...TAG, 'exception']
    })

    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }

  return ok(undefined)
}

/**
 * This function will pick the first available appointment time when scheduling a visit.
 * @param {IContext} context - The `context` parameter refers to the context or environment in
 * which the function is being executed. It contains any other relevant global context needed for the
 * function to operate.
 * @param {E2EBrowserContext} e2EContext - The `e2EContext` parameter refers to an end-to-end
 * testing browser context. This context is used for simulating user interactions and
 * testing the application's functionality in a real-world scenario. It contains information such as
 * the browser instance, page elements, and test configurations.
 */
export async function appointmentTimeSlotPicker(context: IContext, e2EContext: E2EBrowserContext): Promise<Result<void, ErrCode>> {
  const { logger, config } = context
  const { browser, browserContext, page, baseUrl } = e2EContext
  const TAG = [...MTAG, 'appointmentTimeSlotPicker']

  try {
    await waitForLoader(page)

    const startScreenshotResult = await saveScreenshot(context, {
      e2e_context: e2EContext,
      tags: [...TAG, 'start']
    })
    /*
      Match button containing 12hr time format: HH:MMAM / H:MMAM / HH:MMPM / H:MMPM e.g. 04:00PM, 4:00PM, 4:00AM
      ^ [0-1] {0,1} [0-9] :  [0-5] [0-9] [A|P] M $
        ꜛ1a   ꜛ1b   ꜛ2    ꜛ3 ꜛ4    ꜛ5    ꜛ6    ꜛ7
      Wrapped with ^ and $ for strict start/end boundaries, but hasText checks for this string anywhere in the button's text.
 
      1a.) [0-1] - Single character (0 or 1)...
      1b.) {0,1} ...zero and one time (optional)
      2.)  [0-9] - Single character between 0 and 9
      3.)  : - Strict match of the character :
      4.)  [0-5] - Single character between 0 and 5
      5.)  [0-9] - Single character between 0 and 9
      6.)  [A|P] - Single character either A or P (case sensitive)
      7.)  M - Strict match of the character M
    */
    await page.getByRole('button').filter({ hasText: /^[0-1]{0,1}[0-9]:[0-5][0-9][A|P]M$/ }).first().click()

    await waitForLoader(page)

    const endScreenshotResult = await saveScreenshot(context, {
      e2e_context: e2EContext,
      tags: [...TAG, 'end']
    })
  } catch (e) {
    const exceptionScreenshotResult = await saveScreenshot(context, {
      e2e_context: e2EContext,
      tags: [...TAG, 'exception']
    })

    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }

  return ok(undefined)
}

/**
 * This function `agreeAndSchedule` takes in a context and an E2E browser context, and returns a
 * promise that resolves to void or an error code.
 * @param {IContext} context - The `context` parameter refers to the context or environment in
 * which the function is being executed. It contains any other relevant global context needed for the
 * function to operate.
 * @param {E2EBrowserContext} e2EContext - The `e2EContext` parameter refers to an end-to-end
 * testing browser context. This context is used for simulating user interactions and
 * testing the application's functionality in a real-world scenario. It contains information such as
 * the browser instance, page elements, and test configurations.
 */
export async function agreeAndSchedule(context: IContext, e2EContext: E2EBrowserContext): Promise<Result<void, ErrCode>> {
  const { logger, config } = context
  const { browser, browserContext, page, baseUrl } = e2EContext
  const TAG = [...MTAG, 'agreeAndSchedule']

  try {
    await waitForLoader(page)

    const startScreenshotResult = await saveScreenshot(context, {
      e2e_context: e2EContext,
      tags: [...TAG, 'start']
    })

    await page.getByLabel('By checking this box, I have').check()

    await waitForLoader(page)
    
    const preclickScreenshotResult = await saveScreenshot(context, {
      e2e_context: e2EContext,
      tags: [...TAG, 'preclick']
    })

    await page.getByRole('button', { name: 'Schedule Visit' }).click()

    await waitForLoader(page)

    const endScreenshotResult = await saveScreenshot(context, {
      e2e_context: e2EContext,
      tags: [...TAG, 'end']
    })
  } catch (e) {
    const exceptionScreenshotResult = await saveScreenshot(context, {
      e2e_context: e2EContext,
      tags: [...TAG, 'exception']
    })

    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }

  return ok(undefined)
}

/**
 * This function `visitScheduleConfirmation` takes in a context and an E2E browser context, and returns a
 * promise that resolves to void or an error code. It checks to ensure an appointment confirmation message
 * exists.
 * @param {IContext} context - The `context` parameter refers to the context or environment in
 * which the function is being executed. It contains any other relevant global context needed for the
 * function to operate.
 * @param {E2EBrowserContext} e2EContext - The `e2EContext` parameter refers to an end-to-end
 * testing browser context. This context is used for simulating user interactions and
 * testing the application's functionality in a real-world scenario. It contains information such as
 * the browser instance, page elements, and test configurations.
 */
export async function visitScheduleConfirmation(context: IContext, e2EContext: E2EBrowserContext): Promise<Result<void, ErrCode>> {
  const { logger, config } = context
  const { browser, browserContext, page, baseUrl } = e2EContext
  const TAG = [...MTAG, 'visitScheduleConfirmation']

  try {
    await waitForLoader(page)

    const startScreenshotResult = await saveScreenshot(context, {
      e2e_context: e2EContext,
      tags: [...TAG, 'start']
    })

    await waitForLoader(page)

    const confirmationText = page.getByText('Your virtual visit has been booked!')
    await confirmationText.waitFor()

    if (!confirmationText.isVisible()) {
      logger.error(context, TAG, `Error locating confirmation message`)

      return err(ErrCode.INVALID_DATA)
    }

    logger.info(context, TAG, 'Successfully booked appointment')

    const endScreenshotResult = await saveScreenshot(context, {
      e2e_context: e2EContext,
      tags: [...TAG, 'end']
    })
  } catch (e) {
    const exceptionScreenshotResult = await saveScreenshot(context, {
      e2e_context: e2EContext,
      tags: [...TAG, 'exception']
    })

    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }

  return ok(undefined)
}
