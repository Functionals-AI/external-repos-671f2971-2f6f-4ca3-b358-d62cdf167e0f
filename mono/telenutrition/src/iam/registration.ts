import { IContext } from "@mono/common/lib/context"
import { Logger } from "@mono/common"
import * as db from 'zapatos/db'
import '@mono/common/lib/zapatos/schema'
import { ErrCode } from "@mono/common/lib/error"
import { err, ok, Result } from "neverthrow"
import { findUser, UserRecord } from './user/store'
import { parseJsonWebToken, buildJsonWebToken } from "./auth"
import Verification from "../verification"
import { IdentityAttributes } from "./types"
import Enrollment, { EligibilityKey, EnrollmentType, EnrollmentToken, getEligibilityChallenge, verifyEligibility, fetchEligibilityInfo, isEligibleAccountId } from "./enrollment"
import { selectIdentity } from "./identity/store"
import { ChallengeHint } from './shared'
import { isFullyIdentified } from "./user/service"
import { maskEmail, maskPhone } from "../verification/service"
import { DateTime } from "luxon"
import { fetchLeadById } from "../callcenter/store"
import { phone } from 'phone'
import { z } from "zod"
import { fetchEligibleUsers } from "@mono/foodapp/lib/store/users-eligible"
import { RegistrationSchema } from "./user/schema"

const MTAG = Logger.tag()

type EmailXOrPhone = (Required<Pick<UserRecord, 'email'>> | Required<Pick<UserRecord, 'phone'>>)

// New users must have either an identityId or identity attributes
type NewUserRecord = Omit<UserRecord, 'userId' | 'identityId' | 'email' | 'phone' | keyof IdentityAttributes> &
  EmailXOrPhone &
  (Required<Pick<UserRecord, 'identityId'>> | Required<Pick<UserRecord, keyof IdentityAttributes>>)

type RegistrationChallenge =
  'enrollment' |
  'email' |
  'phone' |
  'eligibility' |
  'patient'

// JWT payload that captures verified user info across registration steps
type RegistrationTokenPayload = {
  info: NewUserRecord,
  pending: RegistrationChallenge[],
  challenge: {
    type: RegistrationChallenge
  } & Record<string,any>
} | {
  info: NewUserRecord
}

type ChallengeResponse<S> = {
  data: S, // stored in the jwt
  hint?: any // returned to the user
}

type Challenger<S,T> = {
  // Issues a challenge or null if challenge is not required
  issueChallenge: (context: IContext, record: NewUserRecord, isDelegate: boolean) => Promise<Result<ChallengeResponse<S> | null, ErrCode>>
  // Verifies the response against the issued challenge, returning the new token payload
  verifyChallenge: (context: IContext, record: NewUserRecord, challenge: S, response: T) => Promise<Result<NewUserRecord, ErrCode>>
  // Parse/validate the response data against our expected schema
  parseResponse(response: any): T
}

const CodeResponseSchema = z.object({
  code: z.coerce.number()
})

const emailChallenger: Challenger<{ verificationId: number }, { code: number }> = {
  issueChallenge: async (context, record, isDelegate) => {
    const { logger } = context

    if (!('email' in record)) return ok(null)

    const result = await Verification.Service.createImmediateVerification(context, {
      type: 'registration',
      email: record.email,
      method: 'email'
    })

    if (result.isErr()) {
      logger.error(context, 'emailChallenger', 'Error creating verification', { error: result.error })
      return err(result.error)
    }

    const { verificationId } = result.value
    return ok({
      data: { verificationId },
      hint: {
        label: record.email,
        verificationId
      },
    })
  },
  verifyChallenge: async (context, record, challenge, response) => {
    const { logger } = context
    const result = await Verification.Service.getVerification(context, challenge.verificationId, response.code)
    if (result.isErr()) {
      if (result.error === ErrCode.NOT_FOUND) {
        return err(ErrCode.ARGUMENT_ERROR)
      }
      logger.error(context, 'emailChallenger', 'Error getting verification', { error: result.error })
      return err(result.error)
    }
    return ok(record)
  },
  parseResponse(response: any) {
    return CodeResponseSchema.parse(response)
  }
}

const phoneChallenger: Challenger<{ verificationId: number }, { code: number }> = {
  issueChallenge: async (context, record, isDelegate) => {
    const { logger } = context

    if (!('phone' in record)) return ok(null)

    const phoneResult = phone(record.phone)

    if (!phoneResult.isValid) {
      logger.debug(context, 'phoneChallenger', 'Invalid phone number', { phone: record.phone })
      return err(ErrCode.INVALID_DATA)
    }

    const leadId = record?.enrollment?.leadId
    if (isDelegate) {
      if (leadId !== undefined) {
        const leadResult = await fetchLeadById(context, leadId)
        if (leadResult.isOk()) {
          if (leadResult.value.phone.some(p => phone(p).phoneNumber === phoneResult.phoneNumber)) {
            return ok(null)
          }
        } else {
          // Log, but continue with normal verification
          logger.debug(context, 'phoneChallenger', 'Unable to find lead', { leadId })
        }
      } else if (record?.fsEligibleId !== undefined) {
        const eligibileUserResult = await fetchEligibilityInfo(context, record.fsEligibleId)
        if (eligibileUserResult.isOk()) {
          const eligibileUser = eligibileUserResult.value
          if (eligibileUser.phone) {
            const eligiblePhone = phone(eligibileUser.phone)
            if (eligiblePhone.isValid && eligiblePhone.phoneNumber === phoneResult.phoneNumber) {
              return ok(null)
            }
          }
        } else {
          logger.debug(context, 'phoneChallenger', "error fetching eligiblility info", { error: eligibileUserResult.error })
        }
      }
    }

    const result = await Verification.Service.createImmediateVerification(context, {
      type: 'registration',
      phone: record.phone,
      method: 'sms'
    })

    if (result.isErr()) {
      logger.error(context, 'phoneChallenger', 'Error creating verification', { error: result.error })
      return err(result.error)
    }
    const { verificationId } = result.value
    return ok({
      data: { verificationId },
      hint: {
        label: record.phone,
        verificationId
      },
    })
  },
  verifyChallenge: async (context, record, challenge, response) => {
    const { logger } = context
    const result = await Verification.Service.getVerification(context, challenge.verificationId, response.code)
    if (result.isErr()) {
      if (result.error === ErrCode.NOT_FOUND) {
        return err(ErrCode.ARGUMENT_ERROR)
      }
      logger.error(context, 'phoneChallenger', 'Error getting verification', { error: result.error })
      return err(result.error)
    }
    return ok(record)
  },
  parseResponse(response: any) {
    return CodeResponseSchema.parse(response)
  }
}

const patientChallenger: Challenger<{ verificationId: number }, { code: number }> = {
  issueChallenge: async (context, record, isDelegate) => {
    const {
      logger,
      store: { reader },
    } = context;

    if (!('identityId' in record) || isDelegate) return ok(null)

    const pool = await reader()
    const patient = await db.selectOne('telenutrition.schedule_patient', {
      identity_id: record.identityId
    }).run(pool);

    // If no patient record exists for the identity, or the patient phone or email
    // matches the one used for registration, then no additional verification is required.
    if (patient == undefined ||
      ('email' in record && record.email === patient.email) ||
      ('phone' in record && record.phone === patient.phone)) {
        return ok(null)
    }

    // Otherwise, require patient verification
    const result = await Verification.Service.createVerification(context, {
      type: 'patient',
      subject: patient.patient_id,
      ...(patient.email && { email: patient.email }),
      ...(patient.phone && { sms: patient.phone })
    })
    if (result.isErr()) {
      logger.error(context, 'patientChallenger', 'Error creating patient verification', { error: result.error })
      return err(result.error)
    }

    const [{verificationId}, methods] = result.value
    return ok({
      data: {
        verificationId
      },
      hint: {
        verificationId,
        methods
      }
    })
  },
  verifyChallenge: async (context, record, challenge, response) => {
    const { logger } = context
    const result = await Verification.Service.getVerification(context, challenge.verificationId, response.code)
    if (result.isErr()) {
      logger.error(context, 'patientChallenger', 'Error verifying patient', { error: result.error })
      return err(result.error)
    }
    return ok(record)
  },
  parseResponse(response: any) {
    return CodeResponseSchema.parse(response)
  }
}

const EligibilityResponseSchema = z.object({
  memberId: z.string().optional()
})

const eligibilityChallenger: Challenger<{ eligibleId: number, fields: EligibilityKey[] }, Partial<Record<EligibilityKey, any>>> = {
  issueChallenge: async (context, record, isDelegate) => {
    const { logger } = context
    const eligibleId = record.fsEligibleId

    if (!eligibleId || isDelegate) return ok(null)

    if (record.enrollment) return ok(null) // verified via enrollment challenge

    const challengeResult = await getEligibilityChallenge(context, eligibleId)
    if (challengeResult.isErr()) {
      logger.error(context, 'eligibilityChallenger', 'error fetching eligibility challenge', {error: challengeResult.error})
      return err(challengeResult.error)
    }

    const { fields, questions } = challengeResult.value
    return ok({
      data: {
        eligibleId,
        fields
      },
      hint: questions
    })
  },
  verifyChallenge: async (context, record, challenge, response) => {
    const { logger } = context
    const verificationResult = await verifyEligibility(context, {
      eligibleId: challenge.eligibleId,
      fields: challenge.fields,
      values: response,
      accountId: record.accountId
    })

    if (verificationResult.isErr()) {
      logger.error(context, 'eligibilityChallenger', 'error verifying eligibility info', {error: verificationResult.error})
      return err(verificationResult.error)
    }

    const success = verificationResult.value
    if (!success) {
      logger.debug(context, 'eligibilityChallenger', 'eligibility challenge failed')
      return err(ErrCode.ARGUMENT_ERROR)
    }
    return ok(record)
  },
  parseResponse(response: any) {
    return EligibilityResponseSchema.parse(response)
  }
}

type RegistrationFields = z.infer<typeof RegistrationSchema>
type EnrollmentChallengeKey = keyof Pick<IdentityAttributes, 'birthday'>

const EnrollmentResponseSchema = z.object({
  birthday: z.coerce.date()
})
const enrollmentChallenger: Challenger<{ eligibleId: number, fields: EnrollmentChallengeKey[] }, Partial<IdentityAttributes>> = {
  issueChallenge: async (context, record, isDelegate) => {
    const { i18n } = context

    if (record.enrollment?.type !== EnrollmentType.Eligibility || isDelegate) return ok(null)

    return ok({
      data: {
        eligibleId: record.enrollment.eligibleId,
        fields: ['birthday']
      },
      hint: [{ key: 'birthday', label: i18n.__('Birthday'), type: 'text:date' }]
    }) 
  },
  verifyChallenge: async (context, record, challenge, response) => {
    const { logger } = context

    if (challenge) {
      const identityResult = await selectIdentity(context, { eligibleId: challenge.eligibleId })
      if (identityResult.isErr()) {
        logger.error(context, 'enrollmentChallenger', 'error fetching identity info', {error: identityResult.error})
        return err(identityResult.error)
      }
      const identity = identityResult.value

      const success = challenge.fields.every(field => {
        const expected = identity[field]
        const actual = response[field]
        switch (field) {
          case 'birthday': return compareDate(expected, actual)
        }
      })

      if (!success) {
        logger.debug(context, 'enrollmentChallenger', 'enrollment challenge failed')
        return err(ErrCode.ARGUMENT_ERROR)
      }
    } else if (!isFullyIdentified(response)) {
      return err(ErrCode.ARGUMENT_ERROR)
    }
    return ok(record)
  },
  parseResponse(response: any) {
    return EnrollmentResponseSchema.parse(response)
  }
}

function compareDate(expect?: Date, actual?: Date) {
  return expect == actual ||
    (expect !== undefined && actual !== undefined &&
      DateTime.fromJSDate(expect).hasSame(DateTime.fromJSDate(actual), 'day'))
}

const challengers: Record<RegistrationChallenge, Challenger<any,any>> = {
  'enrollment': enrollmentChallenger,
  'email': emailChallenger,
  'phone': phoneChallenger,
  'patient': patientChallenger,
  'eligibility': eligibilityChallenger,
}

const challenges: RegistrationChallenge[] = [ // defines the order we challenge in
  'enrollment',
  'email',
  'phone',
  'patient',
  'eligibility',
]

// Build new user record for registration token from either registration fields or enrollment token
export async function createNewUserRecord(context: IContext, body: RegistrationFields): Promise<Result<NewUserRecord, ErrCode | VerificationError>> {
  const TAG = [...MTAG, 'createNewUserRecord']
  const { logger, i18n } = context

  const emailXOrPhone = 'email' in body ? { email: body.email } : { phone: body.phone }
  const respond = async (identity: { eligibleId: number } | Required<IdentityAttributes>, enrollment?: EnrollmentToken): Promise<Result<NewUserRecord, ErrCode>> => {
    const identityResult = await selectIdentity(context, identity)
    if (identityResult.isOk()) {
      const { identityId, eligibleId, accountId } = identityResult.value
      return ok({
        ...emailXOrPhone,
        identityId,
        fsEligibleId: eligibleId,
        accountId,
        ...(enrollment && { enrollment })
      })
    } else if (identityResult.error !== ErrCode.NOT_FOUND) {
      logger.error(context, TAG, 'Error selecting identity', { error: identityResult.error })
      return err(identityResult.error)
    } else if ('eligibleId' in identity) {
      logger.debug(context, TAG, 'Unable to find identity for eligibleId', { eligibleId: identity.eligibleId })
      return err(ErrCode.NOT_FOUND)
    }
    return ok({
      ...emailXOrPhone,
      ...identity,
      ...(enrollment && { enrollment })
    })
  }

  if (body.enrollment !== undefined) {
    const enrollmentTokenResult = Enrollment.parseEnrollmentToken(context, body.enrollment)
    if (enrollmentTokenResult.isErr()) {
      logger.error(context, TAG, 'Error parsing enrollment token', { error: enrollmentTokenResult.error })
      return err(enrollmentTokenResult.error)
    }
    const enrollmentToken = enrollmentTokenResult.value

    if (enrollmentToken.type == EnrollmentType.Eligibility) {
      const { eligibleId } = enrollmentToken
      const result = await respond({ eligibleId }, enrollmentToken)
      if (result.isErr() && result.error === ErrCode.NOT_FOUND && isFullyIdentified(body)) {
        return respond(body) // ignore enrollment token (no longer eligible)
      }
      return result
    } else {
      const isEligibleAccountResult = await isEligibleAccountId(context, enrollmentToken.accountId)
      if (isEligibleAccountResult.isErr()) {
        logger.error(context, TAG, "error checking if account id is eligible", { error: isEligibleAccountResult.error })
        return err(isEligibleAccountResult.error)
      }
      if (isEligibleAccountResult.value) {
        if ('memberId' in body) {
          const { memberId, birthday} = body
          const eligibileUsersResult = await fetchEligibleUsers(context, {
            person_id: memberId,
            account_ids: [enrollmentToken.accountId]
          })
          if (eligibileUsersResult.isErr()) {
            logger.debug(context, TAG, "error fetching eligible users", { error: eligibileUsersResult.error })
            return err(eligibileUsersResult.error)
          }
          const eligibileUsers = eligibileUsersResult.value
          if (eligibileUsers.length === 0) {
            logger.debug(context, TAG, "No eligibile users matching enrollment info", {
              person_id: memberId,
              account_ids: [enrollmentToken.accountId]
            })
            return err({
              code: ErrCode.ARGUMENT_ERROR,
              data: {
                message: i18n.__("Sorry, the information you entered does not match any valid data in our records, please verify your input and try again"),
              }
            })
          }
          const match = eligibileUsers.find(user => user.birthday && compareDate(user.birthday, birthday))
          if (!match) {
            logger.debug(context, TAG, "No birthday match found for eligible enrollment", {
              person_id: memberId,
              account_ids: [enrollmentToken.accountId]
            })
            return err({
              code: ErrCode.ARGUMENT_ERROR,
              data: {
                message: i18n.__("Sorry, the information you entered does not match any valid data in our records. Please double check your input and ensure that your birthday is entered correctly")
              }
            })
          }
          return respond({ eligibleId: match.id }, enrollmentToken)
        }
        logger.debug(context, TAG, "missing enrollment fields for eligible account id")
        return err(ErrCode.STATE_VIOLATION)
      } else if (!isFullyIdentified(body)) {
        logger.debug(context, TAG, "missing identity fields for open enrollment")
        return err(ErrCode.STATE_VIOLATION)
      }
    }
    return respond(body, enrollmentToken)
  } else if (!isFullyIdentified(body)) {
    logger.debug(context, TAG, "missing identity fields for registration")
    return err(ErrCode.STATE_VIOLATION)
  }
  return respond(body)
}

export async function parseRegistrationToken(context: IContext, token: string): Promise<Result<RegistrationTokenPayload, ErrCode>> {
  const { logger, config } = context

  const TAG = [...MTAG, 'parseRegistrationToken']

  const tokenResult = parseJsonWebToken<RegistrationTokenPayload>(context, token, config.telenutrition.enrollment.secret, true)
  if (tokenResult.isErr()) {
    logger.error(context, TAG, 'Error parsing registration token', { error: tokenResult.error })
    return err(tokenResult.error)
  }
  const payload = tokenResult.value
  delete payload['exp']
  delete payload['iss']
  delete payload['iat']

  // Date is not parsed
  if ('birthday' in payload.info) {
    payload.info.birthday = DateTime.fromISO(payload.info.birthday as unknown as string).toJSDate()
  }

  return ok(payload)
}

type VerificationParameters = {
  token: string,
  challenge: Record<string, any>
} | RegistrationFields

type VerificationResponse = {
  token: string
} & ({
  verified: true
} | {
  verified: false
  challenge: ChallengeHint
})

type VerificationError = {
  code: ErrCode,
  data: any
}

export async function verify(
  context: IContext,
  params: VerificationParameters,
  isDelegate: boolean = false
): Promise<Result<VerificationResponse, ErrCode | VerificationError>> {
  const { logger, config } = context

  const TAG = [...MTAG, 'verify']

  const respondToken = async (payload: RegistrationTokenPayload, challenge?: ChallengeHint): Promise<Result<VerificationResponse, ErrCode>> => {
    const newTokenResult = buildJsonWebToken(context, payload, config.telenutrition.enrollment.secret)
    if (newTokenResult.isErr()) {
      logger.error(context, TAG, 'Error building registration token', { error: newTokenResult.error })
      return err(newTokenResult.error)
    }
    return ok({
      token: newTokenResult.value,
      ...(challenge ? { 
        verified: false,
        challenge
      }: { verified: true })
    })
  }

  // Issue the next challenge, or a verified token if all challenges have passed
  const next = async (
    info: NewUserRecord,
    challenges: RegistrationChallenge[]
  ): Promise<Result<VerificationResponse, ErrCode>> => {
    const [ challengeType, ...pending ] = challenges
    if (!challengeType) {
      return respondToken({ info: info as NewUserRecord })
    }

    const challenger = challengers[challengeType]
    const challengeResult = await challenger.issueChallenge(context, info, isDelegate)
    if (challengeResult.isErr()) {
      logger.error(context, TAG, 'Error issuing registration challenge', { challengeType, error: challengeResult.error })
      return err(challengeResult.error)
    }
    const challenge = challengeResult.value
    if (!config.isProduction) {
      logger.debug(context, TAG, 'Issuing registration challenge', { challengeType, challenge, info, isDelegate, pending })
    }
    if (challenge) {
      return respondToken({
        info,
        pending,
        challenge: {
          type: challengeType,
          ...challenge.data
        }
      }, {
        type: challengeType,
        hint: challenge.hint
      })
    }
    return next(info, pending)
  }

  try {
    if (!('token' in params)) {
      const infoResult = await createNewUserRecord(context, params)
      if (infoResult.isErr()) {
        logger.error(context, TAG, 'Error building token info', { error: infoResult.error })
        return err(infoResult.error)
      }
      const info = infoResult.value
      const emailOrPhone = 'email' in params ? { email : params.email } : { phone: params.phone }
      const existingUserResult = await findUser(context, emailOrPhone)
      if (existingUserResult.isOk()) {
        // We already have a user for the provided email/phone, only challenge for email/phone
        return next(info, ['email', 'phone'])
      } else if (existingUserResult.error !== ErrCode.NOT_FOUND) {
        logger.error(context, TAG, 'Error finding user by email/phone', { error: existingUserResult.error })
        return err(existingUserResult.error)
      } else if ('identityId' in info) {
        // If the identity matches an existing user prompt the user to login instead
        const userResult = await findUser(context, { identityId: info.identityId })
        if (userResult.isOk()) {
          const user = userResult.value

          logger.debug(context, TAG, 'Found exiting user with matching identity', { identityId: info.identityId, user })
          return err({
            code: ErrCode.ALREADY_EXISTS,
            data: {
              ...(user.email && { email: maskEmail(user.email) }),
              ...(user.phone && { phone: maskPhone(user.phone) })
            }
          })
        } else if (userResult.error !== ErrCode.NOT_FOUND) {
          logger.error(context, TAG, 'Error finding user', { error: userResult.error })
          return err(userResult.error)
        }
      }
      return next(info, challenges)
    } else {
      const tokenResult = await parseRegistrationToken(context, params.token)
      if (tokenResult.isErr()) {
        logger.error(context, TAG, 'Error parsing registration token', { error: tokenResult.error })
        return err(tokenResult.error)
      }

      const payload = tokenResult.value
      if (!('challenge' in payload)) return respondToken(payload)

      const { info, challenge, pending } = payload
      const challenger = challengers[challenge.type]
      const response = challenger.parseResponse(params.challenge)
      const result = await challenger.verifyChallenge(context, info, challenge, response);
      if (result.isErr()) {
        if (result.error !== ErrCode.ARGUMENT_ERROR) {
          logger.error(context, TAG, 'Error verifying registration challenge', { challengeType: challenge.type, error: result.error })
        }
        return err(result.error)
      }

      return next(result.value, pending)
    }
  } catch(e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export default {
  parseRegistrationToken,
  verify
}