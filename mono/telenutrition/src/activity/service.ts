import { Result, err, ok } from 'neverthrow'
import { DateTime } from 'luxon'

import { ErrCode } from '@mono/common/lib/error'
import { IContext } from '@mono/common/lib/context'
import * as zs from 'zapatos/schema'
import * as db from 'zapatos/db'
import { ActivityTypeIds, insertActivityUser  } from './store'
export { ActivityTypeIds as ActivityTypeIds } from './store'
import { CioEventType, CustomerRecord as CioCustomerRecord, EventRecord as CioEventRecord } from '@mono/common/lib/integration/customerio/service'
import Cio from '@mono/common/lib/integration/customerio'
import { buildAppToken } from '../iam/auth'
import { FederationSource } from '../iam/types'
import { shortenLink } from '@mono/common/lib/shortlink'

const MTAG = [ 'telenutrition', 'activity', 'service' ]

enum CioEventNames {
  APPOINTMENT_COMPLETED = 'appointment_completed'
}

export interface SendCioEventResult {
  customer: CioCustomerRecord;
  event: CioEventRecord;
}

async function sendCioEvent(context: IContext, userActivity: UserActivityRecord): Promise<Result<SendCioEventResult, ErrCode>> {
  const { logger, store: { reader }, config } = context
  const TAG = [ ...MTAG, 'sendCioEvent' ]

  try {
    const pool = await reader()

    if (userActivity.activityTypeId === ActivityTypeIds.AppointmentCompleted) {
      const patient = await db.selectOne('telenutrition.schedule_patient', {
        patient_id: userActivity.patientId
      }, {
        lateral: {
          identity: db.selectExactlyOne('telenutrition.iam_identity', {
            identity_id: db.parent('identity_id')
          })
        }
      }).run(pool)

      if (patient === undefined) {
        logger.error(context, TAG, 'Patient not found.', {
          userActivity
        })

        return err(ErrCode.NOT_FOUND)
      }

      logger.debug(context, TAG, 'Retrieved patient and identity.', {
        patient,
      })

      const identifier = `id:${userActivity.patientIdentityId}`
      const customer = {
        id: identifier,
        ...(patient.email && { email: patient.email }),
        ...(patient.phone && { phone: patient.phone }),
        ...(patient.identity.first_name && { firstname: patient.identity.first_name }),
        ...(patient.identity.last_name && { lastname: patient.identity.last_name }),
      }

      const appointmentId = userActivity.appointmentId
      const tokenResult = buildAppToken(context, {
        fid: patient.patient_id.toString(),
        src: FederationSource.AthenaPatient,
        scope: `post:/appointments/${appointmentId}/nps`
      })

      let npsUrl: {
        url: string;
        shortUrl: string;
      } | undefined

      if (tokenResult.isOk()) {
        const url = `${config.telenutrition_web.baseUrl}/appointments/${appointmentId}/nps?token=${tokenResult.value}`
        const shortUrlResult = await shortenLink(context, url)
        if (shortUrlResult.isOk()) {
          npsUrl = {
            url,
            shortUrl: shortUrlResult.value.url
          }
        } else {
          // Log, but continue
          logger.error(context, TAG, 'error creating short nps url', { appointmentId, error: shortUrlResult.error })
        }
      } else {
        // Log, but continue
        logger.error(context, TAG, 'error creating nps token', { appointmentId, error: tokenResult.error })
      }

      const event = {
        type: CioEventType.Event,
        name: CioEventNames.APPOINTMENT_COMPLETED,
        data: {
          appointment_id: userActivity.appointmentId,
          appointment_type_id: userActivity.appointmentTypeId,
          appointment_status: userActivity.appointmentStatus,
          appointment_date: userActivity.appointmentDate,
          appointment_start_time: userActivity.appointmentStartTime,
          appointment_duration: userActivity.appointmentDuration,
          appointment_timezone: userActivity.appointmentTimezone,
          ...(npsUrl && {
            nps_url: npsUrl.url,
            nps_url_short: npsUrl.shortUrl
          })
        }
      }

      const sendResult = await Cio.Service.sendEvent(context, identifier, { customer, event, })

      if (sendResult.isErr()) {
        logger.error(context, TAG, 'Error send event to C.io', {
          identifier,
          customer,
          event,
        })

        return err(sendResult.error)
      }

      return ok({
        customer,
        event,
      })
    }
    else {
      logger.error(context, TAG, 'Attempt to publish C.io for unsupported activity.', {
        userActivity,
      })

      return err(ErrCode.NOT_IMPLEMENTED)
    }
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

/**
 * Appointment Completed user activity. 
 * 
 * Note:
 * 
 *  - userActivityId: Unique ID of this activity.
 */
export type AppointmentCompletedUserActivityRecord = {
    userActivityId: string;
    createdAt: Date;
} & AppointmentCompletedUserActivityNewRecord;

export type UserActivityRecord = AppointmentCompletedUserActivityRecord;

/**
 * Fields required for a new 'user activity' records.
 */
type UserActivityNewRecordBase = {
  activityTypeId: ActivityTypeIds.AppointmentCompleted;
  userId: number;
  userIdentityId: number;
}

/**
 * Note toe following on individual attributes.
 * 
 *  - appointmentStatus: Single charactore, ie: '3' or '4' (checked out or charge enterred)
 *  - appointmentStartAt: Date in timezone of appointment's department.
 *  - appointmentDate: MM/DD/YYYY
 *  - appointmentStartTime: HH:mm
 */
export type AppointmentCompletedUserActivityNewRecord = {
  patientId: number;
  patientIdentityId: number;
  appointmentId: number;
  appointmentTypeId: number;
  appointmentStatus: string;
  appointmentStartAt: Date;
  appointmentDate: string;
  appointmentStartTime: string;
  appointmentDuration: number;
  appointmentTimezone: string;
} & UserActivityNewRecordBase;

export type UserActivityNewRecord = AppointmentCompletedUserActivityNewRecord

export async function createUserActivity(context: IContext, activity: UserActivityNewRecord): Promise<Result<UserActivityRecord, ErrCode>> {
  const { logger, store: { writer } } = context
  const TAG = [ ...MTAG, 'createUserActivity' ]

  try {
    if (activity.activityTypeId === ActivityTypeIds.AppointmentCompleted) {
      const pool = await writer()

      const result = await insertActivityUser(
        context,
        {
          activity_id: activity.activityTypeId,
          user_id: activity.userId,
          identity_id: activity.patientIdentityId,
          activity_at: DateTime.fromJSDate(activity.appointmentStartAt).plus({ minutes: activity.appointmentDuration}).toJSDate(),
          meta: {
            patient_id: activity.patientId,
            appointment_id: activity.appointmentId,
            appointment_type_id: activity.appointmentTypeId,
            appointment_status: activity.appointmentStatus,
            appointment_date: activity.appointmentDate,
            appointment_start_time: activity.appointmentStartTime,
            appointment_duration: activity.appointmentDuration,
            appointment_timezone: activity.appointmentTimezone,
          }
        }
      )

      if (result.isErr()) {
        logger.error(context, TAG, 'Error inserting activity.', {
          activity,
          error: result.error
        })
  
        return err(result.error)
      }
      else {
        const inserted = result.value
        const userActivity = {
          userActivityId: inserted.activity_user_id,
          createdAt: db.toDate(inserted.created_at, 'UTC'),
          ...activity,
        }

        //
        // Send the event async, w/o waiting.
        //
        sendCioEvent(context, userActivity)

        return ok(userActivity)
      }
    }
    else {
      return err(ErrCode.NOT_IMPLEMENTED)
    }
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export default {
  ActivityTypeIds,
  createUserActivity,
}