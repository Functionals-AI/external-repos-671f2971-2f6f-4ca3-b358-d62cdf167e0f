import { IContext } from '@mono/common/lib/context'
import { ErrCode } from '@mono/common/lib/error'
import { Logger } from '@mono/common'
import { ZoomMeeting } from './zoom'
import Zoom from './zoom'

import * as _ from 'lodash'

import '@mono/common/lib/zapatos/schema'
import { Result, err, ok } from 'neverthrow'
import { SendCioEventOptions, sendCioEvent, CioEventType } from './cio'
import { EmployerRecord } from './employer/types'
import { getEmployer } from './employer/service'
import { getInsuranceInfo  } from './insurance/service'
import { buildAppToken } from '../iam/auth'
import { FederationSource } from '../iam/types'
import { PaymentMethodRecord } from './payment/store'
import { BaseAppointmentRecord } from './appointment/types'
import { PaymentRecord } from './scheduling-flow/types'
import { mapBaseAppointmentRecord } from './appointment/store'
import Okta from '@mono/common/lib/integration/okta'
import { promiseMap } from '@mono/common/lib/promise'
import * as db from 'zapatos/db';

const MTAG = Logger.tag()

/**
 * Returns success if providers were synced.
 * 
 * @remarks 
 * The sync function will query the Okta profile for each provider and update any metadata for the provider
 * 
 * @param context 
 * @returns success boolean
 */
export async function syncProviders(context: IContext): Promise<Result<boolean, ErrCode>> {
  const {logger, store: {writer}} = context
  const TAG = [...MTAG, 'syncProviders']

  try {
    const pool = await writer()
    const providers = await db.select('telenutrition.schedule_provider', {
      okta_id: db.conditions.isNotNull
    }, {
      columns: ['provider_id', 'okta_id']
    }).run(pool)

    const appDataResult = await Okta.Api.fetchAppData(context, 'zoom')
    if (appDataResult.isErr()) {
      logger.error(context, TAG, "Error fetching okta app user data", {
        error: appDataResult.error
      })
      return err(appDataResult.error)
    }

    const userAppData = _.keyBy(appDataResult.value, data => data.id)
    await db.transaction(pool, db.IsolationLevel.ReadCommitted, (txn) => Promise.all(
      providers.map(provider => {
        const data = userAppData[provider.okta_id!]
        if (data) {
          const email = data.profile?.email
          return db.update('telenutrition.schedule_provider', {
            zoom_uid: data.externalId,
            ...(email && { email })
          }, {
            provider_id: provider.provider_id
          }).run(txn)
        }
    })))
    return ok(true)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export interface SyncAppointmentOptions {
  paymentMethod?: PaymentMethodRecord;
  zoomMeeting?: ZoomMeeting;
  skipCioEvent?: boolean;
  canceledBy?: 'patient' | 'provider' | 'coordinator' | 'supervisor';
  cancelReasonId?: number;
  eventSource?: 'swap' | 'reschedule';
}

export async function sendAppointmentUpdateEvent(
  context: IContext,
  appointment: BaseAppointmentRecord,
  statusChanged: boolean,
  { eventSource, ...options }: SyncAppointmentOptions,
): Promise<Result<void, ErrCode>> {
  const { logger } = context
  const TAG = [...MTAG, 'sendAppointmentUpdateEvent']

  let confirmationEvent: ConfirmationEvent | undefined
  let type: CioEventType = 'appointment_update'
  if (statusChanged) {
    if (appointment.status === 'f') {
      type = 'appointment_confirmation'
      if (appointment.meeting === undefined) {
        logger.warn(context, TAG, "Missing meeting info for confirmation event", { appointmentId: appointment.appointmentId })
      }

    } else if (appointment.status === 'x') {
      type = 'appointment_cancellation'
    }
  }

  if (appointment.status === 'f') {
    const confirmationEventResult = await createConfirmationEvent(context, appointment, options.paymentMethod?.payment)
    if (confirmationEventResult.isErr()) {
      return err(confirmationEventResult.error)
    }
    confirmationEvent = {
      ...confirmationEventResult.value,
      ...(options.zoomMeeting && {
        zoomPhone: options.zoomMeeting?.phone // TODO: add to AppointmentMeeting record?
      })
    }
  }

  const cancelReasonId = options.cancelReasonId

  const updateEvent: SendCioEventOptions = {
    type: type,
    patientId: appointment.patientId!,
    providerId: appointment.providerId,
    appointmentId: appointment.appointmentId,
    appointmentTypeId: appointment.appointmentTypeId,
    appointmentTimestamp: appointment.startTimestamp,
    appointmentDuration: appointment.duration,
    ...confirmationEvent,
    ...(cancelReasonId && { cancelReasonId }),
    ...(options.canceledBy && { canceledBy: options.canceledBy }),
    ...(eventSource === 'reschedule' && { isReschedule: true }),
    ...(eventSource === 'swap' && { isSwap: true })
  }

  return sendCioEvent(context, updateEvent)
}

type ConfirmationEvent = {
  cancelUrl: string;
  zoomShortLink?: string | undefined;
  zoomLink?: string | undefined;
  zoomPhone?: string | undefined;
  specialProgram?: string | undefined;
  employer?: string | undefined;
  athenaPackageId?: number | undefined;
}

async function createConfirmationEvent(
  context: IContext,
  appointment: BaseAppointmentRecord,
  payment?: PaymentRecord,
): Promise<Result<ConfirmationEvent, ErrCode>> {
  const { logger, config } = context
  const TAG = [...MTAG, 'createConfirmationEvent']
  const appointmentId = appointment.appointmentId

  if (appointment.patientId === undefined) {
    logger.error(context, TAG, "unable to create confirmation event without patient id")
    return err(ErrCode.STATE_VIOLATION)
  }

  // create a scoped token to view/cancel appointment
  const tokenResult = buildAppToken(
    context,
    {
      fid: appointment.patientId.toString(),
      src: FederationSource.AthenaPatient,
      scope: `get:/appointments/${appointmentId} put:/appointments/${appointmentId}/cancel`
    }
  )
  if (tokenResult.isErr()) {
    return err(tokenResult.error)
  }
  const token = tokenResult.value
  const cancelUrl = `${config.telenutrition_web.baseUrl}/appointments/${appointmentId}/cancel?token=${token}`

  let athenaPackageId: number | undefined = undefined
  let employer: EmployerRecord | undefined = undefined

  if (payment) {
    //
    // When there is payment info., get ins. package ID / employer label and special program from employer.
    //
    const insInfoResult = await getInsuranceInfo(context, payment)

    if (insInfoResult.isErr()) {
      logger.error(context, TAG, `Error getting insurance info.`, {
        payment: payment,
        error: insInfoResult.error
      })
    }
    else if (insInfoResult.value?.packageId !== undefined) {
      athenaPackageId = insInfoResult.value.packageId
    }

    if (payment.method === 'employer') {
      const getEmployerResult = await getEmployer(context, payment.employer_id)

      if (getEmployerResult.isErr()) {
        logger.error(context, TAG, `Error getting employer.`, {
          payment: payment,
          error: getEmployerResult.error,
        })
      }
      else {
        employer = getEmployerResult.value
      }
    }
  }

  return ok({
    cancelUrl,
    ...(athenaPackageId !== undefined && { athenaPackageId, }),
    ...(employer?.label && { employer: employer.label }),
    ...(employer?.specialProgram && { specialProgram: employer.specialProgram }),
    ...(appointment.meeting && {
      zoomLink: appointment.meeting.link,
      zoomShortLink: appointment.meeting.shortLink
    }),
  })
}

type UpdateMeetingsReport = {
  success: number,
  error: number
}
async function updateMeetingLinks(context: IContext, options?: { limit?: number }): Promise<Result<UpdateMeetingsReport, ErrCode>> {
  const { logger, store: { writer } } = context;

  const TAG = [...MTAG, 'updateMeetingLinks']
  const limit = options?.limit ?? 50

  logger.debug(context, TAG, "Starting zoom dynamic link remapping")

  try {
    const pool = await writer();
    const providerAppts = await db.select('telenutrition.schedule_provider', db.all, {
      lateral: {
        appointments: db.select('telenutrition.schedule_appointment', {
          provider_id: db.parent('provider_id'),
          start_timestamp: db.conditions.gt(
            db.conditions.fromNow(1, 'day')
          ),
          frozen: false,
          status: 'f',
          meeting: db.sql`${db.self} is null OR ${db.self}->>'schema_type' != 'zoom_dynamic'`,
        }, {
          limit,
          order: {
            by: 'start_timestamp',
            direction: 'ASC'
          }
        })
      }
    }).run(pool);

    const appts = providerAppts.flatMap(row => row.appointments)

    logger.debug(context, TAG, `Found ${appts.length} appointments eligible for updating`)

    let error = 0
    let success = 0

    await promiseMap<boolean, ErrCode>(appts.map((appt) => {
      return async () => {
        const timer = new Promise(r => setTimeout(r, 1000))
        const meetingResult = await Zoom.createMeeting(context, {
          appointmentId: appt.appointment_id,
          providerId: appt.provider_id!,
          patientId: appt.patient_id!,
          startTimestamp: db.toDate(appt.start_timestamp)!,
          duration: appt.duration,
        })

        if (meetingResult.isErr()) {
          logger.error(context, TAG, 'Error generating zoom link for meeting', {
            appointmentId: appt.appointment_id,
            error: meetingResult.error,
          });
          error++
          await timer
          return err(meetingResult.error)
        }

        const zoomMeeting = meetingResult.value
        const update = await db.update(
          'telenutrition.schedule_appointment',
          {
            meeting: {
              schema_type: 'zoom_dynamic',
              id: zoomMeeting.id,
              link: zoomMeeting.joinUrl,
              short_link: zoomMeeting.shortJoinUrl,
            },
          },
          {
            appointment_id: appt.appointment_id,
          },
        ).run(pool);

        const appointment = mapBaseAppointmentRecord(update[0])
        await sendAppointmentUpdateEvent(context, appointment, false, {}),
        success++
        await timer
        return ok(true)
      }
    },{ concurrency: 20 }))

    logger.debug(context, TAG, `${success}/${appts.length} Updates complete (${error} errors)`)
    return ok({
      success,
      error
    })
  } catch (e) {
    logger.exception(context, `${TAG}.error`, e);
    return err(ErrCode.EXCEPTION)
  }
}

export default {
  syncProviders,
  updateMeetingLinks,
}