import { Result, err, ok } from 'neverthrow'
import * as db from 'zapatos/db'
import '@mono/common/lib/zapatos/schema'
import * as zs from 'zapatos/schema'

import { IContext } from '@mono/common/lib/context'
import { ErrCode } from '@mono/common/lib/error'
import { IdentityAttributes } from '../types'

const MTAG = [ 'telenutrition', 'iam', 'identity', 'store' ]

export interface IdentityStoreRecord extends IdentityAttributes {
  identityId: number,
  eligibleId?: number;
  accountId?: number;
}

function mapSelectableToIdentityRecord(record: zs.telenutrition.iam_identity.Selectable): IdentityStoreRecord {
  return {
    identityId: record.identity_id,
    firstName: record.first_name ?? undefined,
    lastName: record.last_name ?? undefined,
    birthday: record.birthday ?? undefined,
    zipCode: record.zip_code ?? undefined,
    eligibleId: record.eligible_id ?? undefined,
    accountId: record.account_id ?? undefined,
  }
}

function mapJsonSelectableToIdentityRecord(record: zs.telenutrition.iam_identity.JSONSelectable): IdentityStoreRecord {
  return {
    identityId: record.identity_id,
    firstName: record.first_name ?? undefined,
    lastName: record.last_name ?? undefined,
    birthday: record.birthday ? new Date(record.birthday) : undefined,
    zipCode: record.zip_code ?? undefined,
    eligibleId: record.eligible_id ?? undefined,
    accountId: record.account_id ?? undefined,
  }
}

export interface IdentityUsageRecord extends IdentityStoreRecord {
  patientId?: number;
  userId?: number;
  loginInfo?: {
    email?: string;
    phone?: string;
  }
}

type IdentityDBRecord = zs.telenutrition.iam_identity.JSONSelectable & db.LateralResult<{
  patient: db.SQLFragment<zs.telenutrition.schedule_patient.JSONSelectable | undefined, never>;
  user: db.SQLFragment<zs.telenutrition.iam_user.JSONSelectable | undefined, never>;
}>

function mapIdentityUsageRecord(record: IdentityDBRecord): IdentityUsageRecord {
  return {
    identityId: record.identity_id,
    firstName: record.first_name ?? undefined,
    lastName: record.last_name ?? undefined,
    birthday: record.birthday ? new Date(record.birthday) : undefined,
    zipCode: record.zip_code ?? undefined,
    eligibleId: record.eligible_id ?? undefined,
    accountId: record.account_id ?? undefined,
    userId: record.user?.user_id,
    patientId: record.patient?.patient_id,
    loginInfo: record.user && {
      ...(record.user.email && { email: record.user.email }),
      ...(record.user.phone && { phone: record.user.phone }),
    }
  }
}

export type IdentityNewRecord = Omit<IdentityStoreRecord, 'identityId'>

export async function createIdentity(context: IContext, record: IdentityNewRecord): Promise<Result<IdentityStoreRecord, ErrCode>> {
  const { logger, store: { writer } } = context
  const TAG = [ ...MTAG, 'createIdentity' ]

  try {
    const pool = await writer()

    const zipCode = record.zipCode !== undefined ? record.zipCode.substring(0, 5) : record.zipCode

    const sql = insertIdentitySQLFragment({
      first_name: record.firstName,
      last_name: record.lastName,
      birthday: record.birthday,
      zip_code: zipCode,
      eligible_id: record.eligibleId,
      account_id: record.accountId
    })
    const inserted = await sql.run(pool)

    if (inserted.length !== 1) {
      logger.error(context, TAG, 'Identity already exists.', {
        record,
      })

      return err(ErrCode.ALREADY_EXISTS)
    }
    else {
      return ok(mapSelectableToIdentityRecord(inserted[0]))
    }
  } catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

interface IdentityUpdatables extends IdentityAttributes {
  eligibleId: number | null,
  accountId: number | null
}

/**
 * Update an identity. Note, eligible ID and account ID can be reset to NULL.
 * 
 * @param context 
 * @param identityId 
 * @param updates 
 * @returns 
 */
export async function updateIdentity(context: IContext, identityId: number, updates: Partial<IdentityUpdatables>, queryable?: db.Queryable): Promise<Result<IdentityStoreRecord | null, ErrCode>> {
  const { logger, store: { writer } } = context
  const TAG = [ ...MTAG, 'updateIdentity' ]
  try {
    const pool = queryable ?? await writer()

    const zipCode = updates.zipCode !== undefined ? updates.zipCode.substring(0, 5) : updates.zipCode

    const updated = await db.update("telenutrition.iam_identity", {
      ...(updates.firstName && { first_name: updates.firstName }),
      ...(updates.lastName && { last_name: updates.lastName }),
      ...(zipCode && { zip_code: zipCode }),
      ...(updates.birthday && { birthday: updates.birthday }),
      ...(updates.eligibleId !== undefined && { eligible_id: updates.eligibleId }),
      ...(updates.accountId !== undefined && { account_id: updates.accountId })
    },{
      identity_id: identityId
    }).run(pool)

    if (updated.length === 1) {
      return ok(mapJsonSelectableToIdentityRecord(updated[0]))
    }
    else {
      return ok(null)
    }
  } catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

type IdentityWhereable = { identityId: number } | { eligibleId: number } | IdentityAttributes

/**
 * Select an identity record given required attributes (non can be NULL).
 * 
 * @param context 
 * @param attributes
 * @returns 
 */
export async function selectIdentity(context: IContext, whereable: IdentityWhereable, queryable?: db.Queryable): Promise<Result<IdentityUsageRecord, ErrCode>> {
  if ('identityId' in whereable) {
    return queryIdentity(context, { identity_id: whereable.identityId }, queryable)
  } else if ('eligibleId' in whereable) {
    return queryIdentity(context, { eligible_id: whereable.eligibleId }, queryable)
  } else {
    const { firstName, lastName, birthday, zipCode } = whereable
    return queryIdentity(context, {
      first_name: db.sql`LOWER(${db.self}) = ${db.param(firstName ? firstName.toLowerCase() : null)}`,
      last_name: db.sql`LOWER(${db.self}) = ${db.param(lastName ? lastName.toLowerCase() : null)}`,
      birthday: birthday,
      zip_code: zipCode,
    }, queryable)
  }
}

async function queryIdentity(context: IContext, whereable: zs.telenutrition.iam_identity.Whereable, queryable?: db.Queryable): Promise<Result<IdentityUsageRecord, ErrCode>> {
  const { logger, store: { reader } } = context
  const TAG = [ ...MTAG, 'queryIdentity' ]
  try {
    const pool = queryable ?? await reader()

    const rows = await db.select('telenutrition.iam_identity', whereable, {
      lateral: {
        patient: db.selectOne('telenutrition.schedule_patient', {
          identity_id: db.parent('identity_id')
        }),
        user: db.selectOne('telenutrition.iam_user', {
          identity_id: db.parent('identity_id')
        })
      },
      order: { by: 'identity_id', direction: 'ASC' },
      limit: 1000,
    }).run(pool)

    if (rows.length == 0) {
      return err(ErrCode.NOT_FOUND)
    }
    else {
      // If multiple rows match, prioritize the first one that is in use
      const selectedIdentity = rows.find(row => row.patient !== undefined || row.user !== undefined) || rows[0]
      return ok(mapIdentityUsageRecord(selectedIdentity))
    }
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export function insertIdentitySQLFragment(record: zs.telenutrition.iam_identity.Insertable): db.SQLFragment<zs.telenutrition.iam_identity.Selectable[]> {
  const { first_name, last_name, birthday, zip_code } = record

  return db.sql<zs.telenutrition.iam_identity.SQL, zs.telenutrition.iam_identity.Selectable[]>`
    INSERT
      INTO ${"telenutrition.iam_identity"} (${db.cols(record)})
      SELECT
        ${db.vals(record)}
      WHERE NOT EXISTS (
        SELECT
          1
        FROM ${"telenutrition.iam_identity"}
        WHERE
          LOWER(${"first_name"}) = LOWER(${db.param(first_name)}) AND
          LOWER(${"last_name"}) = LOWER(${db.param(last_name)}) AND
          ${"birthday"} = ${db.param(birthday)} AND
         ${"zip_code"} = ${db.param(zip_code)}
      )
      RETURNING *
  `
}

// Check if the identity either does not exist, or is not in use
export async function isIdentityAvailable(context: IContext, whereable: IdentityWhereable, queryable?: db.Queryable): Promise<Result<boolean, ErrCode>> {
  const identityResult = await selectIdentity(context, whereable, queryable)
  if (identityResult.isErr()) {
    if (identityResult.error == ErrCode.NOT_FOUND) {
      return ok(true)
    }
    return err(ErrCode.SERVICE)
  }
  const identityRecord = identityResult.value
  return ok(identityRecord.patientId === undefined && identityRecord.userId === undefined)
}

export default {
  selectIdentity,
  updateIdentity,
  isIdentityAvailable
}