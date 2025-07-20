import type { DbTransaction, IContext } from "@mono/common/lib/context"
import { ErrCode, getErrorCodeMessage } from "@mono/common/lib/error"
import { err, ok, Result } from "neverthrow"
import Logger from '@mono/common/lib/logger'
import * as db from 'zapatos/db'
import * as zs from 'zapatos/schema'
import { shuffle } from 'shuffle-seed'
import * as _ from 'lodash'
import { bookAppointment, fetchAvailableProviderSlotsForBooking } from '../service'
import { AppointmentRecord, AppointmentSlotRecord, AppointmentStoreRecord, AppointmentType, BaseAppointmentRecord, GroupedAppointmentSlots, ValidAppointmentSlotDuration } from './types'
import Store, { createMapAppointmentRecordFn, UpcomingAppointmentsForPatient, UpcomingAppointmentsResult } from './store'
import { SendCioEventOptions, sendCioEvent } from '../cio'
import { sendAppointmentUpdateEvent } from '../sync'
import {InsuranceId} from '../insurance/service'
import Provider from '../provider'
import Patient from '../patient'
import Payment from '../payment'
import Insurance from '../insurance'
import { AppointmentTypeId } from "../flow-v2/constants"
import { isPendingProviderAllowed } from "../provider/service"
import { PatientRecord } from "../patient/store"
import { audioAppointmentTypeIds } from '../flow-v2/flows/schedule/constants';
import { z } from "zod"
import { PaymentSchema } from "../scheduling-flow/schema"
import Appointment from '../appointment'
import { IdentityRecord } from "../../iam/types"
import { DateTime, Interval } from "luxon"
import { groupAppointmentSlotsByDayAndProvider } from "./helpers"
import FoodappStore from "@mono/foodapp/lib/store"
import { hasSSO } from "../../iam/auth"
import { getDefaultPaymentMethod } from "../payment/service"
import { PaymentMethodRecord, voidPaymentTransactionsByAppointmentId } from "../payment/store"
import { mapProviderRecord, mapProviderRecordShort } from "../provider/store"
import { ProviderRecord, ProviderRecordShort } from "../provider/shared"
import CallCenter from '../../callcenter'
import Zoom from "../zoom"
import { promiseMap } from "@mono/common/lib/promise"

const TimezoneCodes = {
  'America/Puerto_Rico': 'US/Atlantic',
  'America/New_York': 'US/Eastern',
  'America/Chicago': 'US/Central',
  'America/Denver': 'US/Mountain',
  'America/Los_Angeles': 'US/Pacific',
  'America/Juneau': 'US/Alaska',
  'America/Phoenix': 'US/Mountain',
  'Pacific/Honolulu': 'US/Aleutian'
}

const TimezoneNames = {
  'US/Central': 'Central Timezone',
  'US/Eastern': 'Eastern Timezone',
  'US/Arizona': 'Arizona Timezone',
  'US/Mountain': 'Mountain Timezone',
  'US/Pacific': 'Pacific Timezone',
  'US/Alaska': 'Alaska Timezone',
  'US/Aleutian': 'Aleutian Timezone',
  'US/Atlantic': 'Atlantic Timezone',
}

const MTAG = Logger.tag()

/**
 * Create an appointment reminder. This is simply sending an event to cio.
 * @param context 
 * @param appointmentId 
 * @returns 
 */
export async function createAppointmentReminder(context: IContext, appointmentId: number): Promise<Result<true, ErrCode>> {
  const {logger, config } = context
  const TAG = [...MTAG, 'scheduling.appointment.service.createAppointmentReminder']

  try {
    const getApptResult = await getAppointment(context, { appointmentId })

    if (getApptResult.isErr()) {
      logger.error(context, TAG, 'Error getting appointment.', {
        error: getApptResult.error,
      })

      return err(ErrCode.SERVICE)
    }

    const appointment = getApptResult.value

    const { appointmentTypeId, duration: appointmentDuration, startTimestamp} = appointment

    logger.debug(context, TAG, 'appointment retrieved.', {
      appointment_id: appointmentId,
      appointment,
    })

    const patientId = appointment.patientId

    if (patientId === undefined) {
      logger.error(context, TAG, 'Appointment does not have corresponding patient.', {
        appointment: getApptResult.value
      })

      return err(ErrCode.SERVICE)
    }

    const eventOptions: SendCioEventOptions = {
      type: 'appointment_reminder',
      patientId,
      providerId: appointment.providerId,
      appointmentId, 
      appointmentTypeId,
      appointmentTimestamp: startTimestamp,
      appointmentDuration,
    }

    const result = await sendCioEvent(context, eventOptions)

    if (result.isErr()) {
      logger.error(context, TAG, 'Failed to send booked appointment event.', {
        event_options: eventOptions,
        error: result.error
      })

      return err(ErrCode.SERVICE)
    }

    return ok(true)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export type GetAppointmentOptions = {
  appointmentId: number;
  timezone?: string;
}

export async function getAppointment(context: IContext, options: GetAppointmentOptions | { waitingId: string }): Promise<Result<AppointmentRecord, ErrCode>> {
  const { logger } = context

  try {
    const result = await Store.selectOneAppointment(context, options)

    if (result.isErr()) {
      return err(result.error)
    }
    return ok(result.value)
  } catch (e) {
    logger.exception(context, 'appointment.service.getAppointment', e)
    return err(ErrCode.EXCEPTION)
  }
}

type GetAppointmentDetailsOptions = GetAppointmentOptions & {
  nutriquiz?: boolean;
}

export interface GetAppointmentDetailsResult {
  appointment: AppointmentRecord; 
  paymentMethod?: PaymentMethodRecord;
  providerName: string;
  lastNutriquizCompletion?: Date;
  hasNutriquiz?: boolean;
  patientPaymentMethods: PaymentMethodRecord[];
}


export async function getAppointmentDetails(context: IContext, options: GetAppointmentDetailsOptions): Promise<Result<GetAppointmentDetailsResult, ErrCode>> {
  const { logger, store: {reader} } = context
  const TAG = 'service.getAppointment'
  
  try {
    const pool = await reader();

    const timezone = options.timezone;

    const result = await Store.selectOneAppointment(context, { appointmentId: options.appointmentId, timezone })

    if (result.isErr()) {
      return err(result.error)
    }

    const appointment = result.value
    let provider: zs.telenutrition.schedule_provider.JSONSelectable | undefined
    if (appointment.providerId) {
      provider = await db.selectOne('telenutrition.schedule_provider', {provider_id: appointment.providerId}).run(pool);
      
      if (!provider) {
        logger.error(context, TAG, 'Failed to find provider from id', {providerId: appointment.providerId});
        return err(ErrCode.NOT_FOUND);
      }
    }

    // TODO: move somewhere more fitting once new design/UX is ready
    const identityId = appointment.patient?.identityId
    let lastNutriquizCompletion: Date | undefined
    let hasNutriquiz = false
    if (options.nutriquiz && appointment.patient) {
      const hasSSOResult = await hasSSO(context, appointment.patient)
      if (hasSSOResult.isErr()) {
        logger.error(context, TAG, 'error determining if patient has SSO', { error: hasSSOResult.error })
        return err(hasSSOResult.error)
      }
      hasNutriquiz = hasSSOResult.value

      if (hasNutriquiz && identityId) {
        const completionResult = await FoodappStore.Surveys.fetchLastSurveyQuestionCompletion(context, 'light_exercise', identityId)
        if (completionResult.isOk()) {
          lastNutriquizCompletion = completionResult.value
        }
      }
    }

    let paymentMethod: PaymentMethodRecord | undefined;
    if (appointment.patientId && appointment.paymentMethodId) {
      const patientPaymentMethodResult = await Payment.Service.getPatientPaymentMethod(context, { patientId: appointment.patientId, paymentMethodId: appointment.paymentMethodId })
      
      if (patientPaymentMethodResult.isErr()) {
        logger.error(context, TAG, 'unable to fetch patient payment method', { error: patientPaymentMethodResult.error })
        return err(ErrCode.SERVICE)
      }

      paymentMethod = patientPaymentMethodResult.value;
    }

    let patientPaymentMethods: PaymentMethodRecord[] = []
    if (appointment.patientId) {
      const allPatientPaymentMethodsResult = await Payment.Service.getPatientPaymentMethods(context, { patientId: appointment.patientId })

      if (allPatientPaymentMethodsResult.isErr()) {
        logger.error(context, TAG, 'unable to fetch all patient payment methods', {error: allPatientPaymentMethodsResult.error })
        return err(ErrCode.SERVICE)
      }

      patientPaymentMethods = allPatientPaymentMethodsResult.value
    }

    return ok({
      appointment,
      providerName: provider ? `${provider.first_name} ${provider.last_name}, RD` : 'Foodsmart',
      lastNutriquizCompletion,
      hasNutriquiz,
      paymentMethod: paymentMethod,
      patientPaymentMethods
    })
  } catch (e) {
    logger.exception(context, 'appointment.service.getAppointmentDetails', e)
    return err(ErrCode.EXCEPTION)
  }
}

async function getCancelledAppointmentIds(context: IContext): Promise<Result<number[], ErrCode>> {
  const { logger, store: {reader} } = context

  try {
    const pool = await reader()
    const appointments = await db.select('telenutrition.schedule_appointment', {
      status: 'x',
      start_timestamp: db.sql<zs.telenutrition.schedule_appointment.SQL>`${db.self} BETWEEN (CURRENT_TIMESTAMP - INTERVAL '1 month') AND (CURRENT_TIMESTAMP + INTERVAL '1 month')`,
    },{
      columns: ['appointment_id'],
    }).run(pool)

    return ok(appointments.map(appointment => appointment.appointment_id))
  } catch (e) {
    logger.exception(context, 'appointment.service.getCancelledAppointmentIds', e)
    return err(ErrCode.EXCEPTION)
  }
}

interface GetDefaultProviderIdListParams {
  payment: z.infer<typeof PaymentSchema>;
  patient: PatientRecord;
  onlyW2?: boolean;
  onlyActiveProviders?: boolean;
  providerIds?: number[] // only search against these providerIds
}

export async function getDefaultProviderIdList(context: IContext, params: GetDefaultProviderIdListParams): Promise<Result<number[], ErrCode>> {
  const { store: { reader }, config, logger } = context

  const TAG = [...MTAG, 'getDefaultProviderIdList']

  const inProviderIds = params.providerIds
  if (inProviderIds && inProviderIds.length === 0) {
    return ok([])
  }

  try {
    const pool = await reader()

    const allowPending = isPendingProviderAllowed(params)
    const insuranceId = 'insurance_id' in params.payment ? params.payment.insurance_id : undefined;
    const schedulableTypes = allowPending ? ['all', 'pending'] : ['all']
    
    // get all providers providing scheduling for a department
    const departmentProviderMapping = await db.select('telenutrition.schedule_department_provider_licensed', {
      department_id: params.patient.departmentId,
      schedulable_type: db.conditions.isIn(schedulableTypes),
      ...(inProviderIds && { provider_id: db.conditions.isIn(inProviderIds)})
    }).run(pool)
    let providerIds = departmentProviderMapping.map(mapping => mapping.provider_id!)

    if (providerIds.length === 0) {
      return ok([])
    }

    // get all providers providing scheduling for a payer
    if (insuranceId !== undefined) {
      const insuranceProviderIdsResult = await Insurance.Service.getInsuranceProviderIds(context, { insuranceId, providerIds })
      if (insuranceProviderIdsResult.isErr()) {
        logger.error(context, TAG, 'error getting the insurance provider ids', { insuranceId })
        return err(ErrCode.SERVICE);
      }
      const insuranceProviderIds = insuranceProviderIdsResult.value;
      
      if (insuranceProviderIds !== null) {
        providerIds = providerIds.filter(providerId => insuranceProviderIds.includes(providerId))
      }
    }
    
    // remove any providers that have been manually excluded in the config
    const providersExclude = config.telenutrition.scheduling.providers.exclude
    if (providersExclude.length) {
      providerIds = providerIds.filter(providerId => !providersExclude.includes(providerId))
    }
    
    // whitelisted providers
    const whiteListedProviders = Provider.Service.getWhiteListedProviders({ payment: params.payment })
    if (whiteListedProviders.length) {
      providerIds = providerIds.filter(providerId => whiteListedProviders.includes(providerId))
    }
    
    // remove any duplicate provider ids
    providerIds = [...new Set(providerIds)]

    const birthday = params.patient.birthday
    const age = birthday ? Math.floor(-DateTime.fromISO(birthday).diffNow('years').as('years')) : undefined
    const providers = await db
      .select(
        'telenutrition.schedule_provider',
        {
          provider_id: db.conditions.isIn(providerIds),
          credentialing_committee_status: 'approved',
          ...(age !== undefined && { min_patient_age: db.conditions.lte(age) })
        }, {
          lateral: {
            employee: db.selectOne('common.employee', {
              employee_id: db.parent('employee_id')
            }, {
              columns: ['employment_type', 'role_state']
            })
          },
          columns: ['provider_id']
        }).run(pool)

    providerIds = providers.filter(p => {
      const isW2 = p.employee?.employment_type && ['salaried_ft', 'salaried_pt'].includes(p.employee.employment_type)
      const activeRoleState = p.employee?.role_state === "active";
      return ((!params.onlyW2 || isW2) && (!params.onlyActiveProviders || activeRoleState))
    }).map(p => p.provider_id)

    logger.info(context, TAG, 'providers', { providerIds })
    
    return ok(providerIds)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

type GetAppointmentSlotsOptions = {
  accountId?: number;
  patientId: number;
  paymentMethodId?: number;
  isFollowUp: boolean;
  providerIds?: number[];
}

type GetRescheduleAppointmentsOptions = {
  providerIds?: number[];
  rescheduleForAppointmentId: number;
}

export type GetAppointmentsParams = {
  cid: string;
  timezone?: string;
  fromTime?: Date;
  toTime?: Date
  noLeadTime?: boolean
} & (GetAppointmentSlotsOptions | GetRescheduleAppointmentsOptions);

export interface GetAppointmentSlotsReturn {
  slots: _.Dictionary<GroupedAppointmentSlots[]>;
  providers: ProviderRecordShort[];
  timezone: string | null;
}

/**
 * Gets all appointments open and available for scheduling
 * 
 * @param context 
 */
 async function getAppointmentSlots(context: IContext, params: GetAppointmentsParams): Promise<Result<GetAppointmentSlotsReturn, ErrCode>> {
  const { store: { reader }, logger } = context

  const TAG = [...MTAG, 'getAppointmentSlots']
  let schedulingParamsResult: Result<SchedulingParams, ErrCode>

  if ('rescheduleForAppointmentId' in params) {
    const apptResult = await getAppointment(context, { appointmentId: params.rescheduleForAppointmentId })
    if (apptResult.isErr()) {
      logger.error(context, 'service.getAppointment', 'Error getting rescheduleForAppointmentId', {
        rescheduleForAppointmentId: params.rescheduleForAppointmentId
       })
      return err(apptResult.error)
    }
    schedulingParamsResult = await buildSchedulingParams(context, {
      rescheduleForAppointment: apptResult.value,
      providerIds: params.providerIds,
      noLeadTime: params.noLeadTime
    })
  } else {
    schedulingParamsResult = await buildSchedulingParams(context, {
      patientId: params.patientId,
      paymentMethodId: params.paymentMethodId,
      fromTime: params.fromTime,
      toTime: params.toTime,
      providerIds: params.providerIds,
      noLeadTime: params.noLeadTime
    })
  }

  if (schedulingParamsResult.isErr()) {
    logger.error(context, 'service.getAppointment', 'error building scheduling params', {
      error: schedulingParamsResult.error
    })
    return err(schedulingParamsResult.error)
  }

  const {
    providerIds,
    patient,
    timestampQuery,
    validAppointmentDurations
  } = schedulingParamsResult.value

  const timezone = params.timezone ?? patient.timezone
  if (providerIds.length === 0) {
    return ok({
      providers: [],
      slots: {},
      timezone,
    })
  }

  try {
    const pool = await reader()
    const eligibleProviders = await db.select('telenutrition.schedule_provider', {
      provider_id: db.conditions.isIn(providerIds)
    }, {
      lateral: {
        employee: db.selectOne('common.employee', {
          employee_id: db.parent('employee_id')
        }, {
          columns: ['employment_type']
        })
      }
    }).run(pool)

    // Distinct list of providerIds that this patient has already booked with
    const scheduledProvidersQuery = db.select('telenutrition.schedule_appointment', {
      patient_id: patient.patientId
    }, {
      columns: ['provider_id'],
      distinct: 'provider_id'
    }).run(pool)


    // query all open appointment (appointmentstatus = 'o') AND providerId in (...providerIds) AND appointmentStart between (startDate, endDate)
    // the appointment times must be converted to correct timezone
    // the appointment should be sorted by date/time
    const appointments: AppointmentStoreRecord[] = await db.select('telenutrition.schedule_appointment', {
      status: 'o',
      frozen: false,
      provider_id: db.conditions.isIn(providerIds),
      start_timestamp: timestampQuery,
    }, {
      columns: ['appointment_id', 'duration', 'provider_id'],
      extras: {
        start_timestamp: db.sql`start_timestamp AT TIME ZONE '${db.raw(timezone)}'`
      },
      order: { by: 'start_timestamp', direction: 'ASC' },
      limit: 250000,
    }).run(pool) as AppointmentStoreRecord[]

    logger.debug(context, TAG, 'fetched appointments', { appointmentsCount: appointments.length })

    const providers = _.keyBy(eligibleProviders, provider => provider.provider_id)

    const appointmentsProvider: Record<number, AppointmentStoreRecord[]> =
      _.groupBy(appointments, appt => appt.provider_id)

    // Rollup all the appointments by provider and in sequential segments
    const appointmentsProviderSegments: Record<number, AppointmentStoreRecord[][]> = {}
    for (let [provider_id, appointments] of Object.entries(appointmentsProvider)) {
      const segments = rollUpAppointmentSlotsIntoSegments({appointments})
      appointmentsProviderSegments[provider_id] = segments
    }

    const validDurationsType: ValidAppointmentSlotDuration = (() => {
      const canSchedule60 = validAppointmentDurations.some(d => d === 60)
      const canSchedule30 = validAppointmentDurations.some(d => d === 30)

      if (canSchedule30 && !canSchedule60) return '30-only'
      if (canSchedule60 && !canSchedule30) return '60-only'
      return '30-or-60'
    })()

    // Merge all appointments into slots if the appointment type duration exceeds the appointment slot size
    const appointmentSlots: AppointmentSlotRecord[] = []
    for (let [provider_id, appointmentSegments] of Object.entries(appointmentsProviderSegments)) {
      const providerAppointmentSlotsResult = mergeAppointmentSlotsByDuration(context, {segments: appointmentSegments, validDurationsType, timezone})
      if (providerAppointmentSlotsResult.isErr()) {
        logger.error(context, TAG, 'error merging appointment slots', { error: providerAppointmentSlotsResult.error })
        return err(providerAppointmentSlotsResult.error)
      }
      const providerAppointmentSlots = providerAppointmentSlotsResult.value
      appointmentSlots.push(...providerAppointmentSlots)
    }

    const pastProviderIds = new Set((await scheduledProvidersQuery).map(p => p.provider_id))
    const providersPresent =
      _.uniq(appointmentSlots.map(slot => slot.providerId).filter(providerId => !!providerId) as number[])
      .map(providerId => providers[providerId])

    const _timezone = TimezoneCodes[timezone] || timezone
    const displayTimezone = TimezoneNames[_timezone] || _timezone
    const shuffledProviders = shuffle(providersPresent, params.cid)

    const availabilityIndex = _.mapValues(appointmentsProvider, p => ~~(p.length/20)+1)
    const orderedProviders = _.sortBy(shuffledProviders, p => {
      if (pastProviderIds.has(p.provider_id)) {
        return 0
      }
      const isW2 = p.employee?.employment_type && ['salaried_ft', 'salaried_pt'].includes(p.employee.employment_type)
      return (isW2 ? 0 : 1) + (1/(availabilityIndex[p.provider_id] ?? 1))
    })
    const providerIndex = orderedProviders.reduce((res, provider, index)=> {
      res[provider.provider_id] = index
      return res
    }, {})
    
    const orderedSlots = groupAppointmentSlotsByDayAndProvider(appointmentSlots, providerIndex)
    const mappedProviders = orderedProviders.map(p => mapProviderRecordShort(p))

    // get all appointment times which is an array of appointment slot ids, there can be multiple appointment slots for one appointment
    // partition by day
    return ok({
      providers: mappedProviders,
      slots: orderedSlots,
      timezone: displayTimezone,
      validDurationsType,
    })
  } catch (e) {
    logger.exception(context, 'service.getAppointments', e)
    return err(ErrCode.EXCEPTION)
  }
}

type ProviderIdOption = { providerOId: string } | { providerId: number }

type GetProviderAppointmentsOptions = ProviderIdOption & {
  timezone: string;
  patientId?: number;
}

type GetProviderAppointmentsResult = {
  slots: AppointmentRecord[];
  timezone: string;
  provider?: {
    name: string;
  };
  departments: {
    departmentId: number;
    name: string;
    state: string;
    timezone: string;
  }[];
}

/**
 * Gets all (open or booked) slots for provider
 * 
 * @param context
 * @param options
 */
async function getProviderAppointmentSlots(context: IContext, options: GetProviderAppointmentsOptions): Promise<Result<GetProviderAppointmentsResult, ErrCode>> {
  const { store: { reader }, logger } = context
  const TAG = [...MTAG, 'getProviderAppointmentSlots']

  try {
    const pool = await reader()

    let provider: ProviderRecord;

    if ('providerOId' in options) {
      const providerResult = await Provider.Service.getProvider(context, { oktaId: options.providerOId });

      if (providerResult.isErr()) {
        logger.error(context, TAG, 'could not fetch provider by oid', { oktaId: options.providerOId })
        return err(providerResult.error);
      }

      provider = providerResult.value
    } else {
      const providerResult = await db.selectExactlyOne('telenutrition.schedule_provider', {
        provider_id: options.providerId
      }).run(pool)
      
      provider = mapProviderRecord(providerResult)
    }

    let timestampQuery: db.SQLFragment<boolean | null, Date> | undefined
    if (options.patientId) {
      const schedulingParamsResult = await buildSchedulingParams(context, {
        noLeadTime: true,
        providerIds: [provider.providerId],
        patientId: options.patientId
      })
      if (schedulingParamsResult.isErr()) {
        logger.error(context, TAG, 'could not build scheduling params', { error: schedulingParamsResult.error })
        return err(ErrCode.SERVICE)
      }
      timestampQuery = schedulingParamsResult.value.timestampQuery
    }

    const providerAppointments = await db.select('telenutrition.schedule_appointment', db.sql<zs.telenutrition.schedule_appointment.SQL>`
      ${{
        provider_id: provider.providerId,
        frozen: false,
      }} AND ((${{
        status: db.conditions.isNotIn(['x','o']),
        start_timestamp: options.patientId ?
          db.conditions.gt(db.conditions.fromNow(-1, 'day')) :
          db.conditions.gt(db.conditions.fromNow(-1, 'year'))
      }}) OR (${{
        status: 'o',
        start_timestamp: db.conditions.gt(db.conditions.fromNow(-1, 'day'))
      }}))`, {
      lateral: {
        department: db.selectOne('telenutrition.schedule_department', { department_id: db.parent('department_id') }),
        encounter: db.selectOne('telenutrition.clinical_encounter', { appointment_id: db.parent('appointment_id') }),
        patient: db.selectOne('telenutrition.schedule_patient', {
          patient_id: db.parent('patient_id'),
        }, {
          lateral: {
            identity: db.selectOne('telenutrition.iam_identity', {
              identity_id: db.parent('identity_id')
            })
          }
        }),
      },
      extras: {
        bookable: db.sql<zs.telenutrition.schedule_appointment.SQL, boolean>`
        ${{
          status: 'o',
          ...(timestampQuery && { start_timestamp: timestampQuery })
        }} IS TRUE`
      },
      order: { by: 'start_timestamp', direction: 'ASC'}
    }).run(pool);

    const mapAppointmentRecordResult = await createMapAppointmentRecordFn(context);
    if (mapAppointmentRecordResult.isErr()) {
      logger.error(context, TAG, 'could not create mapAppointmentRecordFn', { error: mapAppointmentRecordResult.error })
      return err(ErrCode.SERVICE)
    }

    const mapAppointmentRecord = mapAppointmentRecordResult.value

    const mappedAppts = providerAppointments.map((record) => ({
      ...mapAppointmentRecord({ record, timezone: options.timezone, patient: record.patient }),
      bookable: record.bookable
    }))

    const providerDepartments = await db.select('telenutrition.schedule_department_provider', {
      provider_id: provider.providerId
    }, {
      lateral: {
        department: db.selectExactlyOne('telenutrition.schedule_department', { department_id: db.parent('department_id') })
      }
    }).run(pool)

    return ok({
      slots: mappedAppts,
      timezone: options.timezone,
      departments: providerDepartments.map(dept => ({
        departmentId: dept.department_id,
        name: dept.department.name,
        state: dept.department.state,
        timezone: dept.department.timezone
      })),
      provider:  {
        name: provider.name
      },
    })
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

export async function getAppointmentTimezone(context: IContext, appointmentId: number): Promise<Result<string, ErrCode>> {
  const {logger, store: {reader}} = context

  try {
    const pool = await reader()

    const record = await db.selectOne('telenutrition.schedule_appointment', {
      appointment_id: appointmentId,
    }, {
      lateral: {
        patient: db.selectOne('telenutrition.schedule_patient', { patient_id: db.parent('patient_id') }),
        department: db.selectOne('telenutrition.schedule_department', { department_id: db.parent('department_id') }),
      }
    }).run(pool)
  
    if (record === undefined) {
      logger.warn(context, `appointment.service.getAppointmentTimezone`, `appointment not found`, {appointmentId})
      return err(ErrCode.NOT_FOUND)
    }

    if (record.patient?.timezone) {
      return ok(record.patient.timezone)
    }

    if (record.department?.timezone) {
      return ok(record.department.timezone)
    }
    
    return err(ErrCode.NOT_FOUND)
  } catch(e) {
    logger.exception(context, 'appointment.service.getAppointmentTimezone', e)
    return err(ErrCode.EXCEPTION)
  }
}

type getUpcomingAppointmentsOptions = {
  userId: number,
  timezone: string
}

async function getUpcomingAppointments(
  context: IContext,
  options: getUpcomingAppointmentsOptions
): Promise<Result<UpcomingAppointmentsResult, ErrCode>> {
  const { logger } = context

  try {
    const result = await Store.selectUpcomingAppointmentsForUser(context, options.userId, options.timezone)

    if (result.isErr()) {
      return err(result.error)
    }

    return ok(result.value)
  } catch (e) {
    logger.exception(context, 'appointment.service.getUpcomingAppointments', e)
    return err(ErrCode.EXCEPTION)
  }
}

interface GetUpcomingAppointmentsForPatientParams {
  patientId: number;
  timezone: string;
}

export async function getUpcomingAppointmentsForPatient(
  context: IContext,
  params: GetUpcomingAppointmentsForPatientParams
): Promise<Result<UpcomingAppointmentsForPatient, ErrCode>> {
  const { logger } = context
  const TAG = [...MTAG, 'getUpcomingAppointmentsForPatient']

  try {
    const result = await Store.selectUpcomingAppointmentsForPatient(context, { patientId: params.patientId, timezone: params.timezone})

    if (result.isErr()) {
      return err(result.error)
    }

    return ok(result.value)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export type AppointmentCancelReason = 
  "LAST_MINUTE_CANCELLATION" |
  "PATIENT_CANCELLED" |
  "PATIENT_NO_SHOW" |
  "PATIENT_NOT_COVERED_BY_INSURANCE" |
  "PATIENT_RESCHEDULED" |
  "PROVIDER_UNAVAILABLE" |
  "SCHEDULING_ERROR" |
  "CANCEL_FUTURE_VISIT_OF_PATIENT_WHO_NO_SHOWED" |
  "RD_MISSED_VISIT_STRIKE" |
  "RD_MISSED_VISIT_NO_FAULT"

type AppointmentCancelReasonId = number

/**
 * Appointment cancellation reasons. This in fact is a mapping from symbolic
 * string contants to the actual 'cancel reason IDs' used by Athena.
 * 
 * The symbolic name / key is derived from the athena name. IE:
 * 
 *  LAST MINUTE CANCELLATION -> LAST_MINUTE_CANCELLATION
 */
type AppointmentCancelReasons = Partial<Record<string, AppointmentCancelReasonId>>

export async function getAppointmentCancelReasons(context: IContext, params?: { role: string }): Promise<Result<AppointmentCancelReasons, ErrCode>> {
  const { logger } = context
  const TAG = [ ...MTAG, 'appointment.service.getAppointmentCancelReasons' ]

  try {
    const result = await Appointment.Store.selectCancelReasons(context, params)

    if (result.isErr()) {
      logger.error(context, TAG, 'Error fetching appointment cancel reasons.', {
        error: result.error
      })
      return err(result.error)
    }

    logger.debug(context, TAG, `api result`, {
      result: result.value
    })

    const reasons: AppointmentCancelReasons = {}

    for (let reason of result.value) {
      const nameKey = reason.name.replace(/ /g, '_').replace(/-/g, '_');

      reasons[nameKey] = reason.appointmentCancelReasonId
    }

    return ok(reasons)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export interface CancelAppointmentOptions {
  patientId?: number;
  cancelReason: AppointmentCancelReason;
  eventSource?: 'swap' | 'reschedule';
  canceledBy: 'provider' | 'patient' | 'coordinator' | 'supervisor';
  identity?: IdentityRecord;
  cancelReasonId?: number;
}

async function performCancelAppointment(context: IContext, options: CancelAppointmentOptions, appointmentId: number, dbTxn: DbTransaction): Promise<Result<BaseAppointmentRecord, ErrCode>> {
  const { logger } = context
  const TAG = [ ...MTAG, 'appointment.service.performCancelAppointment' ]

  const { patientId, cancelReasonId } = options;

  if(!patientId || !cancelReasonId) {
    logger.error(context, TAG, 'Missing info in CancelAppointmentOptions', {
      options
    })
    return err(ErrCode.SERVICE);
  }

  const cancelResult = await Appointment.Store.cancelAppointment(context, {
    appointmentId,
    patientId,
    cancelReasonId,
    cancelledBy: options.identity
  }, dbTxn)
  
  if (cancelResult.isErr()) {
    logger.error(context, TAG, 'Error cancelling appointment.', {
      appointmentId,
      patientId,
      cancelReasonId,
      errCode: cancelResult.error,
    })
    return err(cancelResult.error)
  }

  const voidPaymentResult = await voidPaymentTransactionsByAppointmentId(context, appointmentId, dbTxn);
  if (voidPaymentResult.isErr()) {
    logger.error(context, TAG, 'error voiding payment transactions during cancel appointment');
    return err(ErrCode.SERVICE)
  }
  logger.debug(context, TAG, 'voided payment transactions during cancel appointment');

  if (cancelReasonId === 9) {
    const createNoShowLeadResult = await CallCenter.Store.insertNoShowLead(context, appointmentId, dbTxn);
    if (createNoShowLeadResult.isErr()) {
      // on error, just log, don't fail the call
      logger.error(context, TAG, 'Error creating call center no show lead on cancel appointment');
    }
  }

  return ok(cancelResult.value);
}

async function runCancelAppointmentChecks(context: IContext, options: CancelAppointmentOptions, appointment: AppointmentRecord): Promise<Result<{cancelReasonId: number, patientId: number}, ErrCode>> {
  const { logger } = context
  const TAG = [ ...MTAG, 'appointment.service.runCancelAppointmentChecks' ]

  let { cancelReason } = options;
  const { canceledBy } = options;
  let patientId = options.patientId;
  const appointmentId = appointment.appointmentId;

  const appointmentStart = DateTime.fromJSDate(appointment.startTimestamp)

  if (canceledBy === 'patient') {
    const hoursUntilAppt = appointmentStart.diffNow().as('hours')
    if (hoursUntilAppt < 0) {
      logger.error(context, TAG, 'Patient cannot cancel an appointment with start time in the past', { appointment })
      return err(ErrCode.INVALID_DATA)
    } else if (hoursUntilAppt < 4) {
      cancelReason = 'LAST_MINUTE_CANCELLATION'
    }
  }

  if (cancelReason === 'PATIENT_NO_SHOW' && DateTime.now() < appointmentStart) {
    logger.error(context, TAG, 'Cannot cancel as no show if appointment is in the future', { appointment })
    return err(ErrCode.INVALID_DATA)
  }

  if (patientId === undefined) {
    logger.debug(context, TAG, 'appointment retrieved.', {
      appointment_id: appointmentId,
      appointment,
    })

    patientId = appointment.patientId

    if (patientId === undefined) {
      logger.error(context, TAG, 'Appointment does not have corresponding patient.', {
        appointment: appointment
      })

      return err(ErrCode.SERVICE)
    }
  }

  const role = canceledBy
  const cancelReasonsResult = await getAppointmentCancelReasons(context, { role })

  if (cancelReasonsResult.isErr()) {
    logger.error(context, TAG, 'Error getting cancelation result.', {
      error: cancelReasonsResult.error
    })

    return err(ErrCode.SERVICE)
  }

  const cancelReasonId = cancelReasonsResult.value[cancelReason]

  if (!cancelReasonId) {
    logger.error(context, TAG, 'Invalid cancel reason', {
      cancelReason,
      role
    })
    return err(ErrCode.ARGUMENT_ERROR)
  }

  return ok({cancelReasonId, patientId});
}


/**
 * Cancel an appointment for a patient. If no cancelReasonId is provided, the default reason is used.
 * 
 * @param context 
 * @param appointmentId 
 * @param {CancelAppointmentOptions} options CancelAppointmentOptions - cancellation options.
 * @param {number}                   options.patientId When provided, appointment must be associated with patient.
 *                                                     Provides extra safety. IE: in the case where patient is logged in
 *                                                     which limits ability to cancel their own appointments.
 * @param {AppointmentCancelReason}  options.cancelReason When provided, cancels appointment using the provided reason.
 *                                                        Otherwise, appointment's cancel reason is the practices default.
 * 
 * @returns Promise<Result<boolean, ErrCode>> True upon success, otherwise an ErrCode.
 */
export async function cancelAppointment(context: IContext, appointmentId: number, options: CancelAppointmentOptions): Promise<Result<true, ErrCode>> {
  const { logger, store: { writer } } = context
  const TAG = [ ...MTAG, 'appointment.service.cancelAppointment' ]

  try {

    //
    // Fetch appointment in order to get associated patient. Otherwise, patient is
    // taken as passed in and hence Athena will validate the patient is associated
    // with the appointment.
    //
    const getApptResult = await getAppointment(context, { appointmentId, })

    if (getApptResult.isErr()) {
      logger.error(context, TAG, 'Error getting appointment.', {
        error: getApptResult.error,
      })

      return err(ErrCode.SERVICE)
    }

    const appointment = getApptResult.value

    const cancelAppointmentChecks = await runCancelAppointmentChecks(context, options, appointment);
    if(cancelAppointmentChecks.isErr()) {
      logger.error(context, TAG, 'Error running checks for cancelAppointment.', {
        error: cancelAppointmentChecks.error,
      })

      return err(cancelAppointmentChecks.error)
    }
    const {cancelReasonId, patientId} = cancelAppointmentChecks.value;
    options.patientId = patientId;
    options.cancelReasonId = cancelReasonId;

    const wpool = await writer();

    const canceledAppointment = await db.serializable(wpool, async (dbTxn) => {  
      const performResult = await performCancelAppointment(context, options, appointment.appointmentId, dbTxn);
      if(performResult.isErr()) {
        throw performResult.error;
      }
      return performResult.value;
    });
    
    const parallelTasks: Promise<void | Result<void, ErrCode>>[] = [];
    const meeting = appointment.meeting;
    if (meeting?.schemaType === 'zoom_dynamic') {
      parallelTasks.push(
        Zoom.deleteMeeting(context, meeting.id.toString())
          .then(result => {
            if (result.isErr()) {
              logger.info(context, TAG, 'Error deleting Zoom meeting for cancelled appointment.', {
                appointment,
                meetingId: meeting.id,
              });
            } else {
              logger.info(context, TAG, 'Sucessfully deleted Zoom meeting for cancelled appointment.', {
                appointment,
                meetingId: meeting.id,
              });
            }
          })
          .catch(err => {
            logger.error(context, TAG, 'Unexpected error deleting Zoom meeting', err);
          })
      );
    }

    parallelTasks.push(
      sendAppointmentUpdateEvent(context, canceledAppointment, true, {
        eventSource: options.eventSource,
        canceledBy: options.canceledBy,
        cancelReasonId
      }).catch(err => {
        logger.error(context, TAG, 'Error sending appointment update event', err);
      })
    );

    await Promise.allSettled(parallelTasks);

    return ok(true)
  } catch (e) {
    logger.exception(context, 'appointment.service.cancelAppointment', e)
    return err(ErrCode.EXCEPTION)
  }
}

type CancelError = { appointmentId: number, error: string }
export async function bulkCancelAppointments(context: IContext, appointmentIds: number[], options: CancelAppointmentOptions): Promise<Result<CancelError[], ErrCode>> {
  const results = await promiseMap<true, CancelError>(appointmentIds.map(appointmentId => (async () => {
    const timer = new Promise(r => setTimeout(r, 1000))
    const res = await cancelAppointment(context, appointmentId, options)
    await timer

    if (res.isErr()) {
      return err({ appointmentId, error: getErrorCodeMessage(context, res.error) })
    }
    return ok(true)
  })), { concurrency: 40 })

  const errors: CancelError[] = []
  for (const res of results) {
    if (res.isErr()) {
      errors.push(res.error)
    }
  }
  return ok(errors)
}

type GetAppointmentTypesOptions = {
  ids?: number[]
}

export async function getAppointmentTypes(context: IContext, options: GetAppointmentTypesOptions): Promise<Result<zs.telenutrition.schedule_appointment_type.JSONSelectable[] ,ErrCode>> {
  const { logger, store: { reader } } = context
  const TAG = [ ...MTAG, 'appointment.service.getAppointmentTypes' ]

  try {
    const pool = await reader();
    const appointmentTypes = await db.select('telenutrition.schedule_appointment_type', {
      visible: true,
      ...(options.ids && {appointment_type_id: db.conditions.isIn(options.ids) }),
    }).run(pool);

    return ok(appointmentTypes);
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

interface GetAppointmentDurationsForPaymentParams {
  paymentMethod?: PaymentMethodRecord;
  isFollowUp: boolean;
}

export function getAppointmentDurationsForPayment(context: IContext, parameters: GetAppointmentDurationsForPaymentParams): number[] {
  const { paymentMethod, isFollowUp } = parameters;

  if (!isFollowUp || !paymentMethod) return [60]

  return paymentMethod.type.followUpDurations
}

interface GetAppointmentTypeIdParameters {
  isFollowUp: boolean;
  audioOnly?: boolean;
  appointmentIds: number[];
}

// Take in flow state and based on duration of appointment, payment info, is follow up, and audio only... generate correct appointment type id
export function getAppointmentTypeId(
  context: IContext,
  parameters: GetAppointmentTypeIdParameters
): Result<AppointmentTypeId, ErrCode> {
  const { logger } = context
  const TAG = [ ...MTAG, 'getAppointmentTypeId' ]
  
  try {
    const { isFollowUp, audioOnly, appointmentIds } = parameters
    const duration = appointmentIds.length === 1 ? 30 : 60

    let appointmentTypeId: AppointmentTypeId | undefined
    if (!isFollowUp) {
      if (duration === 30) appointmentTypeId = AppointmentTypeId.Initial30Minutes
      else if (duration === 60)appointmentTypeId = AppointmentTypeId.Initial60Minutes
    } else { 
      if (duration === 30) appointmentTypeId = AppointmentTypeId.FollowUp30Minutes
      else if (duration === 60) appointmentTypeId = AppointmentTypeId.FollowUp60Minutes
    }

    if (!appointmentTypeId) {
      logger.error(context, TAG, 'could not determine appointmentTypeId from duration and follow up info')
      return err(ErrCode.SERVICE)
    }
    const mappedAppointmentType = (!!audioOnly && audioAppointmentTypeIds[appointmentTypeId]) || appointmentTypeId
  
    return ok(mappedAppointmentType)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

interface GetSwappableProvidersForAppointmentParams {
  appointmentId: number;
  onlyW2?: boolean;
}

type SwappableProvider = {
  provider: ProviderRecord;
  appointmentIds: number[];
}

export type SwappableProvidersForAppointment = {
  recommendedSwap?: SwappableProvider;
  allSwappable: SwappableProvider[];
}

export async function getSwappableProvidersForAppointment(
  context: IContext,
  params: GetSwappableProvidersForAppointmentParams
): Promise<Result<SwappableProvidersForAppointment, ErrCode>> {
  const { logger } = context

  const TAG = [...MTAG, 'getSwappableProvidersForAppointment']

  const appointmentResult = await Store.selectOneAppointment(context, { appointmentId: params.appointmentId })

  if (appointmentResult.isErr()) {
    return err(ErrCode.NOT_FOUND)
  }

  const appointment = appointmentResult.value

  const schedulingParamsResult = await buildSchedulingParams(context, {
    rescheduleForAppointment: appointment,
    onlyW2: params.onlyW2,
  })

  if (schedulingParamsResult.isErr()) {
    logger.error(context, TAG, "Error building scheduling params", { error: schedulingParamsResult.error })
    return err(schedulingParamsResult.error)
  }

  const slotsResult = await fetchAvailableProviderSlotsForBooking(context, {
    schedulingParams: schedulingParamsResult.value,
    startTimestamp: appointment.startTimestamp,
    duration: appointment.duration,
    patientId: appointment.patientId,
    ignoreDateRestrictions: true
  })
  if (slotsResult.isErr()) {
    logger.error(context, TAG, "Error fetching bookable time slots", { error: slotsResult.error })
    return err(slotsResult.error)
  }
  const allSwappable = slotsResult.value
  const recommendedSwap = _.sample(allSwappable)

  return ok({
    allSwappable,
    recommendedSwap
  })
}

interface RescheduleAppointmentParams {
  cid: string;
  identity: IdentityRecord;
  oldAppointmentId: number;
  newAppointmentIds: number[];
  cancelReason: AppointmentCancelReason;
  canceledBy: 'patient' | 'provider';
}

export async function rescheduleAppointment(
  context: IContext,
  params: RescheduleAppointmentParams
): Promise<Result<BaseAppointmentRecord, ErrCode>> {
  const { logger } = context

  const TAG = [...MTAG, 'service.rescheduleAppointment']

  const { oldAppointmentId, newAppointmentIds } = params
  const [oldAppointmentResult, newAppointmentResult] = await Promise.all([
    Appointment.Service.getAppointment(context, { appointmentId: oldAppointmentId }),
    Appointment.Service.getAppointment(context, { appointmentId: newAppointmentIds[0] })
  ])

  if (oldAppointmentResult.isErr() || newAppointmentResult.isErr()) {
    logger.error(context, TAG, "Error getting appointment for reschedule")
    return err(ErrCode.EXCEPTION)
  }

  const oldAppointment = oldAppointmentResult.value
  const newAppointment = newAppointmentResult.value

  if (!oldAppointment.patientId) {
    logger.error(context, TAG, 'trying to reschedule appointment with no patientId', { appointmentId: oldAppointment.appointmentId });
    return err(ErrCode.STATE_VIOLATION)
  }

  const paymentMethodResult = await getDefaultPaymentMethod(context, {
    patientId: oldAppointment.patientId,
    appointment: newAppointment,
    preferredPaymentMethodId: oldAppointment.paymentMethodId,
    rescheduleAppointmentId: oldAppointment.appointmentId,
  })
  if (paymentMethodResult.isErr()) {
    if (paymentMethodResult.error === ErrCode.NOT_FOUND) {
      logger.debug(context, TAG, 'no valid payment method found for reschedule', { appointmentId: newAppointment.appointmentId });
      return err(ErrCode.INVALID_PAYMENT)
    }
    logger.error(context, TAG, 'error fetching default payment method for reschedule', { err: paymentMethodResult.error, appointmentId: newAppointment.appointmentId });
    return err(paymentMethodResult.error)
  }
  const paymentMethodId = paymentMethodResult.value.id
  const eventSource = params.cancelReason === 'PROVIDER_UNAVAILABLE' ? 'swap' : 'reschedule'

  const bookAppointmentResult = await bookAppointment(context, {
    cid: params.cid,
    appointment: {
      appointmentIds: params.newAppointmentIds,
      appointmentTypeId: oldAppointment.appointmentTypeId,
    },
    cancelAppointment: {
      appointmentRecord: oldAppointment,
      canceledBy: params.canceledBy,
      cancelReason: params.cancelReason,
    }, 
    identity: params.identity,
    patientId: oldAppointment.patientId,
    paymentMethodId,
    eventSource
  })

  if (bookAppointmentResult.isErr()) {
    logger.error(context, TAG, "error booking appointment for reschedule")
    return err(bookAppointmentResult.error)
  }

  return ok(bookAppointmentResult.value)
}

interface GetMinHoursInFutureForBookingProps {
  paymentMethod: PaymentMethodRecord;
}

function getMinHoursInFutureForBooking({ paymentMethod }: GetMinHoursInFutureForBookingProps): number {
  const isValid = paymentMethod.status === 'valid'
  const isCigna = paymentMethod.type.insuranceId === InsuranceId.Cigna

  // Default 5 day minimum
  const minHoursInFuture = (isCigna && !isValid) ? 24*5 : 1

  return minHoursInFuture
}

interface MergeAppointmentSlotsByDurationParams {
  segments: AppointmentStoreRecord[][];
  timezone: string;
  validDurationsType: ValidAppointmentSlotDuration;
}

export function mergeAppointmentSlotsByDuration(context: IContext, {segments, timezone, validDurationsType}: MergeAppointmentSlotsByDurationParams): Result<AppointmentSlotRecord[], ErrCode> {
  const { logger } = context

  const TAG = [...MTAG, 'mergeAppointmentSlotsByDuration']

  try {
    const appointmentSlots: AppointmentSlotRecord[] = []
    for (let segment of segments) {
      for (let i = 0; i < segment.length; i++) {
        const appointment = segment[i]

        const startDateTime = DateTime.fromISO(appointment.start_timestamp, { zone: timezone })
        if (!startDateTime.isValid) {
          logger.error(context, TAG, "Invalid startTimestamp for appointment", {appointment})
          continue
        }
        const baseAppointmentSlot = {
          providerId: appointment.provider_id,
          startTimestamp: startDateTime
        }

        // all slots are valid if 30-minutes only
        if (validDurationsType === '30-only') {
          appointmentSlots.push({
            ...baseAppointmentSlot,
            providerId: baseAppointmentSlot.providerId ?? undefined,
            appointmentIds: [appointment.appointment_id],
            duration: appointment.duration,
          })
          continue;
        }

        const nextAppt = i + 1 < segment.length ? segment[i + 1] : null
        const isTopOfHour = startDateTime.minute === 0
        const isMidHour = startDateTime.minute === 30

        // only top of the hour slots are
        if (validDurationsType === '60-only' && isTopOfHour && nextAppt) {
          appointmentSlots.push({
            ...baseAppointmentSlot,
            providerId: baseAppointmentSlot.providerId ?? undefined,
            appointmentIds: [appointment.appointment_id, nextAppt.appointment_id],
            duration: 60,
          })

          continue;
        }

        if (validDurationsType === '30-or-60') {
          if (isTopOfHour) {
            if (nextAppt) {
              appointmentSlots.push({
                ...baseAppointmentSlot,
                providerId: baseAppointmentSlot.providerId ?? undefined,
                appointmentIds: [appointment.appointment_id, nextAppt.appointment_id],
                duration: 60,
              })
            } else {
              appointmentSlots.push({
                ...baseAppointmentSlot,
                providerId: baseAppointmentSlot.providerId ?? undefined,
                appointmentIds: [appointment.appointment_id],
                duration: 30,
              })
            }
          } else if (isMidHour) {
            const hasPriorAppt = i > 0 ? segment[i - 1] : null
            // Skip if there exists a prior appointment at top of hour
            if (!hasPriorAppt) {
              appointmentSlots.push({
                ...baseAppointmentSlot,
                providerId: baseAppointmentSlot.providerId ?? undefined,
                appointmentIds: [appointment.appointment_id],
                duration: 30,
              })
            }
          }
        }
      }
    }

    return ok(appointmentSlots)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export function rollUpAppointmentSlotsIntoSegments({appointments}: { appointments: AppointmentStoreRecord[] }) {
  const segments: AppointmentStoreRecord[][] = []

  for (let appointment of appointments) {
    if (segments.length) {
      // get the last segment in the group
      const lastSegment = segments[segments.length - 1]
      const lastAppointment = lastSegment[lastSegment.length - 1]
      const diff = DateTime.fromISO(appointment.start_timestamp).diff(DateTime.fromISO(lastAppointment.start_timestamp)).as('minutes')

      if (diff === lastAppointment.duration) {
        lastSegment.push(appointment)
      } else {
        segments.push([appointment])
      }
    } else {
      segments.push([appointment])
    }
  }

  return segments
}

interface GetBookableTimeSlotsParams {
  patientId: number;
  paymentMethodId: number;
  timezone?: string;
  startTimestamp?: Date;
}

export async function getBookableTimeSlots(
  context: IContext,
  params: GetBookableTimeSlotsParams,
): Promise<Result<{ slots: AppointmentSlotRecord[], timezone: string }, ErrCode>> {
  const { logger } = context;

  const { patientId, paymentMethodId } = params

  const TAG = [...MTAG, 'getBookableTimeSlots'];
  const schedulingParamsResult = await buildSchedulingParams(context, {
    patientId,
    paymentMethodId
  });

  if (schedulingParamsResult.isErr()) {
    logger.error(context, TAG, 'error building scheduling params', { error: schedulingParamsResult.error });
    return err(ErrCode.SERVICE);
  }

  const schedulingParams = schedulingParamsResult.value
  const timezone = params.timezone ?? schedulingParams.patient.timezone
  const slotsResult = await fetchBookableTimeSlots(context, {
    schedulingParams,
    timezone,
  });

  if (slotsResult.isErr()) {
    logger.error(context, TAG, 'error fetching bookable time slots', { error: slotsResult.error });
    return err(slotsResult.error)
  }

  return ok({
    slots: slotsResult.value,
    timezone
  })
}

export async function fetchBookableTimeSlots(
  context: IContext,
  params: {
    schedulingParams: SchedulingParams;
    timezone?: string;
    startTimestamp?: Date;
    duration?: number;
    overbookingBuffer?: boolean;
  },
): Promise<Result<AppointmentSlotRecord[], ErrCode>> {
  const {
    config,
    logger,
    store: { reader },
  } = context;

  const TAG = [...MTAG, 'fetchBookableTimeSlots'];

  const { schedulingParams, startTimestamp, timezone } = params;
  const { timestampQuery, providerIds, validAppointmentDurations } = schedulingParams;

  if (providerIds.length === 0) {
    return ok([]);
  }

  const duration = params.duration ?? validAppointmentDurations[0]
  if (!validAppointmentDurations.includes(duration)) {
    logger.warn(context, TAG, 'Invalid duration requested', { duration, validAppointmentDurations });
    return err(ErrCode.ARGUMENT_ERROR)
  }

  const startTimestampDT = startTimestamp ? DateTime.fromJSDate(startTimestamp) : undefined
  const startTimestampQuery = startTimestampDT ? db.sql`${db.self} IN (${db.vals([
    startTimestampDT.minus({ minutes: 30 }).toJSDate(),
    startTimestampDT.toJSDate(),
    startTimestampDT.plus({ minutes: 30 }).toJSDate()
  ])})` : undefined

  try {
    const pool = await reader();

    // Use an overbooking factor of 2 on dev/stage to make testing easier
    const baseOverbookingFactor = config.isProduction ? 1.3 : 2;
    const overbookingFactor = baseOverbookingFactor + (params.overbookingBuffer ? 0.1 : 0)

    const openSlotsQuery =
      duration == 60
        ? db.sql<zs.telenutrition.schedule_appointment.SQL>`
      SELECT
        date_trunc('hour', ${'start_timestamp'}) AS ${'start_timestamp'}
      FROM
        appts
      WHERE ${{ status: 'o' }}
      GROUP BY
        ${'provider_id'},
        1
      HAVING
        count(*) = 2
    `
        : db.sql`SELECT ${'start_timestamp'} FROM appts WHERE ${{ status: 'o' }}`;

    type SlotsSQL =
      | zs.telenutrition.schedule_appointment.SQL
      | 'open_count'
      | 'total_booked_count'
      | 'provider_booked_count';

    const bookedSlotsQueryInner = db.sql<SlotsSQL>`
      SELECT
        UNNEST(CASE WHEN(${'duration'} = 30) THEN ARRAY[${'start_timestamp'}] ELSE ARRAY[${'start_timestamp'}, ${'start_timestamp'} + '30 minute'::interval] end) AS ${'start_timestamp'},
        COUNT(*) AS ${'total_booked_count'},
        COUNT(*) FILTER (
          WHERE ${{ provider_id: db.conditions.isNotNull }}
        ) AS ${'provider_booked_count'}
      FROM appts
      WHERE ${{
        status: db.conditions.ne('o'),
      }}
      GROUP BY 1
    `;

    const bookedSlotsQuery =
      duration === 60
        ? db.sql<SlotsSQL>`
      SELECT date_trunc('hour', ${'start_timestamp'}) AS ${'start_timestamp'},
      MAX(${'total_booked_count'}) AS ${'total_booked_count'},
      MAX(${'provider_booked_count'}) AS ${'provider_booked_count'}
      FROM (${bookedSlotsQueryInner}) bs
      GROUP BY 1`
        : bookedSlotsQueryInner;

    const query = db.sql<SlotsSQL, Pick<zs.telenutrition.schedule_appointment.Selectable, 'start_timestamp'>[]>`
      WITH appts AS (
        SELECT *
        FROM ${'telenutrition.schedule_appointment'}
        WHERE ${{
          status: db.conditions.ne('x'),
          frozen: false,
          provider_id: db.conditions.or(db.conditions.isNull, db.conditions.isIn(providerIds)),
          start_timestamp: db.conditions.and(...(startTimestampQuery ? [startTimestampQuery] : []), timestampQuery),
        }}
      ),
      open_slots AS (
        SELECT
          ${'start_timestamp'},
          COUNT(*) AS ${'open_count'}
        FROM (${openSlotsQuery}) os
        GROUP BY 1
      ),
      booked_slots AS (${bookedSlotsQuery})
      SELECT ${'start_timestamp'}, ${'total_booked_count'}, ${'provider_booked_count'}
      FROM open_slots
      FULL OUTER JOIN booked_slots USING (${'start_timestamp'})
      WHERE (COALESCE(total_booked_count, 0) < FLOOR((COALESCE(open_count, 0) + COALESCE(provider_booked_count, 0)) * ${db.param(overbookingFactor, 'numeric')}))
      AND ${startTimestamp ? { start_timestamp: startTimestamp } : {}}
      ORDER BY ${'start_timestamp'} ASC
    `;

    const slots = await query.run(pool);
    const appointmentSlots: AppointmentSlotRecord[] = slots
      .map((slot) => {
        let startTimestamp = DateTime.fromJSDate(slot.start_timestamp);
        if (timezone) {
          startTimestamp = startTimestamp.setZone(timezone);
        }
        if (!startTimestamp.isValid) {
          logger.warn(context, TAG, 'Invalid starttime for slot', { startTimestamp: slot.start_timestamp });
          return null;
        }
        return {
          appointmentIds: Array(duration / 30).fill(-startTimestamp.toMillis()),
          startTimestamp,
          duration,
        };
      })
      .filter((slot) => slot !== null)
      .map((slot) => slot!);

    return ok(appointmentSlots);
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

export type SchedulingParams = {
  bookableRange: Interval<true>
  nonBookableDates: string[],
  nonBookableMonths: string[],
  providerIds: number[],
  validAppointmentDurations: number[],
  patient: PatientRecord,
  paymentMethod: PaymentMethodRecord,
  timestampQuery: db.SQLFragment<boolean | null, Date>
}

export async function buildSchedulingParams(
  context: IContext,
  params: ({
    patientId: number;
    paymentMethodId?: number;
  } | { 
    rescheduleForAppointment: AppointmentRecord;
  }) & {
    providerIds?: number[] // only search against these providerIds
    fromTime?: Date,
    toTime?: Date,
    onlyW2?: boolean,
    onlyActiveProviders?: boolean;
    noLeadTime?: boolean,
    timezone?: string
  }
): Promise<Result<SchedulingParams, ErrCode>> {
  const { logger } = context;

  const TAG = [...MTAG, 'buildSchedulingParams'];

  let patientId: number
  let rescheduleAppointmentId: number | undefined
  let patientQuery: Promise<Result<PatientRecord, ErrCode>>
  let paymentQuery: Promise<Result<PaymentMethodRecord, ErrCode>>
  let appointmentTypeQuery: Promise<Result<AppointmentType, ErrCode>>
  const timezone = params.timezone ?? 'US/Central'

  if ('rescheduleForAppointment' in params) {
    const appt = params.rescheduleForAppointment
    if (appt.patientId === undefined) {
      logger.error(context, TAG, "Patient required for rescheduling")
      return err(ErrCode.STATE_VIOLATION)
    }
    patientId = appt.patientId
    rescheduleAppointmentId = appt.appointmentId
    patientQuery = appt.patient
      ? Promise.resolve(ok(appt.patient))
      : Patient.Service.getPatientById(context, { patientId })
    appointmentTypeQuery = Promise.resolve(ok(appt.isFollowUp ? AppointmentType.FollowUp : AppointmentType.Initial))
    paymentQuery = Payment.Service.getDefaultPaymentMethod(context, {
      patientId: patientId,
      preferredPaymentMethodId: appt.paymentMethodId
    })
  } else {
    const { paymentMethodId } = params;
    patientId = params.patientId
    patientQuery = Patient.Service.getPatientById(context, { patientId })
    paymentQuery = paymentMethodId
      ? Payment.Service.getPatientPaymentMethod(context, { patientId, paymentMethodId })
      : Payment.Service.getDefaultPaymentMethod(context, { patientId })
    appointmentTypeQuery = Patient.Service.getNextAppointmentType(context, { patientId })
  }

  const nonBookableDatesQuery = Store.getNonBookableIsoDatesForPatient(context, {
    patientId,
    rescheduleAppointmentId,
    timezone,
  })

  const patientResult = await patientQuery
  if (patientResult.isErr()) {
    logger.error(context, TAG, 'could not fetch patient info', { error: patientResult.error });
    return err(patientResult.error);
  }
  const patient = patientResult.value;

  const paymentMethodResult = await paymentQuery
  if (paymentMethodResult.isErr()) {
    logger.error(context, TAG, 'could not fetch payment method for patient', { error: paymentMethodResult.error });
    return err(ErrCode.INVALID_PAYMENT);
  }
  const paymentMethod = paymentMethodResult.value;

  const nonBookableMonthsQuery = Store.getNonBookableMonthsForPatient(context, { patientId, rescheduleAppointmentId, paymentMethod, timezone })

  const providerIdsResult = await getDefaultProviderIdList(context, {
    patient,
    payment: paymentMethod.payment,
    onlyW2: params.onlyW2,
    onlyActiveProviders: params.onlyActiveProviders,
    providerIds: params.providerIds
  });

  if (providerIdsResult.isErr()) {
    logger.error(context, TAG, 'could not fetch schedulable provider id list', { error: providerIdsResult.error });
    return err(providerIdsResult.error);
  }

  const providerIds = providerIdsResult.value;

  const nonBookableDatesResult = await nonBookableDatesQuery
  if (nonBookableDatesResult.isErr()) {
    logger.error(context, TAG, 'could not fetch non bookable dates for patient', {
      error: nonBookableDatesResult.error,
    });
    return err(ErrCode.SERVICE);
  }

  const nonBookableDates = nonBookableDatesResult.value;

  const nonBookableMonthsResult = await nonBookableMonthsQuery
  if (nonBookableMonthsResult.isErr()) {
    logger.error(context, TAG, 'could not fetch non bookable months for patient', {
      error: nonBookableMonthsResult.error,
    });
    return err(ErrCode.SERVICE);
  }

  const nonBookableMonths = nonBookableMonthsResult.value

  const appointmentTypeResult = await appointmentTypeQuery
  if (appointmentTypeResult.isErr()) {
    logger.error(context, TAG, 'error getting next appointment type', { error: appointmentTypeResult.error });
    return err(appointmentTypeResult.error);
  }

  const isFollowUp = appointmentTypeResult.value === AppointmentType.FollowUp
  const validAppointmentDurations = Appointment.Service.getAppointmentDurationsForPayment(context, {
    paymentMethod,
    isFollowUp,
  });

  const now = DateTime.now();
  // self scheduling doesn't have a lead time
  const minHoursInFuture = params.noLeadTime ? -1 : getMinHoursInFutureForBooking({ paymentMethod });
  const defaultMin = now.plus({ hours: minHoursInFuture })
  const defaultMax = now.plus({ days: 90 })
  const min = params.fromTime ? DateTime.max(DateTime.fromJSDate(params.fromTime), defaultMin) : defaultMin
  const max = params.toTime ? DateTime.min(DateTime.fromJSDate(params.toTime), defaultMax) : defaultMax
  const bookableRange = Interval.fromDateTimes(min, max)
  if (!bookableRange.isValid) {
    logger.error(context, TAG, 'Invalid bookable range', { bookableRange });
    return err(ErrCode.SERVICE);
  }

  const timestampQuery: db.SQLFragment<boolean | null, Date> = db.conditions.and(
    ...(nonBookableDates?.length ? [
      db.sql`(${db.self} AT TIME ZONE ${db.param(timezone)})::date NOT IN (${db.vals(nonBookableDates)})`
    ]: []),
    ...(nonBookableMonths?.length ? [
      db.sql`DATE_TRUNC('month', ${db.self} AT TIME ZONE ${db.param(timezone)})::date NOT IN (${db.vals(nonBookableMonths)})`
    ] : []),
    db.conditions.between(
      bookableRange.start.toJSDate(),
      bookableRange.end.toJSDate()
    )
  )
  return ok({
    bookableRange,
    nonBookableDates,
    nonBookableMonths,
    providerIds,
    validAppointmentDurations,
    patient,
    paymentMethod,
    timestampQuery
  });
}

export default {
  createAppointmentReminder,
  getAppointment,
  getAppointmentDetails,
  getCancelledAppointmentIds,
  getAppointmentSlots,
  getProviderAppointmentSlots,
  getAppointmentTimezone,
  getUpcomingAppointments,
  getAppointmentCancelReasons,
  cancelAppointment,
  getAppointmentTypes,
  getAppointmentDurationsForPayment,
  getAppointmentTypeId,
  getUpcomingAppointmentsForPatient,
  getSwappableProvidersForAppointment,
  rescheduleAppointment,
  getDefaultProviderIdList,
  getBookableTimeSlots,
  bulkCancelAppointments,
  runCancelAppointmentChecks,
  performCancelAppointment,
}
