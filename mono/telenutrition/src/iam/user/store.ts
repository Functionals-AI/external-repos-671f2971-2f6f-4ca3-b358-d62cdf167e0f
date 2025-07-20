import { phone } from 'phone'

import { IContext } from "@mono/common/lib/context"
import * as db from 'zapatos/db'
import '@mono/common/lib/zapatos/schema'
import * as zs from 'zapatos/schema'
import { ErrCode, ErrCodeError } from "@mono/common/lib/error"
import { err, ok, Result } from "neverthrow"
import { Queryable } from "zapatos/db"
import { EnrollmentToken } from "../enrollment"
import { FederationIdentityRecord, IdentityAttributes } from "../types"
import { AuthRole } from "../shared"
import { selectIdentity, insertIdentitySQLFragment } from '../identity/store'
import { FederationSourceName } from "../identity/service"

const MTAG = [ 'telenutrition', 'iam', 'user', 'store' ]

export interface UserRecord extends Partial<IdentityAttributes> {
  userId: number,
  accountId?: number,
  fsUserId?: number,
  fsEligibleId?: number,
  password?: string,
  roles?: AuthRole[],
  email?: string,
  phone?: string,
  identityId?: number,
  enrollment?: EnrollmentToken,
}

// A new user must have either an identity id or all identity attributes
export type NewUserRecord = Omit<UserRecord, 'userId' | 'identityId' | keyof IdentityAttributes> & (
  IdentityAttributes | Required<Pick<UserRecord, 'identityId'>>
)

export function mapUserRecord(record: UserSelectable): UserRecord {
  return {
    userId: record.user_id,
    accountId: record.account_id ?? undefined,
    fsUserId: record.fs_user_id ?? undefined,
    fsEligibleId: record.eligible_id ?? undefined,
    email: record.email ?? undefined,
    phone: record.phone ?? undefined,
    roles: record.roles ? record.roles as AuthRole[] : undefined,
    password: record.password ?? undefined,
    firstName: record.first_name ?? undefined,
    lastName: record.last_name ?? undefined,
    zipCode: record.zip_code ?? undefined,
    birthday: record.birthday ?? undefined,
    identityId: record.identity_id ?? undefined,
    enrollment: record.enrollment as EnrollmentToken ?? undefined,
  }
}

type InsertUserParameters = {
  federationIdentity?: FederationIdentityRecord,
  patientId?: number
}

export async function insertUser(context: IContext, record: NewUserRecord, params: InsertUserParameters): Promise<Result<UserRecord, ErrCode>> {
  const {logger, store: {writer}} = context
  const TAG = [ ...MTAG, 'insertUser' ]

  try {
    const pool = await writer()
    const user = await db.serializable(pool, async (pgclient) => {

      const accountId = record.enrollment?.accountId ?? record.accountId
      let identityId: number
      if ('identityId' in record) {
        identityId = record.identityId
      } else {
        const { firstName, lastName, zipCode, birthday } = record
        const inserted = await insertIdentitySQLFragment({
          first_name: firstName,
          last_name: lastName,
          birthday,
          zip_code: zipCode,
          account_id: accountId // from enrollment token
        }).run(pgclient)

        if (inserted.length === 1) {
          identityId = inserted[0].identity_id
        } else {
          //
          // Conditional insert which failed. Throw as this is in the context of a
          // transaction.
          //
          logger.error(context, TAG, 'Failure to create new identity.', { record })
          throw new ErrCodeError(ErrCode.STATE_VIOLATION)
        }
      }

      const insertable: zs.telenutrition.iam_user.Insertable = {
        fs_user_id: record.fsUserId,
        fs_eligible_id: record.fsEligibleId,
        password: record.password,
        roles: record.roles,
        identity_id: identityId,
        email: record.email,
        phone: record.phone,
        ...(record.enrollment && {enrollment: record.enrollment})
      }
      let user = await db.insert('telenutrition.iam_user', insertable).run(pgclient)

      const { federationIdentity, patientId } = params
      if (federationIdentity !== undefined) {
        await db.insert('telenutrition.iam_federated_credentials', {
          user_id: user.user_id,
          provider: FederationSourceName[federationIdentity.src],
          subject: federationIdentity.fid
        }).run(pgclient)
      }

      if (patientId !== undefined) {
        // update user/patient mapping
        await db.upsert("telenutrition.schedule_user_patient", {
          user_id: user.user_id,
          patient_id: patientId
        }, 'patient_id').run(pgclient)
      }
      return user
    })
    return ok({
      ...record,
      identityId: user.identity_id || undefined,
      userId: user.user_id,
    })
  } catch(e) {
    if (db.isDatabaseError(e, 'IntegrityConstraintViolation_UniqueViolation')) {
      logger.debug(context, TAG, "Unique violation inserting user")
      return err(ErrCode.STATE_VIOLATION)
    }
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export async function updateUser(context: IContext, userId: number, record: Partial<Omit<UserRecord, 'userId'>> & Partial<IdentityAttributes>): Promise<Result<UserRecord, ErrCode>> {
  const {logger, store: {writer}} = context
  const TAG = [ ...MTAG, 'updateUser' ]

  try {
    const pool = await writer()

    const user = await db.serializable(pool, async (pgclient) => {
      const existingUser = await queryUser({ userId }, pgclient)

      // Determine the identity attributes as they would be after an update
      const { firstName, lastName, zipCode, birthday } = {
        ...existingUser,
        ...record
      }

      if (!firstName || !lastName || !zipCode || !birthday) {
        logger.error(context, TAG, 'attempt to update user with partial identity', { userId })
        throw new ErrCodeError(ErrCode.INVALID_DATA)
      }

      const isIdentityUpdate = firstName != record.firstName || lastName != record.lastName || zipCode != record.zipCode || birthday != record.birthday

      if (!record.identityId && isIdentityUpdate) {
        const selectIdentityResult = await selectIdentity(context, { firstName, lastName, zipCode, birthday }, pgclient)

        if (selectIdentityResult.isOk()) {
          const selectedIdentity = selectIdentityResult.value

          // If updating the identity attributes would conflict with an existing
          // identity, throw a state violation (for now)
          // If needed, we could allow the user to update their identity to
          // match the existing identity if it is unused, but we would need
          // to go through the verification steps first
          if (selectedIdentity.identityId != existingUser?.identityId) {
            throw new ErrCodeError(ErrCode.STATE_VIOLATION)
          }
        } else if (selectIdentityResult.error != ErrCode.NOT_FOUND) {
          logger.error(context, TAG, "Error selecting identity")
          throw new ErrCodeError(selectIdentityResult.error)
        }
      }

      const identityId = record.identityId || existingUser?.identityId
      if (identityId) {
        const identityUpdateable: zs.telenutrition.iam_identity.Updatable = {
          ...(record.firstName && { first_name: record.firstName }),
          ...(record.lastName && { last_name: record.lastName }),
          ...(record.zipCode && { zip_code: record.zipCode }),
          ...(record.birthday && { birthday: record.birthday }),
          ...(record.fsEligibleId && { eligible_id: record.fsEligibleId }),
          ...(record.accountId && { account_id: record.accountId }),
        }
        if (Object.keys(identityUpdateable).length > 0) {
          await db.update(
            'telenutrition.iam_identity',
            identityUpdateable,
            { identity_id: identityId }
          ).run(pgclient)
        }
      } else  {
        //
        // Generally, users should always have an identityId when they are created, but there are some legacy
        // users that do not have one, so we allow them to update their user to add those fields
        //
        const inserted = await insertIdentitySQLFragment({
          first_name: firstName,
          last_name: lastName,
          birthday,
          zip_code: zipCode,
          ...(record.fsEligibleId && { eligible_id: record.fsEligibleId }),
          ...(record.accountId && { account_id: record.accountId }),
        }).run(pgclient)

        if (inserted.length === 1) {
          record.identityId = inserted[0].identity_id
        }
        else {
          //
          // Conditional insert failed.
          //
          logger.error(context, TAG, 'Failed to insert identity.', {
            userId,
            record,
          })

          throw new ErrCodeError(ErrCode.STATE_VIOLATION)
        }
      }

      const userUpdateable: zs.telenutrition.iam_user.Updatable = {
        ...(record.fsUserId && { fs_user_id: record.fsUserId }),
        ...(record.fsEligibleId && { fs_eligible_id: record.fsEligibleId }),
        ...(record.password && { password: record.password }),
        ...(record.email && { email: record.email }),
        ...(record.phone && { phone: record.phone }),
        ...(record.roles && { roles: record.roles }),
        ...(record.identityId && { identity_id: record.identityId })
      }

      if (Object.keys(userUpdateable).length > 0) {
        await db.update('telenutrition.iam_user', userUpdateable, {
          user_id: userId
        }).run(pgclient)
      }

      return queryUser({ userId }, pgclient)
    })
    return ok(user!)
  } catch(e) {
    if (e instanceof ErrCodeError) {
      return err(e.code)
    } else if (db.isDatabaseError(e, 'IntegrityConstraintViolation_UniqueViolation')) {
      logger.debug(context, TAG, "Unique violation updating user")
      return err(ErrCode.STATE_VIOLATION)
    }
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

type UserWhereable = zs.telenutrition.iam_user.Whereable | zs.telenutrition.iam_identity.Whereable
type UserSQL = zs.telenutrition.iam_user.SQL | zs.telenutrition.iam_identity.SQL
type UserSelectable = zs.telenutrition.iam_user.Selectable & zs.telenutrition.iam_identity.Selectable

export async function findUser(context: IContext, options: Partial<UserRecord>): Promise<Result<UserRecord, ErrCode>> {
  const { logger, store: { reader } } = context
  const TAG = [ ...MTAG, 'findUser' ]

  try {
    const pool = await reader()
    const user = await queryUser(options, pool)

    if (user === null) {
      return err(ErrCode.NOT_FOUND)
    }
    return ok(user)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export async function queryUser(options: Partial<UserRecord>, pool: Queryable): Promise<UserRecord|null> {
  const whereable: UserWhereable = {
    ...(options.userId && { user_id: options.userId }),
    ...(options.identityId && { identity_id: options.identityId }),
    ...(options.fsUserId && { fs_user_id: options.fsUserId }),
    ...(options.email && { email: db.sql`LOWER(${db.self}) = ${db.param(options.email.toLowerCase())}` }),
    ...(options.phone && { phone: options.phone }),
    ...(options.firstName && { first_name: db.sql`LOWER(${db.self}) = ${db.param(options.firstName.toLowerCase())}` }),
    ...(options.lastName && { last_name: db.sql`LOWER(${db.self}) = ${db.param(options.lastName.toLowerCase())}` }),
    ...(options.zipCode && { zip_code: options.zipCode }),
    ...(options.birthday && { birthday: options.birthday }),
  }

  const results = await db.sql<UserSQL, UserSelectable[]>`
    SELECT * FROM ${"telenutrition.iam_user"}
    LEFT OUTER JOIN ${"telenutrition.iam_identity"}
    USING (${"identity_id"})
    WHERE ${whereable}
    LIMIT 1
  `.run(pool)

  if (results.length == 0) {
    return null
  }

  const user = mapUserRecord(results[0])
  return user
}

export interface UserContactInfo {
  email?: string,
  phone?: string,
}

export async function updateUserContactInfo(context: IContext, userId: number, contactInfo: UserContactInfo, resetPassword = false): Promise<Result<UserRecord, ErrCode>> {
  const { logger, store: { writer } } = context
  const TAG = [ ...MTAG, 'updatePatientContactInfo' ]

  try {
    const pool = await writer()

    if (contactInfo.email || contactInfo.phone) {
      const updates = { ...contactInfo }

      if (contactInfo.phone) {
        const validation = phone(contactInfo.phone, { country: 'USA' })

        if (!validation.isValid) {
          logger.error(context, TAG, 'Phone number is not valid.', {
            contactInfo,
          })
  
          return err(ErrCode.INVALID_PHONE)
        }
  
        updates.phone = validation.phoneNumber
      }

      const records = await db.update('telenutrition.iam_user', 
        {
          ...contactInfo,
          ...(resetPassword && { password: null })
        },
        {
          user_id: userId
        }
      ).run(pool)

      if (records.length !== 1) {
        logger.error(context, TAG, 'User not found on update.', {
          userId,
          contactInfo,
        })

        return err(ErrCode.NOT_FOUND)
      }
    }

    const findUserResult = await findUser(context, { userId, })

    if (findUserResult.isErr()) {
      logger.error(context, TAG, 'Error selecting user.', {
        userId,
      })

      return err(findUserResult.error)
    }

    return ok(findUserResult.value)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export async function countUsers(context: IContext, whereable: UserWhereable): Promise<Result<number, ErrCode>> {
  const { logger, store: { reader } } = context

  try {
    const pool = await reader()
    const [{ count }] = await db.sql<UserSQL, [{ count: number }]>`
      SELECT count(*)
      FROM ${"telenutrition.iam_user"}
      JOIN ${"telenutrition.iam_identity"} USING (${"identity_id"})
      WHERE ${whereable}
    `.run(pool);

    return ok(count)
  } catch (e) {
    logger.exception(context, 'TAG', e)
    return err(ErrCode.EXCEPTION)
  }
}

export default {
  insertUser,
  updateUser,
  findUser,
  queryUser,
  updateUserContactInfo,
  countUsers,
}
