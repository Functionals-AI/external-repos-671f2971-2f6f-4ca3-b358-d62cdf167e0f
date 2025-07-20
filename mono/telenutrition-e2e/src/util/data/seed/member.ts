import { faker } from '@faker-js/faker'
import { DateTime } from 'luxon'
import { Result, ok, err } from 'neverthrow'
import { IContext } from '@mono/common/lib/context'
import { ErrCode } from '@mono/common/lib/error'
import { AccountIds } from '@mono/common/lib/account/service'
import { createEligibilityMember, EligibilityMemberRecord, EligibilityMemberGender } from '@mono/common/lib/eligibility/store'
import { createEnrollmentToken } from '@mono/telenutrition/lib/iam/enrollment'
import { E2EBrowserContext } from '../../../browser/e2e-context'
import { E2EScheduleVerificationMethod, E2EScheduleVerificationMethods } from '../../../browser/telenutrition/member/schedule/base'
import Verification from "@mono/telenutrition/lib/verification"
import phone from 'phone'
import countryPhoneData from 'phone/dist/data/country_phone_data'

const MTAG = ['telenutrition-e2e', 'util', 'data', 'seed', 'member']

const _ACCOUNT_ID = AccountIds.CountyCare
const COUNTY_CARE_ORG_ID = 197
const CIGNA_NATIONAL_ORG_ID = 33
const CIGNA_NATIONAL_INSURANCE_ID = 3

const validAreaCodes = countryPhoneData.find(countryPhoneDatum => countryPhoneDatum.alpha3 === 'USA')?.mobile_begin_with || []

export type E2ERawMemberRecord = {
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  zipcode: string,
  dob: string,
  phone: string,
  sex: string,
  addressLine1: string,
  addressLine2: string,
  city: string,
  state: string,
  eligibilityId?: string,
  accountId?: string,
  groupId?: string,
  memberId?: string
}

export interface E2EEligibilityMemberRecord extends EligibilityMemberRecord {
  sex: string,
  password: string
}

async function generateValidMobileTel(context: IContext): Promise<Result<string, ErrCode>> {
  const { logger } = context
  const TAG = [...MTAG, 'generateValidMobileTel']

  try {
    let tel = '';
    for (let i = 0; i < 100; i++) {
      tel = `1${validAreaCodes[Math.floor(Math.random() * validAreaCodes.length)]}${faker.string.numeric({ length: { min: 1, max: 1 }, exclude: ["0", "1"], allowLeadingZeros: false })}${faker.string.numeric({ length: { min: 6, max: 6 }, allowLeadingZeros: true })}`
      if (phone(tel, { country: 'USA', validateMobilePrefix: true }).isValid) {
        return ok(tel)
      }
    }

    throw new Error('Error creating mobile phone number')
  } catch (e) {
    logger.exception(context, TAG, e)
  
    return err(ErrCode.EXCEPTION)
  }
}

export async function createMockMemberData(context: IContext): Promise<Result<E2ERawMemberRecord, ErrCode>> {
  const { logger } = context
  const TAG = [...MTAG, 'createMockMemberData']

  try {
    const telResult = await generateValidMobileTel(context)
    if (telResult.isErr()) {
      return err(telResult.error)
    }
    const tel = telResult.value
    const memberConfig = {
      email: faker.internet.email({ provider: "e2e.foodsmart.com" }),
      password: 'aB8!jks7D7@%gf.',
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      zipcode: '95118', // Forcing to California as other locations may not have available providers. faker.location.zipCode().slice(0, 5),
      dob: `${new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).format(
        faker.date.between({ from: '1920-01-01T00:00:00.000Z', to: '2006-01-01T00:00:00.000Z' })
      )}`,
      phone: tel,
      sex: 'M',
      addressLine1: faker.location.streetAddress({ useFullAddress: false }),
      addressLine2: faker.location.secondaryAddress(),
      city: 'San Jose', // Forcing to California as other locations may not have available providers. faker.location.city(),
      state: 'CA', // Forcing to California as other locations may not have available providers. faker.location.state({ abbreviated: true })
      groupId: faker.number.bigInt({ min: 1000000000 }).toString(),
      memberId: faker.number.bigInt({ min: 1000000000 }).toString()
    }

    return ok(memberConfig)
  } catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export async function createMockEligibleMember(context: IContext, accountId?: number): Promise<Result<E2ERawMemberRecord, ErrCode>> {
  const { logger } = context
  const TAG = [ ...MTAG, 'createMockEligibleMember']

  try {
    const memberDataResult = await createMockMemberData(context)

    if (memberDataResult.isErr()) {
      return err(ErrCode.SERVICE)
    }

    const memberData = memberDataResult.value

    const dobDt = DateTime.fromFormat(memberData.dob, "MM/dd/yyyy")

    if (!dobDt.isValid) {
      logger.error(context, TAG, `Invalid DOB date format: ${memberData.dob}`, {
        dob: memberData.dob
      })

      return err(ErrCode.INVALID_CONFIG)
    }
    
    const dob = dobDt.toJSDate();
    
    const memberResult = await createEligibilityMember(context, {
      accountId: accountId ?? _ACCOUNT_ID,
      firstName: memberData.firstName,
      lastName: memberData.lastName,
      organizationId: CIGNA_NATIONAL_ORG_ID,
      dob: dob,
      gender: EligibilityMemberGender.MALE,
      phone: memberData.phone,
      phoneMobile: memberData.phone,
      email: memberData.email,
      addressLine1: memberData.addressLine1,
      addressLine2: memberData.addressLine2,
      city: memberData.city,
      state: memberData.state,
      zipcode: memberData.zipcode
    })
    
    if (memberResult.isErr()) {
      return err(ErrCode.SERVICE)
    }
    const eligibleMember = memberResult.value
    const member = {
      ...memberData,
      accountId: eligibleMember.accountId.toString(),
      eligibilityId: eligibleMember.eligibilityId.toString(),
    };
    
    return ok(member)
  } catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }

  return err(ErrCode.NOT_IMPLEMENTED)
}

export async function createMockEnrollmentLink(context: IContext, accountId: string, eligibilityId: string): Promise<Result<string, ErrCode>> {
  const { logger, config } = context
  const TAG = [ ...MTAG, 'createMockEnrollmentLink']

  const enrollmentTokenResult = await createEnrollmentToken(context, parseInt(accountId, 10), parseInt(eligibilityId, 10))

  if (enrollmentTokenResult.isErr()) {
    logger.error(context, TAG, `Error creating enrollment token`, {
      accountId: accountId,
      eligibilityId: eligibilityId
    })

    return err(enrollmentTokenResult.error)
  }

  const enrollmentToken = enrollmentTokenResult.value
  logger.info(context, TAG, `enrollmentToken: ${enrollmentToken}`)
  const enrollmentUrl = `${config.telenutrition_web.baseUrl}?enrollment=${enrollmentToken}`
  logger.info(context, TAG, `enrollmentUrl: ${enrollmentUrl}`)
  
  return ok(enrollmentUrl)
}

/**
 * This function retrieves a verification code sent to a member via SMS or email based on the provided
 * method and member configuration, with retry logic in case of failures.
 * @param {IContext} context
 * @param {E2EBrowserContext} e2EContext - 
 * @param {E2EScheduleVerificationMethod} method - To determine whether to get the verification code
 * via SMS or email based on the method specified.
 * @param {E2ERawMemberRecord} memberConfig - The `memberConfig` parameter in the `getVerificationCode`
 * function represents a raw member record in an end-to-end testing scenario. It contains information
 * about a member, such as their phone number and email address, which are used to retrieve a
 * verification code directly from the database.
 * @returns The function `getVerificationCode` returns a `Promise` that resolves to a `Result` object
 * containing either a string value representing the verification code or an error code.
 */
export async function getVerificationCode(context: IContext, e2EContext: E2EBrowserContext, method: E2EScheduleVerificationMethod, memberConfig: E2ERawMemberRecord): Promise<Result<string, ErrCode>> {
  const { logger, config } = context
  const { browser, browserContext, page, baseUrl } = e2EContext
  const TAG = [...MTAG, 'getVerificationCode']
  const VERIFICATION_DB_RETRIES = 10
  const VERIFICATION_DB_RETRY_DELAY_MS = 5000

  try {
    let verificationResult
    let retries = 0

    while (retries < VERIFICATION_DB_RETRIES) {
      const retryTimer = new Promise(resolve => setTimeout(resolve, VERIFICATION_DB_RETRY_DELAY_MS))
      
      switch (method) {
        case E2EScheduleVerificationMethods.SMS:
          verificationResult = await Verification.Service.getVerificationBySMS(context, `+${memberConfig.phone}`)
          break;
        default:
          verificationResult = await Verification.Service.getVerificationByEmail(context, memberConfig.email)
      }

      if (verificationResult.isOk()) {
        break
      }

      await retryTimer
      retries++

      logger.error(context, TAG, `Error getting verification code.`, {
        error: verificationResult.error,
        retries: VERIFICATION_DB_RETRIES - retries
      })

      if (retries >= VERIFICATION_DB_RETRIES) {
        return err(verificationResult.error)
      }
    }

    const verificationCode = verificationResult.value.code.toString()
    logger.info(context, TAG, `verificationCode: ${verificationCode}`)
    
    return ok(verificationCode)
  } catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}
