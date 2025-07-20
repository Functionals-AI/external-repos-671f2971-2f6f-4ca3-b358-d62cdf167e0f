import { DbTransaction, IContext } from "@mono/common/lib/context"
import * as db from 'zapatos/db'
import { conditions as dc } from 'zapatos/db'
import '@mono/common/lib/zapatos/schema'

import { Logger } from '@mono/common'

import { ErrCode, ErrCodeError } from "@mono/common/lib/error"
import { err, ok, Result } from "neverthrow"
import {AppointmentMeeting, AppointmentRecord, BaseAppointmentRecord } from "./types"
import Service from './service'
import * as zs from 'zapatos/schema'

import { mapPatientRecord, PatientRecord } from "../patient/store"
import Patient from '../patient';
import _ = require("lodash")
import { DateTime, Interval } from 'luxon'
import { ZoomMeeting } from "../zoom"
import { IdentityRecord } from "../../iam/types"
import { isEmployeeIdentity } from "../../iam/identity/service"
import { mapProviderRecord } from "../provider/store"
import { mapAppointmentEncounterRecord } from "../encounter/store"
import { ProviderRecord } from "../provider/shared"
import { PaymentMethodRecord } from "../payment/store"
import { getDRCCategory } from "../encounter/service"
import { formatTimeFields } from './helpers'

const MTAG = Logger.tag()

interface MapAppointmentRecordParams {
  record: zs.telenutrition.schedule_appointment.JSONSelectable & { encounter?: zs.telenutrition.clinical_encounter.JSONSelectable},
  timezone: string,
  appointmentType?: zs.telenutrition.schedule_appointment_type.JSONSelectable,
  userId?: number,
  patient?: zs.telenutrition.schedule_patient.JSONSelectable & {identity?: zs.telenutrition.iam_identity.JSONSelectable},
  provider?: zs.telenutrition.schedule_provider.JSONSelectable,
  oversightRequired?: boolean,
}

type MapAppointmentRecordFn = (params: Omit<MapAppointmentRecordParams, 'appointmentType'>) => AppointmentRecord

export async function createMapAppointmentRecordFn(context: IContext): Promise<Result<MapAppointmentRecordFn, ErrCode>> {
  const { logger } = context

  const TAG = [...MTAG, 'createMapAppointmentRecord']

  try {
    const appointmentTypesResult = await Service.getAppointmentTypes(context, {});
    if (appointmentTypesResult.isErr()) {
      logger.error(context, TAG, 'could not get appointment types', { error: appointmentTypesResult.error })
      return err(appointmentTypesResult.error)
    }

    const appointmentTypes = appointmentTypesResult.value
    const appointmentTypeMap = _.keyBy(appointmentTypes, 'appointment_type_id')

    // @ts-ignore
    return ok((params: MapAppointmentRecordParams) => {
      const appointmentTypeId = params.record.appointment_type_id
      const found: zs.telenutrition.schedule_appointment_type.JSONSelectable | undefined = appointmentTypeMap[appointmentTypeId]
      if (found === undefined) {
        logger.warn(context, TAG, 'could not find appointment type', { appointmentTypeId })
      }

      return mapAppointmentRecord({
        ...params,
        appointmentType: found
      })
    })
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

function isAppointmentMeeting(record: any): record is AppointmentMeetingDbRecord {
  const meetingFields: (keyof AppointmentMeetingDbRecord)[] = ['schema_type','link','short_link']
  return meetingFields.every(field => field in record)
}

function mapAppointmentMeeting(meeting: zs.telenutrition.schedule_appointment.JSONSelectable['meeting']): AppointmentMeeting | undefined {
  if (!isAppointmentMeeting(meeting)) {
    return undefined
  }
  const schemaType = meeting.schema_type
  return schemaType === 'zoom_dynamic' ? {
    schemaType,
    id: meeting.id,
    link: meeting.link,
    shortLink: meeting.short_link,
    externalLink: meeting.external_link
  } : {
    schemaType,
    link: meeting.link,
    shortLink: meeting.short_link,
  }
}

export function mapAppointmentRecord(params: MapAppointmentRecordParams): AppointmentRecord {
  const { record, appointmentType, timezone, userId, patient, provider } = params
  const startTimestamp = db.toDate(record.start_timestamp)
  const isAudioOnly = appointmentType?.is_audio_only ?? false;
  const isInitial = appointmentType?.is_initial ?? false;
  const appointmentTypeDisplay = appointmentType?.name ?? undefined;
  const startDateTime = DateTime.fromJSDate(startTimestamp, { zone: timezone })

  return {
    ...mapBaseAppointmentRecord(record),
    date: startDateTime.toFormat('MM/dd/yyyy'),
    // TODO: remove duplicate fields
    startDate: startDateTime.toFormat('MM/dd/yyyy'),
    startAt: startTimestamp,
    startTime: startDateTime.toFormat('h:mm a ZZZZ'), // warning: this format is different than in BaseAppointmentRecord
    frozen: record.frozen,
    patientId: record.patient_id || undefined,
    userId,
    startTimestamp,
    paymentMethodId: record.payment_method_id || undefined,
    acceptedPaymentMethodId: record.accepted_payment_method_id || undefined,
    isAudioOnly,
    appointmentTypeDisplay,
    isFollowUp: !isInitial,
    ...(record.encounter && { encounter: mapAppointmentEncounterRecord(record.encounter) }),
    ...(patient && {patient: mapPatientRecord(patient)}),
    ...(provider && { provider: mapProviderRecord(provider)})
  }
}

export function mapBaseAppointmentRecord(record: zs.telenutrition.schedule_appointment.JSONSelectable): BaseAppointmentRecord {
  return {
    appointmentId: record.appointment_id,
    appointmentTypeId: record.appointment_type_id,
    departmentId: record.department_id,
    patientId: record.patient_id ?? undefined,
    providerId: record.provider_id ?? undefined,
    duration: record.duration,
    status: record.status,
    startDate: record.date,
    startTime: record.start_time,
    frozen: record.frozen,
    cancelReasonId: record.cancel_reason_id ?? undefined,
    startTimestamp: DateTime.fromISO(record.start_timestamp).toJSDate(),
    meeting: record.meeting ? mapAppointmentMeeting(record.meeting) : undefined,
  }
}

export type SelectOneAppointmentOptions = {
  timezone?: string;
} & ({ appointmentId: number } | { waitingId: string })


export async function selectAppointmentById(context: IContext, appointmentId: number): Promise<Result<BaseAppointmentRecord, ErrCode>> {
  const {logger, store: {reader}} = context
  const TAG = [...MTAG, 'selectAppointmentById']
  try {
    const pool = await reader()

    const record = await db.selectOne('telenutrition.schedule_appointment', {
      appointment_id: appointmentId,
    }).run(pool)

    if (record === undefined) {
      logger.error(context, TAG, `appointment not found in database`, { appointmentId })
      return err(ErrCode.NOT_FOUND)
    }
    return ok(mapBaseAppointmentRecord(record))
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export type AppointmentTypeRecord = {
  appointmentTypeId: number,
  name: string,
  duration: number,
  isInitial: boolean,
  isAudioOnly: boolean,
}

function mapAppointmentTypeRecord(record:  zs.telenutrition.schedule_appointment_type.JSONSelectable): AppointmentTypeRecord {
  return {
    appointmentTypeId: record.appointment_type_id,
    name: record.name,
    duration: record.duration,
    isInitial: record.is_initial,
    isAudioOnly: !!record.is_audio_only,
  }
}

export async function selectAppointmentType(context: IContext, appointmentTypeId: number): Promise<Result<AppointmentTypeRecord, ErrCode>> {
  const {logger, store: {reader}} = context
  const TAG = [...MTAG, 'selectAppointmentType']
  try {
    const pool = await reader()

    const record = await db.selectOne('telenutrition.schedule_appointment_type', {
      appointment_type_id: appointmentTypeId
    }).run(pool)

    if (record === undefined) {
      logger.error(context, TAG, `appointment type not found in database`, { appointmentTypeId })
      return err(ErrCode.NOT_FOUND)
    }
    return ok(mapAppointmentTypeRecord(record))
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export async function selectOneAppointment(context: IContext, options: SelectOneAppointmentOptions): Promise<Result<AppointmentRecord, ErrCode>> {
  const { logger, store: { reader } } = context
  const TAG = [...MTAG, 'selectOneAppointment']

  try {
    const pool = await reader()

    const record = await db.selectOne('telenutrition.schedule_appointment', {
      ...('appointmentId' in options ? { appointment_id: options.appointmentId } : { waiting_id: options.waitingId }),
    }, {
      lateral: {
        owner: db.selectOne('telenutrition.schedule_user_patient', {
          patient_id: db.parent('patient_id')
        }),
        patient: db.selectOne('telenutrition.schedule_patient', {
          patient_id: db.parent('patient_id'),
        }, {
          lateral: {
            identity: db.selectOne('telenutrition.iam_identity', {
              identity_id: db.parent('identity_id')
            }, {
              lateral: {
                account: db.selectExactlyOne('common.account', {
                  account_id: db.parent('account_id')
                })
              }
            }),
            userPatient: db.selectOne('telenutrition.schedule_user_patient', {
              patient_id: db.parent('patient_id'),
            }, {
              lateral: {
                user: db.selectOne('telenutrition.iam_user', {
                  user_id: db.parent('user_id'),
                })
              }
            })
          },
        }),
      }
    }).run(pool)

    if (record === undefined) {
      logger.error(context, TAG, `appointment not found in database`, { ...options })
      return err(ErrCode.NOT_FOUND)
    }

    let timezone: string
    if (options.timezone) {
      timezone = options.timezone
    } else if (record.patient?.timezone) {
      timezone = record.patient.timezone
    } else {
      const resultTimezone = await Service.getAppointmentTimezone(context, record.appointment_id)

      if (resultTimezone.isErr()) {
        logger.error(context, TAG, 'could not calculate timezone from appointmentId', { appointmentId: record.appointment_id, error: resultTimezone.error })
        return err(resultTimezone.error)
      }

      timezone = resultTimezone.value
    }

    const mapAppointmentRecordResult = await createMapAppointmentRecordFn(context);
    if (mapAppointmentRecordResult.isErr()) {
      logger.error(context, TAG, 'could not create mapAppointmentRecordFn', { error: mapAppointmentRecordResult.error })
      return err(ErrCode.SERVICE)
    }

    const mapAppointmentRecord = mapAppointmentRecordResult.value

    const appointment = mapAppointmentRecord({
      record,
      timezone,
      userId: record.owner?.user_id,
      patient: record.patient,
    })

    return ok(appointment)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export interface SelectUpcomingAppointmentsOptions {
  patientId?: number | number[];
  status?: string;
  days?: number;
  order?: {
    by: string;
    direction: 'ASC' | 'DESC'
  },
  limit?: number
}

/**
 * Select upcoming appointments for patient(s), optionally:
 *  - filtered by status,
 *  - limited to a number of days in the future,
 *  - sorted,
 *  - limited to an overall number.
 * 
 * @param context 
 * @param options 
 * @returns 
 */
export async function selectUpcomingAppointments(context: IContext, options: SelectUpcomingAppointmentsOptions): Promise<Result<AppointmentRecord[], ErrCode>> {
  const {logger, store: {reader}} = context
  const TAG = [ ...MTAG, 'selectUpcomingAppointments' ]

  try {
    logger.debug(context, TAG, 'Selecting upcoming appointments.', {
      options,
    })

    const pool = await reader()

    const patientId = typeof options.patientId === 'number' ? options.patientId : undefined
    const patientIds = Array.isArray(options.patientId) ? options.patientId : undefined

    const appointments = await db.select(
      'telenutrition.schedule_appointment',
      {
        ...(patientId !== undefined && { patient_id: patientId }),
        ...(patientIds !== undefined && { patient_id: dc.isIn(patientIds) }),
        ...(options.status && { status: options.status }),
        ...(options.days !== undefined && {
          start_timestamp: db.sql<zs.telenutrition.schedule_appointment.SQL>`${db.self} BETWEEN CURRENT_TIMESTAMP AND (CURRENT_TIMESTAMP + INTERVAL '1 day' * ${db.param(options.days)})` 
        }),
      },
      {
        ...(options.limit && { limit: options.limit }),
        ...(options.order && {
          order: {
            by: db.param(options.order.by),
            direction: options.order.direction
          }
        }),
      }
    ).run(pool)

    const patients = await db.select(
      'telenutrition.schedule_patient',
      {
        ...(patientId !== undefined && { patient_id: patientId }),
        ...(patientIds !== undefined && { patient_id: dc.isIn(patientIds) })
      }
    ).run(pool)

    const patientTimezones = patients.reduce((mapping, patient) => {
      mapping[String(patient.patient_id)] = patient.timezone
      return mapping
    }, {})


    const mapAppointmentRecordResult = await createMapAppointmentRecordFn(context);
    if (mapAppointmentRecordResult.isErr()) {
      logger.error(context, TAG, 'could not create mapAppointmentRecordFn', { error: mapAppointmentRecordResult.error })
      return err(ErrCode.SERVICE)
    }

    const mapAppointmentRecord = mapAppointmentRecordResult.value

    return ok(appointments.map(appointment =>
      mapAppointmentRecord({
        record: appointment,
        timezone: patientTimezones[String(appointment.patient_id)]
      })
    ))
  } catch (e) {
    logger.exception(context, 'TAG', e)
    return err(ErrCode.EXCEPTION)
  }
}

export type PatientAppointments = { appointments: AppointmentRecord[] }

export type UpcomingAppointmentsResult = { patientAppointments: PatientAppointments[]; providers: ProviderRecord[] };

export async function selectUpcomingAppointmentsForUser(
  context: IContext,
  userId: number,
  timezone: string
): Promise<Result<UpcomingAppointmentsResult, ErrCode>> {
  const { logger, store: { reader } } = context
  const TAG = [ ...MTAG, 'selectUpcomingAppointmentsForUser' ]

  try {
    const pool = await reader()

    const records = await db.select('telenutrition.schedule_user_patient', {
      user_id: userId
    }, {
      lateral: {
        patient: db.selectExactlyOne('telenutrition.schedule_patient', {
          patient_id: db.parent('patient_id')
        }, {
          lateral: {
            identity: db.selectOne('telenutrition.iam_identity', {
              identity_id: db.parent('identity_id')
            })
          }
        }),
        appointments: db.select('telenutrition.schedule_appointment', {
          status: 'f',
          patient_id: db.parent('patient_id'),
          start_timestamp: db.sql<zs.telenutrition.schedule_appointment.SQL>`${db.self} > now()`,
        }, {
          order: { by: 'start_timestamp', direction: 'ASC' }
        })
      }
    }).run(pool)

    const allProviderIdsSet = new Set(
      records.reduce(
        (acc, patient) => [...acc, ...patient.appointments.map(appt => appt.provider_id)], []
      ).filter(id => Boolean(id)) as number[]
    );

    const providers = await db.select('telenutrition.schedule_provider', {
      provider_id: db.conditions.isIn([...allProviderIdsSet])
    }).run(pool);


    const mapAppointmentRecordResult = await createMapAppointmentRecordFn(context);
    if (mapAppointmentRecordResult.isErr()) {
      logger.error(context, TAG, 'could not create mapAppointmentRecordFn', { error: mapAppointmentRecordResult.error })
      return err(ErrCode.SERVICE)
    }

    const mapAppointmentRecord = mapAppointmentRecordResult.value

    const patientAppointments = records
      .filter(record => record.appointments.length > 0)
      .map(record => ({
        ...mapPatientRecord(record.patient),
        appointments: record.appointments.map(appointmentRecord => mapAppointmentRecord({record: appointmentRecord, timezone})),
      }))

    return ok({
      patientAppointments,
      providers: providers.map(provider => mapProviderRecord(provider))
    })
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

interface SelectUpcomingAppointmentsForPatientParams {
  patientId: number;
  timezone: string;
}

export interface UpcomingAppointmentsForPatient {
  appointments: AppointmentRecord[];
  providers: ProviderRecord[];
  patient: PatientRecord;
}

export async function selectUpcomingAppointmentsForPatient(
  context: IContext,
  params: SelectUpcomingAppointmentsForPatientParams
): Promise<Result<UpcomingAppointmentsForPatient, ErrCode>> {
  const { logger, store: { reader } } = context
  const TAG = [ ...MTAG, 'selectUpcomingAppointmentsForPatient' ]

  const { patientId, timezone } = params;

  try {
    const pool = await reader()

    const records = await db.select('telenutrition.schedule_appointment', {
      patient_id: patientId,
      status: 'f',
      start_timestamp: db.sql<zs.telenutrition.schedule_appointment.SQL>`${db.self} > now()`
    }, {
      order: { by: 'start_timestamp', direction: 'ASC' }
    }).run(pool)


    const mapAppointmentRecordResult = await createMapAppointmentRecordFn(context);
    if (mapAppointmentRecordResult.isErr()) {
      logger.error(context, TAG, 'could not create mapAppointmentRecordFn', { error: mapAppointmentRecordResult.error })
      return err(ErrCode.SERVICE)
    }

    const mapAppointmentRecord = mapAppointmentRecordResult.value

    const appointments = records.map(record => mapAppointmentRecord({ record, timezone }))

    const allProviderIdsSet = new Set(records.map(record => record.provider_id).filter(id => Boolean(id)) as number[]);

    const providers = await db.select('telenutrition.schedule_provider', {
      provider_id: db.conditions.isIn([...allProviderIdsSet])
    }).run(pool);

    const patientResult = await Patient.Service.getPatientById(context, { patientId });
    if (patientResult.isErr()) {
      logger.error(context, TAG, 'could not find patient for patientId', { patientId })
      return err(ErrCode.NOT_FOUND)
    }

    return ok({
      appointments,
      providers: providers.map(provider => mapProviderRecord(provider)),
      patient: patientResult.value,
    })
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

interface CreateOverbookedSlotParams {
  startTimestamp: Date,
  appointmentTypeId: number,
  patientId: number,
  paymentMethodId: number,
  scheduledBy: IdentityRecord,
  waitingId: string,
  meetingLink: string
}

export async function createOverbookedSlot(context: IContext, params: CreateOverbookedSlotParams): Promise<Result<BaseAppointmentRecord, ErrCode>> {
  const { logger, store: { writer }} = context
  const TAG = [...MTAG, 'createOverbookedSlot']
  const { startTimestamp, appointmentTypeId, patientId, paymentMethodId } = params

  try {
    const pool = await writer()
    const [appointmentType, patient] = await Promise.all([
      db.selectExactlyOne('telenutrition.schedule_appointment_type', {
        appointment_type_id: appointmentTypeId
      }).run(pool),
      db.selectExactlyOne('telenutrition.schedule_patient', {
        patient_id: params.patientId
      }, {
        lateral: {
          department: db.selectExactlyOne('telenutrition.schedule_department', {
            department_id: db.parent('department_id')
          })
        }
      }).run(pool)
    ])

    const department = patient.department
    const dateTime = DateTime.fromJSDate(startTimestamp)
    if (!dateTime.isValid) {
      logger.error(context, TAG, "Invalid startTimestamp requested for overbook appointment", { startTimestamp })
      return err(ErrCode.ARGUMENT_ERROR)
    }

    const duration = appointmentType.duration
    const meeting: AppointmentMeetingDbRecord = {
      schema_type: 'waiting',
      link: params.meetingLink,
      short_link: params.meetingLink,
    }
    const record = await db.insert('telenutrition.schedule_appointment', {
      patient_id: patientId,
      appointment_type_id: appointmentTypeId,
      department_id: department.department_id,
      frozen: false,
      duration,
      status: 'f',
      payment_method_id: paymentMethodId,
      scheduled_at: new Date(),
      scheduled_by: JSON.stringify(params.scheduledBy),
      ...formatTimeFields(dateTime, department.timezone),
      meeting,
      waiting_id: params.waitingId
    }).run(pool)
    return ok(mapBaseAppointmentRecord(record))
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export type AppointmentMeetingDbRecord = {
  link: string,
  short_link: string,
} & ({
  schema_type: 'zoom_dynamic',
  id: number,
  external_link?: string
} | {
  schema_type: 'waiting'
})

export function formatMeetingData(meeting: ZoomMeeting): AppointmentMeetingDbRecord {
  return {
    schema_type: 'zoom_dynamic',
    id: meeting.id,
    link: meeting.shortJoinUrl, // Use shortlink to ensure any existing comms use our owned URL
    short_link: meeting.shortJoinUrl,
    external_link: meeting.joinUrl
  }
}

interface BookAppointmentParams {
  appointmentId: number,
  appointmentTypeId: number,
  patientId: number,
  paymentMethodId: number,
  scheduledBy: IdentityRecord,
  zoomMeeting: ZoomMeeting
}

export async function bookAppointment(context: IContext, params: BookAppointmentParams, dbTxn?: DbTransaction): Promise<Result<BaseAppointmentRecord, ErrCode>> {
  const { logger, store: { writer }} = context
  const TAG = [...MTAG, 'bookAppointment']

  const { appointmentId, appointmentTypeId, patientId, paymentMethodId, zoomMeeting } = params
  try {
    const pool = await writer()

    const [slot, patient, appointmentType] = await Promise.all([
      db.selectExactlyOne('telenutrition.schedule_appointment', {
        appointment_id: appointmentId
      }).run(pool),
      db.selectExactlyOne('telenutrition.schedule_patient', {
        patient_id: patientId
      }, {
        lateral: {
          department: db.selectExactlyOne('telenutrition.schedule_department', {
            department_id: db.parent('department_id')
          })
        }
      }).run(pool),
      db.selectExactlyOne('telenutrition.schedule_appointment_type', {
        appointment_type_id: appointmentTypeId
      }).run(pool)
    ])

    let updateFields: zs.telenutrition.schedule_appointment.Updatable = {}
    if (patient.department_id !== slot.department_id) {
      updateFields = {
        department_id: patient.department_id,
        ...formatTimeFields(DateTime.fromISO(slot.start_timestamp), patient.department.timezone)
      }
    }

    const duration = appointmentType.duration

    const executeBookAppointments = async (txn) => {
      const updates = await db.update('telenutrition.schedule_appointment', {
        patient_id: patientId,
        appointment_type_id: appointmentTypeId,
        duration,
        status: 'f',
        payment_method_id: paymentMethodId,
        meeting: formatMeetingData(zoomMeeting),
        scheduled_at: new Date(),
        scheduled_by: JSON.stringify(params.scheduledBy),
        ...updateFields
      }, {
        appointment_id: appointmentId,
        status: 'o',
        frozen: false
      }).run(txn)

      if (updates.length === 0) {
        throw new ErrCodeError(ErrCode.NOT_FOUND)
      }

      const appointment = updates[0]
      const startDateTime = DateTime.fromISO(appointment.start_timestamp)
      const providerId = appointment.provider_id
      if (providerId) {
        const conflicts = await queryConflictingAppointmentsForProvider(txn, {
          providerId: providerId,
          startDateTime,
          duration,
          excludeAppointmentId: appointmentId
        })

        const bookedConflicts = conflicts.filter(conflict => conflict.status !== 'o')
        if (bookedConflicts.length > 0) {
          logger.debug(context, TAG, "conflicts found when booking appointment", {
            appointmentId,
            conflictingIds: bookedConflicts.map(conflict => conflict.appointment_id)
          })
          throw new ErrCodeError(ErrCode.CONFLICT)
        }

        if (conflicts.length+1 < duration / 30) {
          logger.debug(context, TAG, "not enough open slots for booking", {
            appointmentId,
            duration
          })
          throw new ErrCodeError(ErrCode.STATE_VIOLATION) // not enough open slots
        }
        const slotsToFreeze = conflicts.map(appt => appt.appointment_id)
        if (slotsToFreeze.length > 0) {
          await db.update('telenutrition.schedule_appointment', {
            frozen: true
          }, {
            appointment_id: db.conditions.isIn(slotsToFreeze)
          }).run(txn)
        }
      }

      return appointment
    }

    const result = dbTxn ? await executeBookAppointments(dbTxn) : await db.serializable(pool, executeBookAppointments);

    return ok(mapBaseAppointmentRecord(result))
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

interface AppointmentCancelReasonRecord {
  appointmentCancelReasonId: number;
  name: string;
  slotAvailable: boolean;
  noShow: boolean;
  providerUnavailable: boolean;
  patientRescheduled: boolean;
}

function mapCancelReasonRecord(record: zs.telenutrition.appointment_cancel_reason.JSONSelectable): AppointmentCancelReasonRecord {
  return {
    appointmentCancelReasonId: record.cancel_reason_id,
    name: record.name,
    slotAvailable: record.slot_available,
    noShow: record.no_show ?? false,
    providerUnavailable: record.provider_unavailable ?? false,
    patientRescheduled: record.patient_rescheduled ?? false
  }
}

export async function selectCancelReasons(context: IContext, params?: { role: string }): Promise<Result<AppointmentCancelReasonRecord[], ErrCode>> {
  const { logger, store: { reader }} = context
  const TAG = [...MTAG, 'selectCancelReasons']
  try {
    const pool = await reader()
    const cancelReasons = await db.select('telenutrition.appointment_cancel_reason', {
      roles: db.conditions.or(...[
        db.conditions.isNull,
        ...(params?.role ? [db.sql`${db.param(params.role)} = ANY(${db.self})`] : [])
      ]),
      visible: true
    }).run(pool)
    return ok(cancelReasons.map(row => mapCancelReasonRecord(row)))
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

interface CancelAppointmentParams {
  appointmentId: number,
  patientId: number,
  cancelledBy?: IdentityRecord,
  cancelReasonId: number
}

export async function cancelAppointment(context: IContext, params: CancelAppointmentParams, dbTxn: DbTransaction): Promise<Result<BaseAppointmentRecord, ErrCode>> {
  const { logger } = context
  const TAG = [...MTAG, 'cancelAppointment']

  const { appointmentId, patientId, cancelReasonId, cancelledBy } = params
  try {
    const [appointment, cancelReason] = await Promise.all([
      db.selectOne('telenutrition.schedule_appointment', {
        appointment_id: appointmentId,
      }, {
        lateral: {
          department: db.selectOne('telenutrition.schedule_department', { department_id: db.parent('department_id') }),
        }
      }).run(dbTxn),
      db.selectOne('telenutrition.appointment_cancel_reason', { cancel_reason_id: cancelReasonId }).run(dbTxn),
    ])

    if (appointment === undefined) {
      return err(ErrCode.NOT_FOUND)
    }

    if (!appointment.department) {
      logger.error(context, TAG, 'error getting department for appointment', { appointmentId })
      return err(ErrCode.STATE_VIOLATION);
    }

    const isEmployeeAction = cancelledBy ? isEmployeeIdentity(cancelledBy) : false
    const cancellableStatuses = isEmployeeAction ? ['f', '2', 'i'] : ['f']

    if (!cancellableStatuses.includes(appointment.status) || appointment.frozen) {
      logger.debug(context, TAG, "Appointment is not in cancellable state", { appointment, cancelledBy, isEmployeeAction, cancellableStatuses })
      return err(ErrCode.STATE_VIOLATION)
    }
    const timezone = appointment.department.timezone
    const slotAvailable = cancelReason?.slot_available

    const update = await db.update('telenutrition.schedule_appointment', {
      status: 'x',
      meeting: null,
      cancel_reason_id: cancelReasonId,
      cancelled_at: new Date(),
      ...(cancelledBy && { cancelled_by: JSON.stringify(cancelledBy) }),
    }, {
      appointment_id: appointmentId,
      frozen: false,
      patient_id: patientId,
      status: db.conditions.isIn(cancellableStatuses)
    }).run(dbTxn)

    if (update.length === 0) {
      logger.debug(context, TAG, "Appointment is no longer cancellable", { appointmentId, cancelledBy, isEmployeeAction, cancellableStatuses })
      throw new ErrCodeError(ErrCode.STATE_VIOLATION)
    }

    const cancelledAppointment = update[0]

    // Attempt encounter update, if it doesn't exist nothing will happen.
    await db.update('telenutrition.clinical_encounter', {
      encounter_status: 'deleted',
      deleted_by: JSON.stringify(cancelledBy),
      deleted_datetime: new Date(),
      last_modified: new Date(),
      updated_at: new Date(),
    }, {
      appointment_id: appointmentId,
    }).run(dbTxn)

    if (slotAvailable && appointment.provider_id) {
      const inserts: zs.telenutrition.schedule_appointment.Insertable[] = []
      const startDateTime = DateTime.fromISO(appointment.start_timestamp, { zone: timezone })
      const numSlotsToCreate = Math.ceil(appointment.duration / 30)
      for (let i=0; i<numSlotsToCreate; i++) {
        let slotStart = startDateTime.plus({ minutes: 30*i })
        inserts.push({
          status: 'o',
          appointment_type_id: 1,
          duration: 30,
          provider_id: appointment.provider_id,
          department_id: appointment.department_id,
          frozen: false,
          ...formatTimeFields(slotStart, timezone)
        })
      }
      if (inserts.length > 0) {
        await db.insert('telenutrition.schedule_appointment', inserts).run(dbTxn)
      }
    }
    return ok(mapBaseAppointmentRecord(cancelledAppointment))
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

interface FreezeAppointmentParams {
  appointmentId: number
}

export async function freezeAppointmentSlot(context: IContext, params: FreezeAppointmentParams): Promise<Result<boolean, ErrCode>> {
  const { logger, store: { writer }} = context
  const TAG = [...MTAG, 'freezeAppointmentSlot']

  try {
    const pool = await writer()
    const update = await db.update('telenutrition.schedule_appointment', {
      frozen: true
    }, {
      status: 'o',
      appointment_id: params.appointmentId
    }).run(pool)
    return ok(update.length > 0)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

type CreateAppointmentSlotDateParameter = {
  appointmentStart: Date;
} | {
  // MM/DD/YYYY
  appointmentDate: string;
  // HH:MM
  appointmentStartTime: string;
}

export type CreateAppointmentSlotParameters = {
  departmentId: number,
  providerId: number | null,
} & CreateAppointmentSlotDateParameter

async function createAppointmentSlot(context: IContext, params: CreateAppointmentSlotParameters): Promise<Result<number[], ErrCode>> {
  const { logger, store: { writer }} = context
  const TAG = [...MTAG, 'createAppointmentSlot']
  
  logger.debug(context, TAG, "creating appointment slot", params)

  try {
    const pool = await writer()
    
    const department = await db.selectOne('telenutrition.schedule_department', { department_id: params.departmentId }).run(pool)
    if (!department) {
      logger.error(context, TAG, 'error getting department during create appointment slot', { department_id: params.departmentId })
      return err(ErrCode.SERVICE)
    }

    const startDateTime: DateTime = ('appointmentStart' in params)
      ? DateTime.fromJSDate(params.appointmentStart, { zone: department.timezone })
      : DateTime.fromFormat(`${params.appointmentDate} ${params.appointmentStartTime}`, 'MM/dd/yyyy HH:mm', { zone: department.timezone })

    if (!startDateTime.isValid) {
      return err(ErrCode.ARGUMENT_ERROR)
    }

    const insertable: zs.telenutrition.schedule_appointment.Insertable = {
      status: 'o',
      appointment_type_id: 1,
      duration: 30,
      provider_id: params.providerId,
      department_id: params.departmentId,
      frozen: false,
      ...formatTimeFields(startDateTime, department.timezone)
    }

    const result = await db.serializable(pool, async (txn) => {
      if (params.providerId) {
        const conflicts = await queryConflictingAppointmentsForProvider(txn, {
          providerId: params.providerId,
          startDateTime,
          duration: 30
        })

        if (conflicts.length > 0) {
          logger.debug(context, TAG, "conflicts found when creating appointment slot", {
            params,
            conflictingIds: conflicts.map(conflict => conflict.appointment_id)
          })
          throw new ErrCodeError(ErrCode.CONFLICT)
        }
      }

      return db.insert('telenutrition.schedule_appointment', insertable).run(txn)
    })
    return ok([result.appointment_id])
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export type CreateAppointmentSlotsParameters = {
  providerId: number,
  skipFrozen?: boolean
} & {
  start: Date,
  end: Date
}

// Bulk insert a block of slots (skipping any conflicts)
async function createAppointmentSlots(context: IContext, params: CreateAppointmentSlotsParameters): Promise<Result<number, ErrCode>> {
  const { logger, store: { writer }} = context
  const TAG = [...MTAG, 'createAppointmentSlots']

  logger.debug(context, TAG, "creating appointment slots", params)

  const startDateTime = DateTime.fromJSDate(params.start)
  const endDateTime = DateTime.fromJSDate(params.end)

  if (
    !startDateTime.isValid ||
    !endDateTime.isValid ||
    !(startDateTime < endDateTime) ||
    startDateTime.minute % 30 !== 0 ||
    endDateTime.minute % 30 !== 0
  ) {
    logger.error(context, TAG, 'invalid date arguments', {
      startDateTime,
      endDateTime
    })
    return err(ErrCode.ARGUMENT_ERROR)
  }

  try {
    const pool = await writer()
    const record = await db.selectOne('telenutrition.schedule_provider', {
      provider_id: params.providerId
    }, {
      lateral: {
        department: db.selectOne('telenutrition.schedule_department', {
          department_id: 1 // create all new slots in dept 1
        })
      }
    }).run(pool)

    const department = record?.department
    if (!department) {
      logger.error(context, TAG, 'error getting department during create appointment slot', { providerId: params.providerId })
      return err(ErrCode.SERVICE)
    }

    const slots: { start: DateTime, end: DateTime }[] = []
    let start = startDateTime.setZone(department.timezone)
    while (start < endDateTime) {
      const end = start.plus({ minutes: 30 })
      slots.push ({ start, end })
      start = end
    }

    const result = await db.serializable(pool, async (txn) => {

      // Query the entire block, and then filter out individual slots
      const conflicts = await queryConflictingAppointmentsForProvider(txn, {
        providerId: params.providerId,
        startDateTime,
        duration: slots.length*30,
        includeFrozen: params.skipFrozen
      })

      const insertables = slots.reduce((res, slot) => {
        if (findConflicts(conflicts, slot).length > 0) {
          logger.debug(context, TAG, "Skipping conflicting slot", slot)
        } else {
          res.push({
            status: 'o',
            appointment_type_id: 1,
            duration: 30,
            provider_id: params.providerId,
            department_id: department.department_id,
            frozen: false,
            ...formatTimeFields(slot.start, department.timezone)
          })
        }
        return res
      }, [] as zs.telenutrition.schedule_appointment.Insertable[])

      if (insertables.length == 0) {
        return []
      }
      return db.insert('telenutrition.schedule_appointment', insertables).run(txn)
    })
    return ok(result.length)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export type createAppointmentMultipleSlotsParameters = {
  providerId: number,
  slots: {startDateTime: DateTime}[],
  departmentId:number
}

async function createAppointmentMultipleSlots(context: IContext, params: createAppointmentMultipleSlotsParameters): Promise<Result<{
  appointmentIds: number[],
  conflictedSlots: { startDateTime: DateTime }[]
}, ErrCode>> {
  const {logger, store: {writer}} = context
  const TAG = [...MTAG, 'createRecurringAppointmentSlots']

  logger.debug(context, TAG, "creating recurring appointment slots", params)

  const {providerId, slots, departmentId} = params

  try {
    const pool = await writer()

    let conflictedSlots;

    const result = await db.serializable(pool, async (txn) => {

      const conflictResults = await Promise.all(slots.map(async slot => {
        const {startDateTime} = slot
        const conflicts = await queryConflictingAppointmentsForProvider(txn, {
          providerId: params.providerId,
          startDateTime,
          duration: 30,
          includeFrozen: false
        })
        return {slot, conflicts}
      }))
      const insertSlots = conflictResults.filter(({conflicts}) => conflicts.length === 0)
          .map(({slot}) => slot)
      conflictedSlots = conflictResults.filter(({conflicts}) => conflicts.length > 0)
          .map(({slot}) => slot)

      const insertables: zs.telenutrition.schedule_appointment.Insertable[] = insertSlots.map(slot =>
          ({
            status: 'o',
            appointment_type_id: 1,
            duration: 30,
            provider_id: providerId,
            department_id: departmentId,
            frozen: false,
            ...formatTimeFields(slot.startDateTime)
          })
      )

      if (insertables.length == 0) {
        return []
      }
      return db.insert('telenutrition.schedule_appointment', insertables).run(txn)
    })

    const appointmentIds = result.map(r => r.appointment_id)

    return ok({appointmentIds, conflictedSlots})
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export async function queryConflictingAppointmentsForProvider(queryable: db.Queryable, params: {
  startDateTime: DateTime,
  providerId: number,
  duration: number,
  excludeAppointmentId?: number,
  includeFrozen?: boolean,
}): Promise<zs.telenutrition.schedule_appointment.JSONSelectable[]> {
  const { providerId, excludeAppointmentId } = params
  const start = params.startDateTime
  const end = params.startDateTime.plus({ minutes: params.duration })
  const existing = await db.select('telenutrition.schedule_appointment', {
    provider_id: providerId,
    status: db.conditions.ne('x'),
    ...(!params.includeFrozen && { frozen: false }),
    ...(excludeAppointmentId && { appointment_id: db.conditions.ne(excludeAppointmentId) }),
    start_timestamp: db.conditions.between(
      start.minus({ minutes: 60 }).toJSDate(), // Check if an earlier appt overlaps
      end.toJSDate()
    )
  }).run(queryable)

  return findConflicts(existing, { start, end })
}

function findConflicts(
  slots: zs.telenutrition.schedule_appointment.JSONSelectable[],
  range: { start: DateTime, end: DateTime }
) {
  return slots.filter(appt => {
    const apptStart = DateTime.fromISO(appt.start_timestamp)
    const apptEnd = apptStart.plus({ minutes: appt.duration })
    return range.start < apptEnd && range.end > apptStart
  })
}

async function getNonBookableMonthsForPatient(
  context: IContext,
  params: {
    patientId: number;
    rescheduleAppointmentId?: number;
    paymentMethod: PaymentMethodRecord;
    timezone?: string;
  },
): Promise<Result<string[], ErrCode>> {
  const {
    logger,
    store: { reader },
  } = context;

  const TAG = [...MTAG, 'getNonBookableMonthsForPatient'];
  const { patientId, rescheduleAppointmentId, paymentMethod } = params;

  try {
    const categoryResult = await getDRCCategory(context, { paymentMethod });
    if (categoryResult.isErr()) {
      logger.error(context, TAG, 'Error fetching DRC category', { error: categoryResult.error });
      return err(categoryResult.error);
    }

    const category = categoryResult.value;
    if (category === null || category === 'excluded') {
      return ok([]); // No restrictions
    }

    const timezone = params.timezone ?? 'US/Central'

    const pool = await reader();
    const history = await db.sql<zs.telenutrition.schedule_appointment.SQL, { month: Date; count: number }[]>`
      SELECT
        DATE_TRUNC('month', ${'start_timestamp'} AT TIME ZONE ${db.param(timezone)})::date AS month,
        COUNT(*)::int AS count
      FROM ${'telenutrition.schedule_appointment'}
      WHERE ${{
        patient_id: patientId,
        payment_method_id: paymentMethod.id,
        status: db.conditions.ne('x'),
        frozen: false,
        ...(rescheduleAppointmentId && { appointment_id: db.conditions.ne(rescheduleAppointmentId) }),
      }}
      GROUP BY month
      ORDER BY month ASC
    `.run(pool);

    if (history.length === 0) return ok([]);

    const config = {
      leadMonths: 2,
      leadLimit: 5,
      limit: 1
    }

    const initialMonth = DateTime.fromJSDate(history[0].month);
    let leadCount = 0;
    let nonBookableMonths: string[] = [];
    for (const block of history) {
      let month = DateTime.fromJSDate(block.month);
      if (month.diff(initialMonth, 'months').as('months') < config.leadMonths) {
        leadCount += block.count;
      } else if (block.count >= config.limit) {
        nonBookableMonths.push(month.toISODate()!);
      }
    }
    if (leadCount >= config.leadLimit) {
      for (let i=0; i<config.leadMonths; i++) {
        nonBookableMonths.push(initialMonth.plus({ months: i }).toISODate()!)
      }
    }
    return ok(nonBookableMonths)
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

async function getNonBookableIsoDatesForPatient(context: IContext, params: {
  patientId: number,
  rescheduleAppointmentId?: number,
  timezone?: string,
}): Promise<Result<string[], ErrCode>> {
  const { logger, store: { reader } } = context

  const TAG = [...MTAG, 'getNonBookableDatesForPatient']
  const { patientId, rescheduleAppointmentId } = params

  try {
    const pool = await reader()
    const records = await db.select('telenutrition.schedule_appointment', {
      patient_id: patientId,
      status: db.conditions.ne('x'),
      start_timestamp: db.conditions.after(
        db.conditions.fromNow(-7, 'days')
      ),
      ...(rescheduleAppointmentId && { appointment_id: db.conditions.ne(rescheduleAppointmentId) })
    }, {
      columns: ['start_timestamp']
    }).run(pool)

    const nonBookableDates = records.flatMap(appt => {
      const startTimestampDT = DateTime.fromISO(appt.start_timestamp).setZone(params.timezone ?? 'US/Central')
      const startOfWeek = startTimestampDT.weekday === 7 ? startTimestampDT : startTimestampDT.startOf('week').minus({ day: 1 })
      const endOfWeek = startOfWeek.plus({ days: 7 })

      return (
        Interval.fromDateTimes(startOfWeek, endOfWeek)
          .splitBy({ day: 1 })
          .map((d) => d.start)
          .filter((d) => d && d.isValid) as DateTime[])
          .map(day => day.toISODate()!
      )
    })
    return ok(_.uniq(nonBookableDates))
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

async function selectPastMeetingIds(context: IContext, params: {
  numDays: number
}): Promise<Result<string[], ErrCode>> {
  const { logger, store: { reader } } = context

  const TAG = [...MTAG, 'selectPastMeetingIds']
  const numDays = params.numDays

  try {
    const pool = await reader()
    const records = await db.select('telenutrition.schedule_appointment', {
      meeting_id: db.conditions.isNotNull,
      start_timestamp: db.conditions.between(
        db.conditions.fromNow(-numDays, 'days'),
        db.conditions.now
      )
    }, {
      columns: ['meeting_id']
    }).run(pool)
    return ok(records.map(row => row.meeting_id!))
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export default {
  selectAppointmentById,
  selectAppointmentType,
  selectOneAppointment,
  selectPastMeetingIds,
  selectUpcomingAppointments,
  selectUpcomingAppointmentsForUser,
  selectUpcomingAppointmentsForPatient,
  createMapAppointmentRecordFn,
  bookAppointment,
  selectCancelReasons,
  cancelAppointment,
  createAppointmentSlot,
  createAppointmentSlots,
  createAppointmentMultipleSlots,
  freezeAppointmentSlot,
  createOverbookedSlot,
  getNonBookableIsoDatesForPatient,
  getNonBookableMonthsForPatient
}
