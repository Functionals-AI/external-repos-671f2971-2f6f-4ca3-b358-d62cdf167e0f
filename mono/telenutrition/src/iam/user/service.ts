import { IContext } from "@mono/common/lib/context"
import { Logger } from "@mono/common"
import * as db from 'zapatos/db'
import '@mono/common/lib/zapatos/schema'
import * as zs from 'zapatos/schema'
import { ErrCode } from "@mono/common/lib/error"
import { err, ok, Result } from "neverthrow"
import UserStore, { NewUserRecord, UserRecord } from './store'
import { hashPassword } from "../auth"
import Verification from "../../verification"
import { FederationIdentityRecord, FederationSource, IdentityAttributes } from "../types"
import { FederationSourceName } from "../identity/service"
import FoodappStore from "@mono/foodapp/lib/store"
import { selectIdentity } from "../identity/store"
import { DateTime } from "luxon"
import { AccountIds } from "@mono/common/lib/account/service"
import Enrollment from "../enrollment"

export { UserRecord } from './store'

const IDENTITY_FIELDS: (keyof IdentityAttributes)[] = ['firstName', 'lastName', 'zipCode', 'birthday']
const MTAG = Logger.tag()


export function isFullyIdentified(attributes: Partial<IdentityAttributes> & object): attributes is Required<IdentityAttributes> {
  return IDENTITY_FIELDS.every(field => attributes[field] !== undefined)
}

export type UserCreationError = {
  code: ErrCode,
  data?: Partial<UserRecord>
}

export async function findOrCreateFederatedUser(
  context: IContext,
  identity: FederationIdentityRecord,
  userIdentity?: IdentityAttributes
): Promise<Result<UserRecord, UserCreationError>> {

  const TAG = [...MTAG, 'findOrCreateFederatedUser']
  const { logger, store: { writer } } = context
  const provider = FederationSourceName[identity.src]
  const subject = identity.fid

  try {
    const pool = await writer()
    const record = await db.selectOne('telenutrition.iam_federated_credentials', { provider, subject }).run(pool)

    // If credentials are already linked to a user, return it
    if (record?.user_id != null) {
      const userResult = await findUser(context, { userId: record.user_id })
      if (userResult.isErr()) {
        return err({ code: userResult.error })
      }
      return ok(userResult.value)
    }

    // Backfill user data from source
    const federatedUserDataResult = await fetchFederatedUserData(context, identity)

    if (federatedUserDataResult.isErr()) {
      return err({ code: federatedUserDataResult.error })
    }
    const federatedUserData = federatedUserDataResult.value


    if (identity.src == FederationSource.Foodapp) {

      const linkUser = async (userId: number) => {
        const userResult = await updateUser(context, userId, { fsUserId: parseInt(identity.fid) })
        if (userResult.isErr()) {
          return err({ code: userResult.error })
        }
        await db.insert('telenutrition.iam_federated_credentials', { provider, subject, user_id: userId }).run(pool)
        return ok(userResult.value)
      }

      // If the user was created via teleapp > enterprise SSO, they will already have
      // a teleapp user. Update fsUserId to backlink.
      if (federatedUserData.userId != null) {
        return linkUser(federatedUserData.userId)
      }

      // Extra check, in case the go_users record has an eligible id but not an identity id
      if (federatedUserData.fsEligibleId && !federatedUserData.identityId) {
        const identityResult = await selectIdentity(context, { eligibleId: federatedUserData.fsEligibleId })
        if (identityResult.isErr()) {
          return err({ code: identityResult.error })
        }
        federatedUserData.identityId = identityResult.value.identityId
      }

      // Check if we already have a user with the matching identity and email
      if (federatedUserData.identityId != null) {
        const identityResult = await selectIdentity(context, { identityId: federatedUserData.identityId })
        if (identityResult.isOk()) {
          const { userId, patientId, loginInfo } = identityResult.value
          if (userId !== undefined) {
            if (loginInfo?.email && loginInfo?.email == federatedUserData.email) {
              return linkUser(userId)
            } else {
              logger.error(context, TAG, 'Found existing user with matching identity but different email', { userId })
              return err({ code: ErrCode.STATE_VIOLATION })
            }
          } else if (patientId !== undefined) {
            // This can happen if an RD creates an enterprise account for a non-self patient (via NQ for example),
            // and then tries to sso back to teleapp
            logger.debug(context, TAG, 'Found existing patient matching identity id', { patientId })
            return err({ code: ErrCode.STATE_VIOLATION })
          }
        } else if (identityResult.error !== ErrCode.NOT_FOUND) {
          return err({ code: identityResult.error })
        }
      }
    }

    let userData = {
      ...federatedUserData,
      ...userIdentity
    }

    if (userData.email === undefined && userData.phone === undefined) {
      // shouldn't ever happen for foodapp
      logger.error(context, TAG, 'federated user does not have email or phone')
      // TODO: require client verify email or phone
      return err({ code: ErrCode.STATE_VIOLATION })
    }

    let userRecord: NewUserRecord
    if (userData.identityId !== undefined) {
      userRecord = {
        identityId: userData.identityId,
        ...userData
      }
    } else if (isFullyIdentified(userData)) {
      userRecord = userData
    } else {
      return err({ code: ErrCode.INVALID_DATA, data: userData })
    }

    // TODO: send through regular reg flow with registration token instead
    // (and skip email/phone/eligibility verification)

    // Try and create a user with the data we have
    const createResult = await createUser(context, { ...userRecord, roles: ['scheduler'] }, identity)
    if (createResult.isErr()) {
      logger.debug(context, TAG, 'error creating federated user', { error: createResult.error })

      if (createResult.error == ErrCode.STATE_VIOLATION) {
        // TODO: user already exists with another auth mechanism, need to handle linking
        logger.error(context, TAG, 'state violation creating federated user', { error: createResult.error })
      }
      return err({ code: createResult.error })
    }
    return ok(createResult.value)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err({ code: ErrCode.EXCEPTION })
  }
}

export async function fetchFederatedUserData(context: IContext, identity: FederationIdentityRecord): Promise<Result<Partial<UserRecord>, ErrCode>> {
  const { config } = context
  if (identity.src == FederationSource.Foodapp) {
    const fsUserId = parseInt(identity.fid, 10)
    if (config.isDevenv) {
      return ok({
        email: `test+${fsUserId}@test.com`,
        firstName: 'Test',
        lastName: 'User',
        birthday: new Date('01/01/2000')
      })
    }
    const fsUserResult = await FoodappStore.Users.fetchByUserId(context, fsUserId)
    if (fsUserResult.isErr()) {
      return err(fsUserResult.error)
    }
    const fsUser = fsUserResult.value

    // handle invalid zip codes or too long zip codes
    if (fsUser.zip !== null) {
      if (/^\d{5}/.test(fsUser.zip)) {
        fsUser.zip = fsUser.zip.substring(0, 5)
      } else {
        fsUser.zip = null
      }
    }

    const user: Partial<UserRecord> = {
      ...(fsUser.ta_user_id && { userId: fsUser.ta_user_id}),
      ...(fsUser.ta_identity_id && { identityId: fsUser.ta_identity_id }),
      ...(fsUser.email && { email: fsUser.email }),
      ...(fsUser.firstname && { firstName: fsUser.firstname }),
      ...(fsUser.lastname && { lastName: fsUser.lastname }),
      ...(fsUser.birthday && { birthday: fsUser.birthday }),
      ...(fsUser.zip && { zipCode: fsUser.zip }),
      ...(fsUser.eligible_id && { fsEligibleId: fsUser.eligible_id }),
      ...(fsUser.account_id && { accountId: fsUser.account_id })
    }
    
    return ok(user)
  }

  return ok({})
}

export function isBirthdayValidForRegistration(birthday: Date) {
  return DateTime.now().minus({years: 18}) > DateTime.fromJSDate(birthday)
}

/**
 *
 * Creates a new user with either an identityId or identity attributes. It is considered
 * an error to create a user without an identityId if an eligible identity record already exists for the
 * provided identity attributes. It is the callers responsibility to verify that the provided identityId
 * is approved for use by the prospective user.
 *
 */
export async function createUser(context: IContext, record: NewUserRecord, federationIdentity?: FederationIdentityRecord): Promise<Result<UserRecord, ErrCode>> {
  const { logger } = context
  const TAG = [...MTAG, 'createUser']

  try {
    if (record.password !== undefined) {
      record.password = await hashPassword(record.password)
    }

    // temp: continue to write fsUserId for now
    if (federationIdentity?.src == FederationSource.Foodapp) {
      record.fsUserId = parseInt(federationIdentity.fid, 10)
    }

    if ('zipCode' in record) {
      // ensure zip is 5 digits
      if (record.zipCode !== undefined && record.zipCode.length > 5) {
        record.zipCode = record.zipCode.substring(0, 5)
      }
    }

    const selectIdentityResult = await selectIdentity(context, record)
    let existingPatientId: number | undefined
    if (selectIdentityResult.isOk()) {
      const selectedIdentity = selectIdentityResult.value
      if (selectedIdentity.userId !== undefined) {
        logger.debug(context, TAG, 'Attempting to create a user with an identity that is already in use', { identityId: selectedIdentity.identityId })
        return err(ErrCode.STATE_VIOLATION)
      } else if (!('identityId' in record)) {
        if (selectedIdentity.eligibleId !== undefined) {
          // Found an identity record.
          logger.error(context, TAG, `Attempting to create eligible user without specifying an identityId`, {
            record,
            identityId: selectedIdentity.identityId
          })
          return err(ErrCode.STATE_VIOLATION)
        }
        record = {
          identityId: selectedIdentity.identityId,
          ...record
        }
      }
      existingPatientId = selectedIdentity.patientId
    } else if (selectIdentityResult.error != ErrCode.NOT_FOUND) {
      logger.error(context, TAG, "Error selecting identity")
      return err(selectIdentityResult.error)
    }

    if ('birthday' in record && record.birthday && !isBirthdayValidForRegistration(record.birthday)) {
      return err(ErrCode.INVALID_AGE)
    }

    if (record.accountId) {
      const canEnrollResult = await Enrollment.canEnrollWithAccountId(context, record.accountId)
      if (canEnrollResult.isErr()) {
        return err(ErrCode.SERVICE)
      } else if (!canEnrollResult.value) {
        return err(ErrCode.FORBIDDEN)
      }
    }

    const insertResult = await UserStore.insertUser(context, record, {
      federationIdentity,
      patientId: existingPatientId
    })

    if (insertResult.isErr()) {
      return err(insertResult.error)
    }

    const user = insertResult.value

    return ok(user)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export async function updateUser(context: IContext, userId: number, record: Omit<UserRecord, 'userId'>): Promise<Result<UserRecord, ErrCode>> {
  const { logger } = context
  const TAG = [...MTAG, 'updateUser']

  try {
    if (record.password !== undefined) {
      record.password = await hashPassword(record.password)
    }
    const updateResult = await UserStore.updateUser(context, userId, record)

    if (updateResult.isErr()) {
      return err(updateResult.error)
    }
    const user = updateResult.value
    return ok(user)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export async function findUser(context: IContext, options: Partial<UserRecord>): Promise<Result<UserRecord, ErrCode>> {
  const { logger } = context
  const TAG = [...MTAG, 'findUser']

  try {
    const userResult = await UserStore.findUser(context, options)
    if (userResult.isErr()) {
      return err(userResult.error)
    }
    return ok(userResult.value)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export async function findOrCreateUser(context: IContext, record: NewUserRecord, isDelegate: boolean): Promise<Result<UserRecord, ErrCode>> {
  const { logger } = context

  const emailOrPhone = record.email ? { email: record.email } : { phone: record.phone! }
  const searchCriteria = isDelegate ? {
    ...emailOrPhone,
    ...(('identityId' in record) ? {
      identity_id: record.identityId
    } : {
    ...(record.firstName && { firstName: record.firstName }),
    ...(record.lastName && { lastName: record.lastName }),
    })
  } : emailOrPhone

  const existingUserResult = await UserStore.findUser(context, searchCriteria)

  if (existingUserResult.isOk()) {
    return ok(existingUserResult.value)
  }

  const userResult = await createUser(context, record)
  if (userResult.isErr()) {
    return err(userResult.error)
  }

  const user = userResult.value

  if (isDelegate) {
    // Send email for user to set password
    await resetUserPassword(context, user.userId, emailOrPhone)
  }
  return ok(user)
}

type ResetPasswordParams = { email: string } | { phone: string }

export async function resetPassword(context: IContext, params: ResetPasswordParams): Promise<Result<boolean, ErrCode>> {
  const { logger, store: { reader }, config } = context
  const TAG = [...MTAG, 'resetPassword']

  try {
    const pool = await reader()
    const record = await db.selectOne('telenutrition.iam_user', formatUserQuery(params)).run(pool)
    const now = DateTime.now()
    if (record === undefined) {
      logger.info(context, TAG, 'password reset attempt for invalid account', { params });
      return ok(false)
    }

    if (record.password_reset_time != null && DateTime.fromJSDate(db.toDate(record.password_reset_time)).plus({ hours: 24 }) > now) {

      // Don't reset again, but resend verification code if it still exsits
      const verificationId = record.password_verification_id;
      if (verificationId != null) {
        await Verification.Service.createVerificationMethod(
          context,
          verificationId,
          'email' in params ? 'email' : 'sms'
        )
      }
      return ok(true)
    }

    return resetUserPassword(context, record.user_id, params)
  } catch (e) {
    logger.exception(context, 'TAG', e)
    return err(ErrCode.EXCEPTION)
  }
}

function formatUserQuery(params: ResetPasswordParams): zs.telenutrition.iam_user.Whereable {
  return {
    ...('phone' in params && { phone: params.phone }),
    ...('email' in params && { email: db.sql`LOWER(${db.self}) = ${db.param(params.email.toLowerCase())}` }),
  }
}

async function resetUserPassword(context: IContext, userId: number, params: ResetPasswordParams): Promise<Result<boolean, ErrCode>> {
  const { logger, store: { writer }, config } = context

  try {
    const pool = await writer()
    const verificationResult = await Verification.Service.createImmediateVerification(context, {
      type: 'password-reset',
      subject: userId,
      ...params,
      method: 'email' in params ? 'email' : 'sms',
      linkTemplate: 'email' in params ?
        (code) => `${config.telenutrition_web.baseUrl}/auth/forgot-password?email=${params.email}&code=${code}`
        : undefined
    })

    if (verificationResult.isErr()) {
      return err(verificationResult.error)
    }

    const verification = verificationResult.value
    const updateable: zs.telenutrition.iam_user.Updatable = {
      password: null,
      password_verification_id: verification.verificationId,
      password_reset_time: new Date()
    }
    await db.update('telenutrition.iam_user', updateable, { user_id: userId }).run(pool)
    return ok(true)
  } catch (e) {
    logger.exception(context, 'TAG', e)
    return err(ErrCode.EXCEPTION)
  }
}

type SetPasswordParams = {
  code: number,
  birthday: Date,
  newPassword: string,
} & ({ email: string } | { phone: string })

export async function setPassword(context: IContext, params: SetPasswordParams): Promise<Result<number, ErrCode>> {
  const { logger, store: { writer } } = context
  const { code, newPassword } = params

  const TAG = [...MTAG, 'setPassword']

  try {
    const pool = await writer()
    const record = await db.selectOne('telenutrition.iam_user', formatUserQuery(params)).run(pool)
    if (record == null || record.password_verification_id == null || record.identity_id === null) {
      return err(ErrCode.NOT_FOUND)
    }

    const identityRecord = await db.selectOne('telenutrition.iam_identity', { identity_id: record.identity_id }).run(pool)

    if (!identityRecord) {
      logger.error(context, TAG, 'Identity record not found, required to set password')
      return err(ErrCode.NOT_FOUND)
    }

    if (identityRecord.birthday === null || DateTime.fromFormat(identityRecord.birthday, 'yyyy-LL-dd').toFormat('yyyy-LL-dd') != DateTime.fromJSDate(params.birthday).toFormat('yyyy-LL-dd')) {
      logger.error(context, TAG, 'birthday does not match')
      return err(ErrCode.INVALID_DATA)
    }

    const verificationResult = await Verification.Service.getVerification(context, record.password_verification_id, code)
    if (verificationResult.isErr()) {
      if (verificationResult.error === ErrCode.NOT_FOUND) {
        return err(ErrCode.INVALID_DATA)
      }
      return err(verificationResult.error)
    }

    const hashedPassword = await hashPassword(newPassword)
    const updateable: zs.telenutrition.iam_user.Updatable = {
      password: hashedPassword,
      password_reset_time: null,
      password_verification_id: null,
    }
    await db.update('telenutrition.iam_user', updateable, { user_id: record.user_id }).run(pool)
    return ok(record.user_id)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export default {
  createUser,
  updateUser,
  findUser,
  findOrCreateUser,
  findOrCreateFederatedUser,
  resetPassword,
  setPassword,
  isFullyIdentified,
  fetchFederatedUserData
}
