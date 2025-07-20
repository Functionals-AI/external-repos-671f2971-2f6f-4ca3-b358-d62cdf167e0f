import { Result, err, ok } from 'neverthrow'

import { ErrCode } from '@mono/common/lib/error'
import { IContext } from '@mono/common/lib/context'
import * as zs from 'zapatos/schema'
import * as db from 'zapatos/db'

const MTAG = [ 'telenutrition', 'activity', 'store' ]

export enum ActivityTypeIds {
  AppointmentCompleted = 1,
}

type ActivityUserPrimaryKey = string;

/**
 * Generate the priamry key for "activity_user" rows. The key will depend on 
 * the activity_id.
 * 
 * @param context 
 * @param insertable 
 */
function generateActivityUserPrimaryKey(context: IContext, insertable: ActivityUserInsertable): Result<ActivityUserPrimaryKey, ErrCode> {
  const { logger } = context
  const TAG = [ ...MTAG, 'generateActivityUserPrimaryKey' ]

  try {
    if (insertable.activity_id === undefined) {
      logger.error(context, TAG, 'Activity ID is required.', insertable)

      return err(ErrCode.INVALID_DATA)
    }
    else if (insertable.activity_id !== ActivityTypeIds.AppointmentCompleted) {
      logger.error(context, TAG, 'Unsupported activity.', insertable)

      return err(ErrCode.NOT_IMPLEMENTED)
    }
    else {
      const activityId = insertable.activity_id
      const appointmentId = (insertable.meta as db.JSONObject).appointment_id

      return ok(`${activityId}:${appointmentId}`)
    }
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export type ActivityUserInsertable = Omit<zs.telenutrition.activity_user.Insertable, 'activity_user_id'>

export type QueryOptions = {
  pgclient: db.TxnClientForSerializable
}

/**
 * Insert an appointment completed user activity. Only one activity_user record can exist for an appointmentId.
 * 
 * If an existing appointment completed user activity for the appointment exists,
 * return ErrCode.STATE_VIOLATION.
 */
export async function insertActivityUser(context: IContext, insertable: ActivityUserInsertable, options?: QueryOptions): Promise<Result<zs.telenutrition.activity_user.JSONSelectable, ErrCode>> {
  const { logger, store: { writer } } = context
  const TAG = [ ...MTAG, 'insertActivityUser' ]

  try {
    if (insertable.activity_id === undefined) {
      logger.error(context, TAG, 'Activity ID is required.', insertable)

      return err(ErrCode.INVALID_DATA)
    }
    else if (insertable.activity_id !== ActivityTypeIds.AppointmentCompleted) {
      logger.error(context, TAG, 'Unsupported activity.', insertable)

      return err(ErrCode.NOT_IMPLEMENTED)
    }

    const pgclient = options?.pgclient || (await writer())

    const primaryKeyResult = generateActivityUserPrimaryKey(context, insertable)

    if (primaryKeyResult.isErr()) {
      logger.error(context, TAG, 'Error generating primary key.', insertable)

      return err(primaryKeyResult.error)
    }

    const primaryKey = primaryKeyResult.value

    const query = db.insert('telenutrition.activity_user', {
      ...insertable,
      activity_user_id: primaryKey,
    })

    const compiled = query.compile()

    logger.info(context, TAG, 'query', {
      text: compiled.text,
      values: compiled.values,
    })

    const inserted = await query.run(pgclient)

    logger.info(context, TAG, 'Inserted user activity.', inserted)

    return ok(inserted)
  }
  catch (e) {
    if (db.isDatabaseError(e, 'IntegrityConstraintViolation_UniqueViolation')) {
      logger.debug(context, TAG, 'Unique violation inserting user.')

      return err(ErrCode.ALREADY_EXISTS)
    }
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

/**
 * Select an apointment completed user activity. There should be one and only one.
 * Like a selectOne shortcut function, return undefined if it doesn't exist.
 * 
 * If more than one record is present, ErrCode.STATE_VIOLATION is returned.
 */
export async function selectOneAppointmentCompletedActivityUser(context: IContext, appointmentId: number, options?: QueryOptions): Promise<Result<zs.telenutrition.activity_user.JSONSelectable | undefined, ErrCode>> {
  const { logger, store: { writer } } = context
  const TAG = [ ...MTAG, 'selectAppointmentCompletedUserActivity' ]
  
  try {
    const pgclient = options?.pgclient || (await writer())
  
    const selected = await db.select('telenutrition.activity_user', {
      meta: db.sql`${db.self} @> '{ "appointment_id": ${db.param(appointmentId)} }'::jsonb`
    }).run(pgclient)

    if (selected.length === 1) {
      return ok(selected[0])
    }
    else if (selected.length > 1) {
      return err(ErrCode.STATE_VIOLATION)
    }
    return ok(undefined)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export default {
  insertActivityUser,
  selectOneAppointmentCompletedActivityUser,
}