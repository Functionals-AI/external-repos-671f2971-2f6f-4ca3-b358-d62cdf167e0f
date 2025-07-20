import { IContext } from "@mono/common/lib/context";
import { ErrCode, getErrorCodeMessage } from "@mono/common/lib/error";
import { Result, err, ok } from "neverthrow";
import { IdentityRecord, ProviderIdRecord } from "../../iam/types";
import { bookAppointment } from "../service";
import * as db from "zapatos/db";
import * as zs from "zapatos/schema";
import Store, {
  mapProviderTask,
  mapProviderLicenseApplicationRecord,
  mapProviderLicenseRecord,
  ProviderLicenseApplicationRecord,
  ProviderLicenseRecord,
} from "./store";
import { ProviderRecord, ProviderSpecialty, ProviderTaskRecord, ProviderTimezone, GetProviderPastPatientsParams, ProviderOIdParams } from './shared';
import { Logger } from "@mono/common";
import { DateTime } from "luxon";
import { DepartmentId } from "../department/service";
import { PatientRecord as PatientRecord, mapPatientRecord } from "../patient/store";
import { AccountIds } from "@mono/common/lib/account/service";
import { InsuranceId } from "../insurance/service";
import { mapProviderRecord } from "./store";
import Payment from "../payment";
import Patient from "../patient";
import Insurance from "../insurance";

import { PaymentRecord, paymentIsInsurance } from "../scheduling-flow/types";
import Appointment from "../appointment";
import * as _ from "lodash";
import { isProviderIdentity } from "../../iam/identity/service";
import { Household, HouseholdMemberWithSchedulingInfo, ProviderMetricsDateRangeType, ProviderPerformanceMetricsAPIResult, ProviderPerformanceMetricsParams, ProviderScheduleForPatientDisallowReason } from "./types";
import { z } from "zod";
import { TaskPriority } from "./schema";
import { BaseAppointmentRecord } from "../appointment/types";
import { createMapAppointmentRecordFn } from "../appointment/store";
import { calculateComparisonDateRange, calculateDateRange, calculateMondayOfTheWeek } from "./date-util";


export const INSURANCE_ALLOWED_FOR_PENDING_LICENSE = InsuranceId.CountyCare;
export const ACCOUNTS_ALLOWED_FOR_PENDING_LICENSE = [AccountIds.AAH, AccountIds.AetnaMedicare];

const MTAG = Logger.tag();

type GetProviderOptions = Pick<ProviderRecord, 'npi' | 'oktaId'>

export async function getProvider(
  context: IContext,
  options: GetProviderOptions
): Promise<Result<ProviderRecord, ErrCode>> {
  const TAG = [...MTAG, "service.getProviderBy"];
  const { logger } = context;

  try {
    const providerRecord = await Store.fetchProviderBy(
      context,
      {
        where: {
          ...(options.npi && { npi: options.npi }),
          ...(options.oktaId && { okta_id: options.oktaId }),
        }
      }
    );

    if (providerRecord.isErr()) {
      return err(ErrCode.NOT_FOUND);
    }

    return ok(providerRecord.value);
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

// TODO: store pending licenses states the payer accepts in the payer table instead
export function isPendingProviderAllowed(params: {
  patient: PatientRecord
  payment: PaymentRecord
}): boolean {
  const { patient: { accountId, departmentId }, payment } = params
  const insuranceId = 'insurance_id' in payment ? payment.insurance_id : undefined;

  if (departmentId === DepartmentId.IL) {
    return insuranceId === INSURANCE_ALLOWED_FOR_PENDING_LICENSE ||
      (accountId != undefined && ACCOUNTS_ALLOWED_FOR_PENDING_LICENSE.includes(accountId));
  }
  return false
}

type CanProviderScheduleForPatientResult = {
  canSchedule: true
} | {
  canSchedule: false;
  errors: ProviderScheduleForPatientDisallowReason[]
}

export async function canProviderScheduleForPatient(
  context: IContext,
  parameters: {
    provider: ProviderRecord,
    patient: PatientRecord,
    payment: PaymentRecord
  }
): Promise<Result<CanProviderScheduleForPatientResult, ErrCode>> {
  const { logger, i18n } = context
  const TAG = [...MTAG, "service.canProviderScheduleForPatient"]

  const { provider, payment, patient: { patientId, departmentId, birthday } } = parameters

  try {
    const errorOrDisallowSchedulingReasons: ProviderScheduleForPatientDisallowReason[] = []

    if (provider.credentialingCommitteeStatus !== 'approved') {
      logger.debug(context, TAG, "Provider not approved by committee", { providerId: provider.providerId })
      errorOrDisallowSchedulingReasons.push({
        type: 'disallowed',
        reasonShort: i18n.__('Committee approval needed'),
        reasonFull: i18n.__('Provider has not been approved by the Credentialing Committee.')
      })
    }

    if (birthday) {
      const patientAge = Math.floor(-DateTime.fromISO(birthday).diffNow('years').as('years'))
      if (patientAge < provider.minPatientAge) {
        errorOrDisallowSchedulingReasons.push({
          type: 'disallowed',
          reasonShort: i18n.__('Pediatric patient'),
          reasonFull: i18n.__(`Patient does not meet the minimum age preference for provider.`)
        })
      }
    }

    if (payment.method === 'plan') {
      const insuranceId = payment.insurance_id;

      const validateProviderForInsuranceResult = await Insurance.Service.validateProviderForInsurance(context, { 
        insuranceId,
        providerId: provider.providerId,
      })
      if (validateProviderForInsuranceResult.isErr()) {
        logger.error(context, TAG, "Error validating provider for insurance", { patientId, insuranceId })
        errorOrDisallowSchedulingReasons.push({
          type: 'error',
          code: getErrorCodeMessage(context,ErrCode.SERVICE),
          message: i18n.__('Error validating provider for insurance')
        })
      } else {
        const isProviderValidForInsurance = validateProviderForInsuranceResult.value;
        if (isProviderValidForInsurance === false) {
          errorOrDisallowSchedulingReasons.push({
            type: 'disallowed',
            reasonShort: i18n.__('Unenrolled provider'),
            reasonFull: i18n.__(`Provider has not been enrolled with this member's health plan.`)
          })
        }
      }
    }

    const allowPending = isPendingProviderAllowed({ patient: parameters.patient, payment })
    const isLicensedResult = await isProviderLicensedInDepartment(context, {
      providerId: provider.providerId,
      departmentId,
      allowPending
    })
    if (isLicensedResult.isErr()) {
      if (isLicensedResult.error === ErrCode.AUTHENTICATION) {
        errorOrDisallowSchedulingReasons.push({
          type: 'disallowed',
          reasonShort: i18n.__('Missing license'),
          reasonFull: i18n.__(`Provider is not licensed in this member's state.`)
        })
      } else {
        logger.error(context, TAG, "Error checking if provider is licensed for department", { patientId, departmentId })
        errorOrDisallowSchedulingReasons.push({
          type: 'error',
          code: getErrorCodeMessage(context, isLicensedResult.error),
          message: i18n.__('Error checking if provider is licensed for department')
        })
      }
    }

    if (errorOrDisallowSchedulingReasons.length > 0) {
      return ok({ canSchedule: false, errors: errorOrDisallowSchedulingReasons })
    }

    return ok({ canSchedule: true })
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)

  }
}

interface IsProviderLicensedInDepartmentOptions {
  providerId: number;
  departmentId: number;
  allowPending: boolean;
}

export async function isProviderLicensedInDepartment(
  context: IContext,
  options: IsProviderLicensedInDepartmentOptions
): Promise<Result<true, ErrCode>> {
  const TAG = [...MTAG, "service.isProviderLicensedInDepartment"];
  const {
    logger,
    store: { reader },
  } = context;

  try {
    const pool = await reader();
    const schedulableTypes = options.allowPending ? ['all', 'pending'] : ['all']
    const providerDeparmentResult = await db
      .select("telenutrition.schedule_department_provider_licensed", {
        provider_id: options.providerId,
        department_id: options.departmentId,
        schedulable_type: db.conditions.isIn(schedulableTypes)
      })
      .run(pool);

    if (providerDeparmentResult.length === 0) {
      logger.debug(
        context,
        TAG,
        "provider does not have access to this department",
        { options }
      );
      return err(ErrCode.AUTHENTICATION);
    }

    return ok(true);
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

export interface ProviderScheduleAppointmentOptions {
  cid: string;
  identity: ProviderIdRecord;
  patientId: number;
  appointment: {
    appointmentIds: number[];
    appointmentTypeId: number;
  };
}

export async function providerBookAppointment(
  context: IContext,
  options: ProviderScheduleAppointmentOptions
): Promise<Result<BaseAppointmentRecord, ErrCode>> {
  const TAG = [...MTAG, "service.providerBookAppointment"];
  const {
    logger,
  } = context;

  try {
    const appointmentResult = await Appointment.Service.getAppointment(context, { appointmentId: options.appointment.appointmentIds[0] })
    if (appointmentResult.isErr()) {
      logger.error(context, TAG, "error getting appointment for booking")
      return err(appointmentResult.error)
    }
    const paymentResult = await Payment.Service.getDefaultPaymentMethod(context, {
      patientId: options.patientId,
      appointment: appointmentResult.value
    });
    if (paymentResult.isErr()) {
      logger.error(context, TAG, "Patient must have a default payment method for provider to book on their behalf", {
        patientId: options.patientId,
        error: paymentResult.error,
      });
      if (paymentResult.error === ErrCode.PAYMENT_LIMIT_REACHED) {
        return err(ErrCode.PAYMENT_LIMIT_REACHED)
      }
      return err(ErrCode.INVALID_PAYMENT);
    }

    const paymentMethod = paymentResult.value

    const bookedResult = await bookAppointment(context, {
      cid: options.cid,
      identity: options.identity,
      patientId: options.patientId,
      appointment: options.appointment,
      paymentMethodId: paymentMethod.id
    });

    if (bookedResult.isErr()) {
      logger.error(context, TAG, 'error booking appointment', { errors: bookedResult.error })
      return err(bookedResult.error);
    }

    return ok(bookedResult.value);
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

interface ProviderScheduleBulkAppointmentsParams {
  cid: string;
  identity: ProviderIdRecord;
  patientId: number;
  appointments: {
    appointmentIds: number[];
    appointmentTypeId: number;
  }[];
}

interface ProviderScheduleBulkAppointmentsReturn {
  successes: BaseAppointmentRecord[];
  errors: {
    error: ErrCode;
    appointment: {
      appointmentIds: number[];
      appointmentTypeId: number;
    }
  }[];
}

export async function providerBookBulkAppointments(
  context: IContext,
  params: ProviderScheduleBulkAppointmentsParams
): Promise<Result<ProviderScheduleBulkAppointmentsReturn, ErrCode>> {
  const { logger } = context
  const TAG = [...MTAG, 'providerBookBulkAppointments']

  try {
    const results = await Promise.all(params.appointments.map(async appointment => {
      return {
        req: await providerBookAppointment(context, {
          cid: params.cid,
          identity: params.identity,
          patientId: params.patientId,
          appointment: {
            appointmentIds: appointment.appointmentIds,
            appointmentTypeId: appointment.appointmentTypeId,
          },
        }),
        data: appointment,
      }
    }))

    const [successes, errors] = results.reduce((acc, result) => {
      const [successes, errors] = acc;
      if (result.req.isErr()) {
        return [successes, [...errors, {
          error: result.req.error,
          errorMessage: getErrorCodeMessage(context, result.req.error),
          appointment: result.data
        }]]
      }
      return [[...successes, result.req.value], errors]
    }, [[],[]] as [ProviderScheduleBulkAppointmentsReturn['successes'], ProviderScheduleBulkAppointmentsReturn['errors']])

    return ok({ successes, errors })
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

interface GetProviderByNameParams {
  firstName: string;
  lastName: string;
}

export async function getProviderByName(
  context: IContext,
  params: GetProviderByNameParams
): Promise<Result<ProviderRecord, ErrCode>> {
  const TAG = [...MTAG, "service.getProviderByName"];
  const { logger } = context;

  try {
    const providerResult = await Store.fetchProviderByName(
      context,
      params,
    );

    if (providerResult.isErr()) {
      logger.error(context, TAG, "could not fetch provider by name", {
        errors: providerResult.error,
      });
      return err(ErrCode.NOT_FOUND);
    }

    return ok(providerResult.value);
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

interface UpdateProviderOktaId {
  providerId: number;
  oktaId: string;
}

export async function updateProviderOktaId(
  context: IContext,
  options: UpdateProviderOktaId
): Promise<Result<boolean, ErrCode>> {
  const TAG = [...MTAG, "service.updateProviderOktaId"];
  const { logger } = context;

  try {
    const updateResult = await Store.updateProviderOktaId(
      context,
      options.providerId,
      options.oktaId
    );

    if (updateResult.isErr()) {
      logger.error(context, TAG, "could not update provider oktaId", {
        errors: updateResult.error,
      });
      return err(ErrCode.NOT_FOUND);
    }

    return ok(updateResult.value);
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

export interface UpdateProviderOptions {
  providerId: number,
  oktaId?: string,
  email?: string,
  timezone?: ProviderTimezone,
  minPatientAge?: number,
  languages?: string[],
  specialtyIds?: ProviderSpecialty[],
  bio?: string,
}

export async function updateProvider(
  context: IContext,
  options: UpdateProviderOptions,
): Promise<Result<boolean, ErrCode>> {
  const TAG = [...MTAG, "service.updateProvider"];
  const { logger } = context;

  try {
    const updates = {
      ...(options.oktaId !== undefined && { okta_id: options.oktaId }),
      ...(options.email !== undefined && { email: options.email }),
      ...(options.specialtyIds !== undefined && { specialty_ids: options.specialtyIds }),
      ...(options.minPatientAge !== undefined && { min_patient_age: options.minPatientAge }),
      ...(options.timezone !== undefined  && { timezone: options.timezone }),
      ...(options.languages !== undefined && { languages: options.languages }),
      ...(options.bio !== undefined && { bio: options.bio })
    }

    const updateResult = await Store.updateProvider(
      context,
      options.providerId,
      updates
    );

    if (updateResult.isErr()) {
      logger.error(context, TAG, "could not update provider", {
        errors: updateResult.error,
      });
      return err(ErrCode.NOT_FOUND);
    }

    return ok(updateResult.value);
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }

}

type GetProviderTimezoneOptions = {
  oktaId: string;
} | {
  providerId: number;
}

type GetProviderTimezoneReturn = {
  timezone: string;
}

export async function getProviderTimezone(context: IContext, options: GetProviderTimezoneOptions): Promise<Result<GetProviderTimezoneReturn, ErrCode>> {
  const TAG = [...MTAG, "service.getProviderTimezone"];
  const { logger, store: { reader } } = context;

  try {
    const pool = await reader();

    let provider: ProviderRecord;
    if ('oktaId' in options) {

      const oktaId = options.oktaId;
      
      const providerResult = await getProvider(context, { oktaId })
      
      if (providerResult.isErr()) {
        return err(ErrCode.NOT_FOUND)
      }
      
      provider = providerResult.value;
    } else {
      const providerId = options.providerId;
      const providerResult = await getProviderByProviderId(context, { providerId })

      if (providerResult.isErr()) {
        return err(ErrCode.NOT_FOUND)
      }

      provider = providerResult.value;
    }

    if (provider.timezone)
      return ok({ timezone: provider.timezone });

    const departments = await db.select('telenutrition.schedule_department_provider', {
      provider_id: provider.providerId
    }).run(pool)

    if (departments.length === 0) {
      logger.error(context, TAG, 'provider has no departments')
      return err(ErrCode.PROVIDER_NO_DEPARTMENT)
    }

    const firstProviderDepartment = departments[0];

    const department = await db.selectExactlyOne('telenutrition.schedule_department', {
      department_id: firstProviderDepartment.department_id
    }).run(pool);

    return ok({ timezone: department.timezone });
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

type GetProviderBookableSlotsOptions = {
  identity: ProviderIdRecord;
  date: string;
}

// Chooses first found department for departmentId AND timezone.
type GetProviderBookableSlotsReturn = {
  slots: BookableSlot[];
  departmentId: number;
  timezone: string;
}

type BookableSlot = {
  duration: 30 | 60;
  available: boolean;
  // If available === true and also an appointment is scheduled for this slot
  booked: boolean;
  displayTime: string;
  startTime: string;
  time: Date;
}

// Make list of slots from 6AM - 9PM in the timezone given. Fill in currently available slots slots
export async function getProviderBookableSlotsForDay(
  context: IContext,
  options: GetProviderBookableSlotsOptions
): Promise<Result<GetProviderBookableSlotsReturn, ErrCode>> {
  const TAG = [...MTAG, "service.getProviderBookableSlotsForDay"];
  const { logger, store: { reader } } = context;

  try {
    const pool = await reader();
    const providerOId = options.identity.fid;

    const providerResult = await getProvider(context, { oktaId: providerOId })

    if (providerResult.isErr()) {
      logger.error(context, TAG, 'could not find provider')
      return err(ErrCode.NOT_FOUND)
    }
    
    const provider = providerResult.value;

    const departments = await db.select('telenutrition.schedule_department_provider', {
      provider_id: provider.providerId
    }).run(pool)

    if (departments.length === 0) {
      logger.error(context, TAG, 'provider has no departments')
      return err(ErrCode.PROVIDER_NO_DEPARTMENT)
    }

    const firstProviderDepartment = departments[0];

    const department = await db.selectExactlyOne('telenutrition.schedule_department', {
      department_id: firstProviderDepartment.department_id
    }).run(pool);

    const timezone = department.timezone

    const appointments = await db.select('telenutrition.schedule_appointment', {
      provider_id: provider.providerId,
      date: options.date,
      status: db.conditions.isNotIn(['x']),
      frozen: false,
    }, {
      order: { by: 'start_timestamp', direction: 'ASC'}
    }).run(pool);

    const mapAppointmentRecordResult = await createMapAppointmentRecordFn(context);
    if (mapAppointmentRecordResult.isErr()) {
      logger.error(context, TAG, 'could not create mapAppointmentRecordFn', { error: mapAppointmentRecordResult.error })
      return err(ErrCode.SERVICE)
    }

    const mapAppointmentRecord = mapAppointmentRecordResult.value

    const mappedAppts = appointments.map((record ) => mapAppointmentRecord({ record, timezone }))

    const duration = 60
    const slots: BookableSlot[] = []
    const allBookableSlots = mappedAppts.reduce((acc, appt) => {
      const startDateTime = DateTime.fromJSDate(appt.startTimestamp, { zone: timezone })
      const slots: string[] = [startDateTime.toFormat("HH:mm")]
      if (appt.duration === 60) {
        slots.push(startDateTime.plus({ minute: 30 }).toFormat("HH:mm"))
      }
      return [...acc, ...slots]
    }, [])

    const dateTime = DateTime.fromFormat(options.date, 'LL/dd/yyyy')
    if (!dateTime.isValid) {
      logger.error(context, TAG, 'invalide dateTime obj')
      return err(ErrCode.INVALID_DATA)
    }

    let offsetMinutes = 0
    if (provider.timezone) {
      offsetMinutes = dateTime.setZone(provider.timezone).offset - dateTime.setZone(department.timezone).offset
    }

    const bookableSlots = new Set(allBookableSlots)
    let from = dateTime.startOf('day').minus({ minutes: offsetMinutes })
    const to =  dateTime.set({ hour: 23 }).minus({ minutes: offsetMinutes })

    const displayTimezone = provider.timezone ?? department.timezone
    const displayTimezoneAbbrev = dateTime.setZone(displayTimezone).offsetNameShort

    while (from <= to) {
      const startTime = from.toFormat("HH:mm")
      slots.push({
        startTime,
        available: bookableSlots.has(startTime),
        booked: false,
        duration,
        displayTime: `${from.plus({ minutes: offsetMinutes }).toFormat("h:mm a")} ${displayTimezoneAbbrev}`,
        time: from.setZone(timezone).toJSDate(),
      })
      from = from.plus({ minute: duration })
    }
 
    return ok({ slots, timezone: displayTimezone, departmentId: department.department_id });
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

type CreateAppointmentSlotV2Params = {
  providerId: number;
  date: Date;
  duration: 30 | 60;
}

type AppointmentIds = number[]

export async function createAppointmentSlotV2(context: IContext, params: CreateAppointmentSlotV2Params): Promise<Result<AppointmentIds, ErrCode>>  {
  const TAG = [...MTAG, "service.createAppointmentSlotV2"];
  const { logger, store: { reader } } = context;

  try {
    const pool = await reader()

    const departmentProvider = await db.selectOne('telenutrition.schedule_department_provider', {
      provider_id: params.providerId,
    }, {
      lateral: {
        department: db.selectExactlyOne('telenutrition.schedule_department', {
          department_id: db.parent('department_id')
        }, {
          columns: ['timezone']
        })
      }
    }).run(pool)

    if (!departmentProvider) {
      logger.error(context, TAG, 'provider has no departments')
      return err(ErrCode.PROVIDER_NO_DEPARTMENT)
    }

    const department = departmentProvider.department

    let appointmentIds: number[] = [];

    for (let offset = 0; offset < params.duration; offset += 30) {
      const startTime = DateTime.fromJSDate(params.date).setZone(department.timezone).plus({ minutes: offset })
      
      const [dateStr, timeStr] = startTime.toFormat("MM/dd/yyyy HH:mm").split(" ");

      const result = await Appointment.Store.createAppointmentSlot(context, {
        departmentId: departmentProvider.department_id,
        providerId: params.providerId,
        appointmentStartTime: timeStr,
        appointmentDate: dateStr,
      })

      if (result.isErr()) {
        logger.error(context, TAG, 'error creating appointment slot in athena')
        return err(ErrCode.SERVICE)
      }

      const ids = result.value

      appointmentIds = appointmentIds.concat(ids)
    }

    return ok(appointmentIds)
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

export type CreateRecurringAppointmentSlotsParameters = {
  providerId: number,
  appointmentTypeId: number,
  date: Date;
  weekCount: number;
  duration: 30 | 60;
}

type CreateRecurringAppointmentSlotsReturn = {
  appointmentIds: number[],
  conflictedSlots: { startDateTime: DateTime }[]
}

export async function createRecurringAppointmentSlots(context: IContext, params: CreateRecurringAppointmentSlotsParameters): Promise<Result<CreateRecurringAppointmentSlotsReturn, ErrCode>> {
  const TAG = 'provider.service.createRecurringAppointmentSlot'
  const {logger, store: {reader}} = context

  const {providerId, weekCount, date, duration} = params

  const slots: {
    startDateTime: DateTime
  }[] = [];

  try {
    const pool = await reader()

    const departmentProvider = await db.selectOne('telenutrition.schedule_department_provider', {
      provider_id: providerId,
    }, {
      lateral: {
        department: db.selectExactlyOne('telenutrition.schedule_department', {
          department_id: db.parent('department_id')
        }, {
          columns: ['timezone']
        })
      }
    }).run(pool)

    if (!departmentProvider) {
      logger.error(context, TAG, 'provider has no departments')
      return err(ErrCode.PROVIDER_NO_DEPARTMENT)
    }

    const department = departmentProvider.department
    const departmentId = departmentProvider.department_id

    let currentStart = DateTime.fromJSDate(date)

    const convertedDate = currentStart.setZone(department.timezone)
    currentStart = convertedDate

    for (let i = 0; i < weekCount; i++) {
      for (let offset = 0; offset < duration; offset += 30) {
        const startDateTime = currentStart.plus({minutes: offset})

        slots.push({
          startDateTime,
        })
      }
      currentStart = currentStart.plus({week: 1})
    }

    const result = await Appointment.Store.createAppointmentMultipleSlots(context, {
          providerId,
          slots,
          departmentId
        }
    )

    if (result.isErr()) {
      return err(ErrCode.NOT_FOUND)
    }

    return ok(result.value)
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

type CreateAppointmentSlotOptions = {
  identity: ProviderIdRecord;
  startTime: string;
  date: string;
  departmentId: number;
  duration: 30 | 60;
}

export async function createAppointmentSlot(context: IContext, options: CreateAppointmentSlotOptions): Promise<Result<AppointmentIds, ErrCode>>  {
  const TAG = [...MTAG, "service.createAppointmentSlot"];
  const { logger } = context;

  try {
    const providerOId = options.identity.fid;

    const providerResult = await getProvider(context, { oktaId: providerOId })

    if (providerResult.isErr()) {
      return err(ErrCode.NOT_FOUND)
    }
    
    const provider = providerResult.value;

    let appointmentIds: number[] = [];

    for (let offset = 0; offset < options.duration; offset += 30) {
      let startTime = DateTime.fromFormat(`${options.date} ${options.startTime}`, "MM/dd/yyyy HH:mm");
      startTime = startTime.plus({ minutes: offset });
      
      const [dateStr, timeStr] = startTime.toFormat("MM/dd/yyyy HH:mm").split(" ");

      const result = await Appointment.Store.createAppointmentSlot(context, {
        departmentId: options.departmentId,
        providerId: provider.providerId,
        appointmentStartTime: timeStr,
        appointmentDate: dateStr,
      })

      if (result.isErr()) {
        logger.error(context, TAG, 'error creating appointment slot in athena')
        return err(ErrCode.SERVICE)
      }

      const ids = result.value

      appointmentIds = appointmentIds.concat(ids)
    }

    return ok(appointmentIds)
  } catch (e) {
    logger.exception(context, TAG, e);
  }
    return err(ErrCode.EXCEPTION);
}

interface FreezeAppointmentSlotOptions {
  appointmentId: number;
}

export async function freezeAppointmentSlot(context: IContext, options: FreezeAppointmentSlotOptions): Promise<Result<true, ErrCode>> {
  const TAG = [...MTAG, 'freezeAppointmentSlot']
  const { logger } = context;

  try {
    const result = await Appointment.Store.freezeAppointmentSlot(context, {
      appointmentId: options.appointmentId
    })

    if (result.isErr()) {
      logger.error(context, TAG, 'Could not freeze appointment slot with Athena', {
        appointmentId: options.appointmentId,
        error: result.error
      })
      return err(result.error)
    }

    return ok(true)
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

interface SetProviderTimezoneOptions {
  oktaId: string,
  timezone: string;
}

export async function setProviderTimezone(context: IContext, options: SetProviderTimezoneOptions): Promise<Result<true, ErrCode>> {
  const TAG = [...MTAG, "service.setTimezone"];
  const { logger, store: { writer } } = context;
  try {
    const pool = await writer();
    const oktaId = options.oktaId;

    const providerResult = await getProvider(context, { oktaId })

    if (providerResult.isErr()) {
      return err(ErrCode.NOT_FOUND)
    }

    await db.update('telenutrition.schedule_provider', {
      timezone: options.timezone
    }, { okta_id: oktaId }).run(pool)

    return ok(true);
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

interface GetProviderByProviderIdParams {
  providerId: number;
}

export async function getProviderByProviderId(context: IContext, options: GetProviderByProviderIdParams): Promise<Result<ProviderRecord, ErrCode>> {
  const { logger, store: { reader } } = context;
  const TAG = [...MTAG, 'getProviderByProviderId']

  try {
    const pool = await reader()

    const provider = await db.selectOne('telenutrition.schedule_provider', {
      provider_id: options.providerId
    }).run(pool)

    if (provider === undefined) {
      logger.error(context, TAG, 'could not find provider from providerId', { providerId: options.providerId })
      return err(ErrCode.NOT_FOUND)
    }

    return ok(mapProviderRecord(provider))
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

interface GetWhiteListedProvidersParams {
  payment: PaymentRecord;
}

export function getWhiteListedProviders(params: GetWhiteListedProvidersParams): number[] {
  if (paymentIsInsurance(params.payment)) {
    // BCBSTX
    if (params.payment.insurance_id === 2) {
      return [30,32,59,67,68,78,79,92,127,129,130,132,139,146,151,154,178,181,182,184,185,186,191,192,193,213,219]
    }
  }
  return []
}

interface GetProviderPatientParams {
  oktaId: string,
  patientId: number
  appointmentIds?: number[]
}

export async function getProviderPatient(context: IContext, params: GetProviderPatientParams): Promise<Result<HouseholdMemberWithSchedulingInfo, ErrCode>> {
  const { logger, store: { reader }, i18n } = context
  const TAG = [...MTAG, 'getProviderPatient']
  const { oktaId, patientId, appointmentIds } = params

  try {
    const pool = await reader()

    const patientRecord = await db.selectExactlyOne('telenutrition.schedule_patient', {
      patient_id: patientId,
    }, {
      lateral: {
        identity: db.selectExactlyOne('telenutrition.iam_identity', {
          identity_id: db.parent('identity_id')
        })
      }
    }).run(pool)

    const patient = mapPatientRecord(patientRecord)

    let appointment
    if (appointmentIds !== undefined) {
      const appointmentResult = await Appointment.Service.getAppointment(context, { appointmentId: appointmentIds[0] })
      if (appointmentResult.isErr()) {
        logger.error(context, TAG, "error getting appointment", { appointmentId: appointmentIds[0] });
        return ok({
          ...patient,
          schedulingInfo: {
            canSchedule: false,
            errors: [{ type: 'error', code: getErrorCodeMessage(context,ErrCode.SERVICE), message: i18n.__('Unknown error') }] 
          }
        })
      }
      appointment = appointmentResult.value
    }

    const providerResult = await getProvider(context, { oktaId });

    if (providerResult.isErr()) {
      logger.error(context, TAG, "error fetching provider", { oktaId });
      return ok({
        ...patient,
        schedulingInfo: {
          canSchedule: false,
          errors: [{ type: 'error', code: getErrorCodeMessage(context,ErrCode.SERVICE), message: i18n.__('Unknown error') }]
        }
      })
    }

    const provider = providerResult.value;

    const sessionsResult = await Patient.Store.getAllActiveAppointmentsForPatients(context, { patientIds: [patient.patientId ]})
    if (sessionsResult.isErr()) {
      logger.error(context, TAG, 'Could not get appointments for patients')
      return err(ErrCode.SERVICE)
    }

    const sessions = sessionsResult.value[patient.patientId]

    const patientSchedulingAvailabilityResult = await Patient.Service.getPatientSchedulingAvailabilityWithProvider(context, {
      patient: patientRecord,
      appointment,
      provider,
      sessions,
    })

    if (patientSchedulingAvailabilityResult.isErr()) {
      logger.error(context, TAG, 'could not determine scheduling availability info', { error: patientSchedulingAvailabilityResult.error })
      return err(patientSchedulingAvailabilityResult.error)
    }

    return ok(patientSchedulingAvailabilityResult.value)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

interface GetProviderDepartmentPatientsParams {
  providerOId: string;
  query: string;
  scheduleDate?: Date;
}

interface GetProviderDepartmentPatientsResult {
  patients: HouseholdMemberWithSchedulingInfo[]
}

export async function getProviderDepartmentPatients(context: IContext, params: GetProviderDepartmentPatientsParams): Promise<Result<GetProviderDepartmentPatientsResult, ErrCode>> {
  const { store: { reader }, logger } = context;
  const TAG = [...MTAG, 'getProviderDepartmentPatients']

  const { providerOId, query, scheduleDate } = params

  try {
    const pool = await reader()

    const providerResult = await getProvider(context, { oktaId: providerOId });

    if (providerResult.isErr()) {
      logger.error(context, TAG, "error fetching provider", { oktaId: providerOId });
      return err(ErrCode.SERVICE);
    }

    const provider = providerResult.value;

    const providerDepartments = await db.select('telenutrition.schedule_department_provider', {
      provider_id: provider.providerId,
    }).run(pool)

    const departmentIds = providerDepartments.map(dept => dept.department_id)
  
    const patientId = Number(query)
    const normalizedQuery = query
      .toLowerCase()
      .replace(/[^a-z, ]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const patients = await db.sql<zs.telenutrition.schedule_patient.SQL | zs.telenutrition.iam_identity.SQL, zs.telenutrition.schedule_patient.Selectable[]>`
      SELECT * FROM ${"telenutrition.schedule_patient"} SP
      INNER JOIN ${"telenutrition.iam_identity"} II USING (${"identity_id"})
      WHERE (
        ${{ department_id: db.conditions.isIn(departmentIds) }}
        AND (${isNaN(patientId)
          ? db.sql<zs.telenutrition.iam_identity.SQL>`II.${'norm_comma_name'} LIKE ${ db.param(`${ normalizedQuery }%`) }`
          : db.sql<zs.telenutrition.schedule_patient.SQL>`SP.${'patient_id'} = ${ db.param(patientId) }`
        })
      ) LIMIT 10
    `.run(pool)


    if (patients.length === 0) {
      return ok({ patients: [] })
    }

    const patientIds = patients.map(p => p.patient_id)
    const patientSessions = await Patient.Store.getAllActiveAppointmentsForPatients(context, { patientIds: patientIds })

    if (patientSessions.isErr()) {
      logger.error(context, TAG, 'Could not get patient sessions', {error: patientSessions.error})
      return err(ErrCode.SERVICE)
    }

    const sessions = patientSessions.value

    const patientsWithSchedulingInfoPromises = patients.map(async patientRecord => {
      const patientSessions = sessions[patientRecord.patient_id]

      const patientWithSchedulingInfo = await Patient.Service.getPatientSchedulingAvailabilityWithProvider(context, {
        patient: {
          ...patientRecord,
          birthday: patientRecord.birthday == null ? null : DateTime.fromJSDate(patientRecord.birthday).toISODate() as db.DateString,
          created_at: patientRecord.created_at == null ? null : DateTime.fromJSDate(patientRecord.created_at).toISOTime() as `${db.DateString}T${db.TimeString}`,
        },
        provider,
        sessions: patientSessions,
        scheduleDate,
      })

      if (patientWithSchedulingInfo.isErr()) {
        logger.error(context, TAG, 'there was an error calculating member scheduling info', {patientRecord, error: patientWithSchedulingInfo.error})
        return null;
      }

      return patientWithSchedulingInfo.value
    })

    const patientsWithSchedulingInfo = (await Promise.all(patientsWithSchedulingInfoPromises)).filter(p => !!p) as HouseholdMemberWithSchedulingInfo[]

    return ok({ patients: patientsWithSchedulingInfo })
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export async function getProviderPatients(context: IContext, params: ProviderOIdParams): Promise<Result<Household[], ErrCode>> {
  const { store: { reader }, logger } = context;
  const TAG = [...MTAG, 'getProviderPatients']

  const { providerOId } = params

  try {
    const pool = await reader()

    const providerResult = await getProvider(context, { oktaId: providerOId });

    if (providerResult.isErr()) {
      logger.error(context, TAG, "error fetching provider", { oktaId: providerOId });
      return err(ErrCode.SERVICE);
    }

    const provider = providerResult.value;
    let timezone = provider.timezone ?? '';

    if (!provider.timezone) {
      const timezoneResult = await getProviderTimezone(context, {
        oktaId: providerOId
      })

      if (timezoneResult.isErr()) {
        logger.error(context, TAG, "error fetching provider timezone", { oktaId: providerOId });
        return err(ErrCode.SERVICE);
      }

      timezone = timezoneResult.value.timezone;
    }

    const appointmentPatients = await db.select('telenutrition.schedule_appointment', {
      provider_id: provider.providerId,
      patient_id: db.conditions.isNotNull,
    }, {
      distinct: ['patient_id'],
      columns: [],
      lateral: {
        patient: db.selectOne('telenutrition.schedule_patient', {
          patient_id: db.parent('patient_id'),
        }, {
          columns: [],
          lateral: {
            user: db.selectOne('telenutrition.schedule_user_patient', {
              patient_id: db.parent('patient_id'),
            }, {
              columns: ['user_id'],
            })
          }
        }),
      }
    }).run(pool)

    if (!appointmentPatients.length) {
      return ok([]);
    }

    const houseHoldUserIDs = [...new Set(appointmentPatients.map(patient => patient.patient?.user?.user_id).filter(id => !!id).map(id => id!))]

    const patients = await db.select('telenutrition.schedule_user_patient', {
      user_id: db.conditions.isIn(houseHoldUserIDs),
    }, {
      columns: ['user_id', 'patient_id'],
      lateral: {
        user: db.selectOne('telenutrition.iam_user', {
          user_id: db.parent('user_id')
        }, {
          columns: ['identity_id']
        }),
        patient: db.selectOne('telenutrition.schedule_patient', {
          patient_id: db.parent('patient_id'),
        }, {
          lateral: {
            identity: db.selectOne('telenutrition.iam_identity', {
              identity_id: db.parent('identity_id'),
            }),
          }
        }),
      }
    }).run(pool)

    let result: {
      [key: string]: Household
    } = {}

    const patientIds = patients.map(p => p.patient_id)
    const sessionsResult = await Patient.Store.getAllActiveAppointmentsForPatients(context, { patientIds })
    if (sessionsResult.isErr()) {
      logger.error(context, TAG, 'could not fetch appointment timestamps for patients')
      return err(ErrCode.SERVICE)
    }

    for (const patient of patients) {
      if (!result[`${patient.user_id}`]) {
        result[`${patient.user_id}`] = {
          userId: patient.user_id,
          identityId: patient.user?.identity_id ?? undefined, //identityId of the account holder
          members: []
        }
      }

      if (patient.patient) {
        const memberWithSchedulingInfo = await Patient.Service.getPatientSchedulingAvailabilityWithProvider(context, {
          patient: patient.patient,
          provider: provider,
          sessions: sessionsResult.value[patient.patient_id]
        })

        if (memberWithSchedulingInfo.isErr()) {
          logger.error(context, TAG, 'there was an error calculating member scheduling info', {patient, error: memberWithSchedulingInfo.error})
          continue;
        }

        result[`${patient.user_id}`].members.push(memberWithSchedulingInfo.value)
      }
    }

    return ok(Object.values(result))
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export async function getProviderPatientsV2(context: IContext, params: GetProviderPastPatientsParams): 
  Promise<Result<{result: HouseholdMemberWithSchedulingInfo[], total: number}, ErrCode>> {
  const { logger } = context;
  const TAG = [...MTAG, 'getProviderPatientsV2']

  const { providerOId } = params

  try {
    const providerResult = await getProvider(context, { oktaId: providerOId });

    if (providerResult.isErr()) {
      logger.error(context, TAG, "error fetching provider", { oktaId: providerOId });
      return err(ErrCode.SERVICE);
    }
    const provider = providerResult.value;

    const providerPatientsResult = await Store.getProviderPatientsV2(context, params, provider.providerId);
    if (providerPatientsResult.isErr()) {
      logger.error(context, TAG, "error fetching provider patients from store", { providerId: provider.providerId, params });
      return err(ErrCode.SERVICE);
    }
    const providerPatients = providerPatientsResult.value.patients;
    const totalPatientCount = providerPatientsResult.value.totalPatientCount;

    const patientsWithSchedulingInfo: HouseholdMemberWithSchedulingInfo[] = [];

    for (const patient of providerPatients) {
      const memberWithSchedulingInfo = await Patient.Service.getPatientSchedulingAvailabilityWithProvider(context, {
        patient: patient,
        provider: provider,
        lastSession: patient.last_session,
        nextSession: patient.next_session,
      })
      if (memberWithSchedulingInfo.isErr()) {
        logger.error(context, TAG, 'there was an error calculating member scheduling info', {patient, error: memberWithSchedulingInfo.error})
        continue;
      }

      patientsWithSchedulingInfo.push(memberWithSchedulingInfo.value)
    }

    return ok({result: patientsWithSchedulingInfo, total: totalPatientCount})
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

interface GetProviderSchedulingAnalyticsParams {
  identity: IdentityRecord;
  startTime: string;
  endTime: string;
}

type AppointmentAnalyticsRecord = {
  value: number;
  theme: 'statusGreen' | 'blue' | 'pale-green' | 'statusAmber' | 'statusRed' | 'neutral'
  label: string;
}

type GetProviderSchedulingAnalyticsReturn = {
  appointments: AppointmentAnalyticsRecord[]
}

export async function getProviderSchedulingAnalytics(context: IContext, params: GetProviderSchedulingAnalyticsParams): Promise<Result<GetProviderSchedulingAnalyticsReturn, ErrCode>> {
  const { store: { reader }, logger } = context
  const TAG = [...MTAG, 'getProviderSchedulingAnalytics']

  if (!isProviderIdentity(params.identity)) {
    logger.error(context, TAG, 'providers can access only their own analytics data')
    return err(ErrCode.FORBIDDEN)
  }


  try {
    const pool = await reader()

    const providerResult = await getProvider(context, { oktaId: params.identity.fid })

    if (providerResult.isErr()) {
      logger.error(context, TAG, 'provider not found')
      return err(ErrCode.NOT_FOUND)
    }

    const provider = providerResult.value

    const appts = await db.select('telenutrition.schedule_appointment', {
      provider_id: provider.providerId,
      start_timestamp: db.conditions.between(new Date(params.startTime), new Date(params.endTime)),
    }).run(pool)

    const initialAppointmentTypeIds = await db.select('telenutrition.schedule_appointment_type', { is_initial: true }).run(pool)

    let canceled = 0,
        initialSession = 0,
        followUpSession = 0,
        num30MinSlotsAvailable = 0;

    appts.forEach(appt => {
      if (initialAppointmentTypeIds.some(apptTypeId => appt.appointment_type_id === apptTypeId.appointment_type_id)) {
        initialSession++
      } else {
        followUpSession++
      }

      if (appt.status === 'o') {
        num30MinSlotsAvailable++
      }

      if (appt.status === 'x') {
        canceled++
      }
    })

    return ok({
      appointments: [
        {
          value: initialSession,
          label: 'Initial sessions',
          theme: 'statusAmber'
        },
        {
          value: followUpSession,
          label: 'Follow-up sessions',
          theme: 'blue'
        },
        {
          value: num30MinSlotsAvailable,
          label: 'Remaining 30-minute slots available',
          theme: 'neutral'
        },
      ]
    })
  }
  catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

interface GetProviderLicenseSummaryParams {
  providerId: number;
}

type GetProviderLicenseSummaryReturn = {
  licenses?: (ProviderLicenseRecord & { isValid: boolean })[];
  applications?: (ProviderLicenseApplicationRecord & { isValid: boolean })[];
}

export async function getProviderLicenseSummary(context: IContext, params: GetProviderLicenseSummaryParams): Promise<Result<GetProviderLicenseSummaryReturn, ErrCode>> {
  const { logger, store: { reader } } = context;

  const TAG = [...MTAG, 'getProviderLicenseSummary']

  try {
    const pool = await reader()
    
    const res = await db.selectOne('telenutrition.provider_license_summary', {
        provider_id: params.providerId,
    }, {
      lateral: {
        licenses: db.select('telenutrition.provider_license', {
          provider_id: db.parent('provider_id')
        }),
        applications: db.select('telenutrition.provider_license_application', {
          provider_id: db.parent('provider_id')
        })
      }
    }).run(pool)
    
    const validLicenses = res?.valid_licenses || []
    const validApplications = res?.valid_applications || []
  
    return ok({
      licenses: res?.licenses.map(license => ({
        ...mapProviderLicenseRecord(license),
        isValid: validLicenses.includes(license.license_id)
      })),
      applications: res?.applications.map(application => ({
        ...mapProviderLicenseApplicationRecord(application),
        isValid: validApplications.includes(application.license_application_id)
      }))
    })
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}
    
export async function getProviderTasks(context: IContext, params: { identity: ProviderIdRecord }): Promise<Result<ProviderTaskRecord[], ErrCode>> {
  const { store: { reader }, logger } = context

  const TAG = [...MTAG, 'getProviderTasks']

  try {
    const pool = await reader()

    const providerResult = await getProvider(context, { oktaId: params.identity.fid })

    if (providerResult.isErr()) {
      logger.error(context, TAG, 'could not find provider', { oktaId: params.identity.fid })
      return err(ErrCode.NOT_FOUND)
    }

    const provider = providerResult.value

    const tasks = await db.select('telenutrition.provider_task', {
      provider_id: provider.providerId,
      status: db.conditions.isNotIn(['completed'])
    }).run(pool)

    return ok(tasks.map(mapProviderTask))
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

interface CreateProviderTaskParams {
  task: {
    name: string;
    note?: string;
    dueDate?: string;
    priority: z.infer<typeof TaskPriority>;
  }
  identity: ProviderIdRecord;
}

export async function createProviderTask(context: IContext, { task, identity }: CreateProviderTaskParams): Promise<Result<ProviderTaskRecord, ErrCode>> {
  const { store: { writer }, logger } = context

  const TAG = [...MTAG, 'createProviderTask']

  try {
    const pool = await writer()

    const providerResult = await getProvider(context, { oktaId: identity.fid })

    if (providerResult.isErr()) {
      logger.error(context, TAG, 'could not find provider', { oktaId: identity.fid })
      return err(ErrCode.NOT_FOUND)
    }

    const provider = providerResult.value

    const insertResult = await db.insert('telenutrition.provider_task', {
      provider_id: provider.providerId,
      name: task.name,
      priority: task.priority,
      status: 'todo',
      updated_at: new Date(),
      ...(task.note && { note: task.note }),
      ...(task.dueDate && { due_date: new Date(task.dueDate) }),
    }).run(pool)

    return ok(mapProviderTask(insertResult))
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

type UpdateProviderTaskParams = {
  task: Pick<ProviderTaskRecord, 'taskId'>
    & Partial<Pick<ProviderTaskRecord, 'status' | 'name' | 'note' | 'priority'>>;
}

export async function updateProviderTask(context: IContext, params: UpdateProviderTaskParams): Promise<Result<ProviderTaskRecord[], ErrCode>> {
  const { store: { writer }, logger } = context

  const TAG = [...MTAG, 'updateProviderTask']

  try {
    const pool = await writer()

    const { task } = params

    const updateResults = await db.update('telenutrition.provider_task', {
      updated_at: new Date(),
      ...(task.name && { name: task.name }),
      ...(task.note && { note: task.note }),
      ...(task.status && { status: task.status }),
      ...(task.priority && { priority: task.priority }),
    }, {
      task_id: task.taskId
    }).run(pool)

    return ok(updateResults.map(mapProviderTask))
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

interface RequestRescheduleWithOtherProviderParams {
  rescheduleAppointmentId: number;
  isAudioOnly: boolean;
  duration: 30 | 60;
}

export async function requestRescheduleWithOtherProvider(context: IContext, params: RequestRescheduleWithOtherProviderParams): Promise<Result<{}, ErrCode>> {
  const { logger, store: { reader } } = context

  const TAG = [...MTAG, 'requestRescheduleWithOtherProvider']

  try {
    const pool = await reader()

    const appointment = await db.selectExactlyOne('telenutrition.schedule_appointment', {
      appointment_id: params.rescheduleAppointmentId,
    }, {
      lateral: {
        provider: db.selectExactlyOne('telenutrition.schedule_provider', {
          provider_id: db.parent('provider_id'),
        })
      }
    }).run(pool)

    const provider = appointment.provider

    logger.info(context, TAG, 'TODO: create clickup task for GDT to reschedule appointment', { provider, appointment })

    const cancelResult = await Appointment.Service.cancelAppointment(context, params.rescheduleAppointmentId, { eventSource: 'reschedule', canceledBy: 'provider', cancelReason: 'PROVIDER_UNAVAILABLE' })

    if (cancelResult.isErr()) {
      logger.error(context, TAG, 'could not cancel appointment', { appointmentId: params.rescheduleAppointmentId, error: cancelResult.error })
      return err(ErrCode.SERVICE)
    }

    return ok({ cancelAppointment: cancelResult.value })
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
} 

export async function getProviderPerformanceMetrics(
  context: IContext,
  { providerId, ...params }: { providerId: number; } & ProviderPerformanceMetricsParams,
): Promise<Result<ProviderPerformanceMetricsAPIResult, ErrCode>> {
  const { logger } = context;
  const TAG = [...MTAG, 'getProviderPerformanceMetrics'];
  const { timezone } = params;

  try {
    let startDate: string, endDate: string;
    if (params.metricsDateRangeConfig !== ProviderMetricsDateRangeType.Custom) {
      const dateRange = calculateDateRange(params.metricsDateRangeConfig, timezone);
      startDate = dateRange.startDate;
      endDate = dateRange.endDate;
    } else {
      startDate = params.startDate;
      endDate = params.endDate;
    }

    const { comparisonStartDate, comparisonEndDate } = calculateComparisonDateRange(startDate, params.metricsDateRangeConfig);

    const targetMetrics = await Store.getProviderMetricsInDateRange(
      context, startDate, endDate, timezone, providerId
    );

    if (targetMetrics.isErr()) {
      logger.error(context, TAG, 'Error retrieving provider metrics', { error: targetMetrics.error });
      return err(ErrCode.EXCEPTION);
    }

    const dailyUnitsBilled = await Store.getDailyUnitsBilled(
      context, 
      params.metricsDateRangeConfig == ProviderMetricsDateRangeType.Today ? calculateMondayOfTheWeek(timezone): startDate, 
      endDate, 
      timezone, 
      providerId
    );
    if (dailyUnitsBilled.isErr()) {
      logger.error(context, TAG, 'Error retrieving daily units billed for provider', { error: dailyUnitsBilled.error });
      return err(ErrCode.EXCEPTION);
    }    

    const targetMetricsResult = targetMetrics.value;
    const dailyUnitsBilledResult = dailyUnitsBilled.value;

    let unitsBilledPerBDayDiff: number | null = null,
      unitsBilledPerCVDiff: number | null = null;
    if (comparisonStartDate && comparisonEndDate) {
      const metricsForComparison = await Store.getProviderMetricsInDateRange(
        context,
        comparisonStartDate,
        comparisonEndDate,
        timezone,
        providerId,
      );

      if (metricsForComparison.isErr()) {
        logger.error(context, TAG, 'Error retrieving provider metrics', { error: metricsForComparison.error });
        return err(ErrCode.EXCEPTION);
      }

      const prevMetricsResult = metricsForComparison.value;

      const curUnitsBilledPerBDay = targetMetricsResult.unitsBilledPerBusinessDay;
      const prevUnitsBilledPerBDay = prevMetricsResult.unitsBilledPerBusinessDay;
      unitsBilledPerBDayDiff = curUnitsBilledPerBDay - prevUnitsBilledPerBDay;

      const curUnitsBilledPerCV = targetMetricsResult.unitsBilledPerCompletedVisits;
      const prevUnitsBilledPerCV = prevMetricsResult.unitsBilledPerCompletedVisits;
      unitsBilledPerCVDiff =
        curUnitsBilledPerCV === null || prevUnitsBilledPerCV === null
          ? null
          : curUnitsBilledPerCV - prevUnitsBilledPerCV;
    }

    const toThreeDecimalPlaces = (result) => { return result !== null ? Math.round(result * 1000) / 1000 : null; }
    const toOneDecimalPlace = (result) => { return result !== null ? Math.round(result * 10) / 10 : null; }

    return ok({
      totalUnitsBilled: targetMetricsResult.totalUnitsBilled,
      unitsBilledPerBusinessDay: targetMetricsResult.unitsBilledPerBusinessDay,
      unitsBilledPerCompletedVisits: toOneDecimalPlace(targetMetricsResult.unitsBilledPerCompletedVisits),
      patientPersistenceRate: toThreeDecimalPlaces(targetMetricsResult.patientPersistenceRate),
      unitsBilledByDay: dailyUnitsBilledResult,
      unitsBilledPerBDayDiff: toOneDecimalPlace(unitsBilledPerBDayDiff),
      unitsBilledPerCVDiff: toOneDecimalPlace(unitsBilledPerCVDiff),
      startDate: startDate,
      endDate: endDate,
      comparisonStartDate: comparisonStartDate,
      comparisonEndDate: comparisonEndDate,
    });
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

export async function hasProviderScheduledWithPatient(
  context: IContext,
  params: {
    providerId: number,
    patientId: number
  }
): Promise<Result<boolean, ErrCode>> {
  const { store: { reader }, logger } = context

  const TAG = [...MTAG, 'hasProviderScheduledWithPatient']

  try {
    const pool = await reader()

    const count = await db.count('telenutrition.schedule_appointment', {
      provider_id: params.providerId,
      patient_id: params.patientId
    }).run(pool)

    return ok(count > 0)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

type ProviderFeatures = {
  canScheduleOverbookSlots: boolean;
}

export async function getProviderFeatures(context: IContext, {providerId}): Promise<Result<ProviderFeatures, ErrCode>> {
  const { logger, store: { reader } } = context

  const TAG = [...MTAG, 'getProviderFeatures']

  try {
    // const pool = await reader()
    // const provider = await db.selectOne('telenutrition.schedule_provider', {
    //   provider_id: providerId
    // }, {
    //   lateral: {
    //     employee: db.selectOne('common.employee', {
    //       employee_id: db.parent('employee_id')
    //     }, {
    //       columns: ['employment_type']
    //     })
    //   }
    // }).run(pool)
    
    // if (!provider) {
    //   logger.error(context, TAG, 'provider not found', { providerId })
    //   return err(ErrCode.NOT_FOUND)
    // }

    // const isW2 = Boolean(provider.employee?.employment_type && ['salaried_ft', 'salaried_pt'].includes(provider.employee.employment_type))
    
    return ok({
      canScheduleOverbookSlots: true,
    })
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export default {
  isProviderLicensedInDepartment,
  canProviderScheduleForPatient,
  getProvider,
  providerBookAppointment,
  providerBookBulkAppointments,
  getProviderByName,
  updateProviderOktaId,
  updateProvider,
  getProviderTimezone,
  getProviderBookableSlotsForDay,
  createAppointmentSlot,
  freezeAppointmentSlot,
  setProviderTimezone,
  getProviderByProviderId,
  getWhiteListedProviders,
  getProviderPatient,
  getProviderPatients,
  getProviderPatientsV2,
  createAppointmentSlotV2,
  createRecurringAppointmentSlots,
  getProviderSchedulingAnalytics,
  getProviderTasks,
  createProviderTask,
  updateProviderTask,
  getProviderLicenseSummary,
  getProviderDepartmentPatients,
  requestRescheduleWithOtherProvider,
  hasProviderScheduledWithPatient,
  getProviderFeatures,
  getProviderPerformanceMetrics,
};
