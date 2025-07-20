import { IContext } from "@mono/common/lib/context"
import { ErrCode, ErrCodeError, getErrorCodeMessage } from "@mono/common/lib/error"
import { Result, ok, err } from "neverthrow"
import Logger from '@mono/common/lib/logger'
import { UserRecord, findUser } from '../../iam/user/service'
import { updateCustomer } from '../cio'
import Store, { PatientRecord, PatientContactInfo, getNextAndLastSessions, mapPatientRecord, PatientWithIdentity, UpdatePatientPayload } from './store'
import * as db from "zapatos/db";
import { DateTime } from "luxon"
import { isFullyIdentified } from "../../iam/user/service"
import Identity from "../../iam/identity"
import { determineAccountForEligibleUser } from "../../iam/enrollment"
import { EligibleUsersShort } from "@mono/foodapp/lib/store/users-eligible"
import Appointment from "../appointment"
import { AppointmentRecord, AppointmentType } from "../appointment/types"
import { HouseholdMember, HouseholdMemberWithSchedulingInfo } from "../provider/types"
import Provider from "../provider"
import Payment from "../payment"
import { AudioSupport } from "../payment/shared"
import { mapProviderRecord } from "../provider/store"
import { ProviderRecord } from "../provider/shared"
import Questionnaire from '../questionnaire'
import { mapAppointmentEncounterRecord } from "../encounter/store"
import { getChartingV1Config } from "../questionnaire/service"
import { AppEncounterData, CompleteAppEncounterData, HistoricalEncounterData } from "../encounter/types"
import { EncounterStatus } from '../encounter/shared'

const MTAG = Logger.tag()

interface GetPatientByIdOptions {
  patientId: number;
}

export async function getPatientById(context: IContext, options: GetPatientByIdOptions): Promise<Result<PatientRecord, ErrCode>> {
  const {logger} = context;
  const TAG = [...MTAG, 'getPatientById']

  try {
    const patientResult = await Store.selectOnePatient(context, { patientId: options.patientId })

    if (patientResult.isErr()) {
      logger.error(context, TAG, 'patient not found', options)
      return err(ErrCode.NOT_FOUND)
    }

    const patient = patientResult.value;

    return ok(patient);
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

interface HasScheduledAppointmentParameters {
  patientId: number;
}

export async function hasScheduledAppointment(context: IContext, params: HasScheduledAppointmentParameters): Promise<Result<boolean, ErrCode>> {
  const { store: { reader }, logger } = context;
  const TAG = [...MTAG, 'hasScheduledAppointment']

  try {
    const pool = await reader();

    const scheduledAppointments = await db.select('telenutrition.schedule_appointment', {
      patient_id: params.patientId, frozen: false, status: db.conditions.isNotIn(['x'])
    }).run(pool);

    if (scheduledAppointments.length > 0) {
      logger.debug(context, TAG, 'patient has scheduled at least one appt', { scheduledAppointments })
      return ok(true)
    }

    logger.debug(context, TAG, 'patient has not scheduled any appointments')
    return ok(false);
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

export async function getNextAppointmentType(context: IContext, params: HasScheduledAppointmentParameters): Promise<Result<AppointmentType, ErrCode>> {
  const { store: { reader }, logger } = context;
  const TAG = [...MTAG, 'getNextAppointmentType']

  try {
    const pool = await reader();

    const appts = await db.select('telenutrition.schedule_appointment', {
      patient_id: params.patientId,
      frozen: false,
      status: db.conditions.ne('x'),
      start_timestamp: db.conditions.gt(
        db.conditions.fromNow(-3, 'years')
      )
    }).run(pool);

    if (appts.some(appt => ['2','3', '4'].includes(appt.status))) {
      return ok(AppointmentType.FollowUp)
    }

    const yesterday = DateTime.now().minus({ days: 1 })
    if (appts.length === 0 || appts.every(appt => DateTime.fromISO(appt.start_timestamp) < yesterday)) {
      return ok(AppointmentType.Initial)
    }

    return err(ErrCode.INITIAL_CHECKIN_REQUIRED)
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

export async function getUserPatients(context: IContext, userId: number): Promise<Result<PatientRecord[], ErrCode>> {
  const { logger } = context
  const TAG = [...MTAG, 'getUserPatients']

  try {
    const result = await Store.fetchPatientsForUser(context, userId)
    if (result.isErr()) {
      return err(result.error)
    }
    return ok(result.value)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export async function isPatientOwner(context: IContext, params: {
  userId: number,
  patientId: number
}): Promise<Result<boolean, ErrCode>> {
  const {logger, store: {reader}} = context

  const TAG = [...MTAG, 'isPatientOwner']
  const { userId, patientId } = params

  try {
    const pool = await reader()

    const isOwner = await db.selectOne('telenutrition.schedule_user_patient', {
      user_id: userId,
      patient_id: patientId
    }).run(pool)

    return ok(isOwner !== undefined)
  } catch(e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

async function updatePatientEligibility(context: IContext, patient: PatientRecord, eligibleUser: EligibleUsersShort): Promise<Result<boolean, ErrCode>> {
  const { logger, store } = context
  const TAG = [...MTAG, 'updatePatientEligibility']

  try {
    const wPool = await store.writer();

    const patientId = patient.patientId
    const identityId = patient.identityId

    if (identityId === undefined) {
      logger.error(context, TAG, "Attempt to update patient eligibility for patient without identity id", { patientId })
      return err(ErrCode.STATE_VIOLATION)
    }

    // Update patient identity to match the new eligible id
    let accountId: number | undefined
    const identityResult = await Identity.Store.selectIdentity(context, { eligibleId: eligibleUser.id })
    if (identityResult.isOk()) {
      const identityRecord = identityResult.value

      if (identityRecord.identityId == identityId) {
        return ok(true) // already eligible
      }
      if (identityRecord.patientId !== undefined || identityRecord.userId !== undefined) {
        logger.error(context, TAG, 'Identity violation trying to update eligibleId for patient', { patientId, eligibleId: eligibleUser.id })
        return err(ErrCode.STATE_VIOLATION)
      }
      accountId = identityRecord.accountId
    } else if (identityResult.error !== ErrCode.NOT_FOUND) {
      logger.error(context, TAG, 'Error fetching identity', { error: identityResult.error })
      return err(identityResult.error)
    }

    if (accountId == undefined) {
      const accountResult = await determineAccountForEligibleUser(context, eligibleUser)
      if (accountResult.isOk()) {
        accountId = accountResult.value
      } else if (accountResult.error != ErrCode.NOT_FOUND) {
        logger.error(context, TAG, 'Error determining account for eligible user', { error: accountResult.error })
        return err(accountResult.error)
      }
    }

    await db.serializable(wPool, async txn => {
      const birthday = eligibleUser.birthday || undefined
      if (birthday !== undefined && patient.birthday !== undefined && !DateTime.fromISO(patient.birthday).hasSame(DateTime.fromJSDate(birthday), 'day')) {
        // The identity attributes after updating the birthday
        const newIdentityAttributes = {
          firstName: patient.firstName,
          lastName: patient.lastName,
          zipCode: patient.zipcode,
          birthday
        }
        if (isFullyIdentified(newIdentityAttributes)) {
          const isAvailabileResult = await Identity.Store.isIdentityAvailable(context, newIdentityAttributes, txn)
          if (isAvailabileResult.isErr()) {
            logger.error(context, TAG, 'Error checking identity availability', { error: isAvailabileResult.error })
            throw new ErrCodeError(ErrCode.SERVICE)
          }
          if (!isAvailabileResult.value) {
            logger.error(context, TAG, 'Identity violation trying to update birthday for patient', { patientId, birthday })
            throw new ErrCodeError(ErrCode.STATE_VIOLATION)
          }
        }
      }
      const updateIdentityResult = await Identity.Store.updateIdentity(context, identityId, {
        ...(birthday && { birthday}),
        eligibleId: eligibleUser.id,
        accountId
      }, txn);
      if (updateIdentityResult.isErr()) {
        logger.error(context, TAG, 'Error updating identity', { identityId, patientId, eligibleId: eligibleUser.id })
        throw new ErrCodeError(ErrCode.SERVICE)
      }
    })
    return ok(true)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(e instanceof ErrCodeError ? e.code : ErrCode.EXCEPTION)
  }
}

export async function getPatientUser(context: IContext, patientId: number): Promise<Result<UserRecord, ErrCode>> {
  const { logger, store: { reader }} = context
  const TAG = [ ...MTAG, 'getPatientUser' ]

  try {
    const pool = await reader()

    const selected = await db.selectOne('telenutrition.schedule_user_patient', {
      patient_id: patientId,
    }).run(pool)

    if (!selected) {
      logger.error(context, TAG, 'Patient is not associated with a user.', {
        patientId,
      })

      return err(ErrCode.STATE_VIOLATION)
    }

    const userId = selected.user_id
    const findUserResult = await findUser(context, { userId, })

    if (findUserResult.isErr()) {
      logger.error(context, TAG, 'Error getting user for patient.', {
        patientId, 
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

export async function updatePatientContactInfo(context: IContext, patientId: number, contactInfo: PatientContactInfo): Promise<Result<PatientRecord, ErrCode>> {
  const { logger } = context
  const TAG = [ ...MTAG, 'updatePatientContactInfo' ]

  try {
    const updatePatientResult = await Store.updatePatientContactInfo(context, patientId, contactInfo )

    if (updatePatientResult.isErr()) {
      logger.error(context, TAG, 'Error updating patient contact info.', {
        patientId,
        contactInfo,
      })

      return err(updatePatientResult.error)
    }

    const patient = updatePatientResult.value

    const updateCustomerResult = await updateCustomer(context, patient)

    if (updateCustomerResult.isErr()) {
      logger.error(context, TAG, 'Error updating C.io customer for patient.', { patient, })

      return err(updateCustomerResult.error)
    }

    return ok(patient)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export async function updateProviderPatientInfo(context: IContext, patientId: number, patient: UpdatePatientPayload): Promise<Result<PatientRecord, ErrCode>> {
  const { logger } = context
  const TAG = [ ...MTAG, 'updateProviderPatientInfo' ]
  try {
    const updatePatientResult = await Store.updatePatientInfo(context, patientId, patient)

    if (updatePatientResult.isErr()) {
      logger.error(context, TAG, 'Error updating patient info.', {
        patientId,
        patient,
      })

      return err(updatePatientResult.error)
    }

    const updatedPatient = updatePatientResult.value

    return ok(updatedPatient)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

interface GetPatientAppointmentHistoryParams {
  patientId: number;
  timezone: string;
  limit?: number;
  completeOnly?: boolean;
  includeEncounterData?: boolean;
}

type PatientAppointmentHistoryRecord = {
  appointment: AppointmentRecord;
  encounterData?: HistoricalEncounterData | AppEncounterData | CompleteAppEncounterData;
};

export async function getPatientAppointmentHistory(
  context: IContext,
  params: GetPatientAppointmentHistoryParams
): Promise<Result<PatientAppointmentHistoryRecord[], ErrCode>> {
  const { logger, store: { reader } } = context
  const TAG = [ ...MTAG, 'getPatientAppointmentHistory' ]

  try {
    const pool = await reader()

    const patient = await db.selectOne('telenutrition.schedule_patient', {
      patient_id: params.patientId,
    }, {
      lateral: {
        identity: db.selectOne('telenutrition.iam_identity', {
          identity_id: db.parent('identity_id'),
        }),
        appointments: db.select('telenutrition.schedule_appointment', {
          patient_id: db.parent('patient_id'),
          ...(params.completeOnly && { status: db.conditions.isIn(['1','2','3','4']) })
        }, {
          lateral: {
            encounter: db.selectOne('telenutrition.clinical_encounter', {
              appointment_id: db.parent('appointment_id'),
              encounter_status: db.conditions.ne('pend')
            }, {
              order: { by: 'encounter_id', direction: 'DESC'},
            }),
            provider: db.selectOne('telenutrition.schedule_provider', {
              provider_id: db.parent('provider_id')
            })
          },
          order: { by: 'start_timestamp', direction: 'DESC'},
          limit: params.limit
        })
      }
    }).run(pool)

    const mapAppointmentRecordResult = await Appointment.Store.createMapAppointmentRecordFn(context);
    if (mapAppointmentRecordResult.isErr()) {
      logger.error(context, TAG, 'could not create mapAppointmentRecordFn', { error: mapAppointmentRecordResult.error })
      return err(ErrCode.SERVICE)
    }

    const mapAppointmentRecord = mapAppointmentRecordResult.value

    const promises = (patient?.appointments || []).map(async appt => {
      const appointment = mapAppointmentRecord({ record: appt, timezone: params.timezone, patient: patient, provider: appt.provider })
      const encounter = appt.encounter ? mapAppointmentEncounterRecord(appt.encounter) : undefined;

      if (!encounter) {
        return { appointment }
      }

      if (encounter.type === 'historical') {
        return {
          appointment,
          encounterData: {
            type: 'historical' as const,
            ...(params.includeEncounterData && {
              historicalEncounter: encounter
            }),
          }
        }
      }

      if (encounter.encounterStatus === EncounterStatus.Open) {
        const encounterData: AppEncounterData = {
          type: 'app',
          encounter,
        }

        return {
          appointment,
          encounterData,
        }
      }

      const encounterData: CompleteAppEncounterData = {
        type: 'app-complete' as const,
        encounter,
      }
      
      if (params.includeEncounterData && encounter.rawData) {
        const chartingConfigResult = await getChartingV1Config(context, { appointment })

        if (chartingConfigResult.isErr()) {
          logger.error(context, TAG, 'Error getting charting config', { error: chartingConfigResult.error })
  
          return {
            appointment,
          }
        }

        const displayChartingData = Questionnaire.Service.getDisplayFromConfigAndValues(context, {
          values: encounter.rawData,
          config: chartingConfigResult.value.config,
        });

        encounterData.displayChartingData = displayChartingData;
      }

      return {
        appointment,
        encounterData,
      }
    })

    const result = await Promise.all(promises)
    let history = result.filter(r => !!r) as PatientAppointmentHistoryRecord[]

    return ok(history)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

type GetPatientSchedulingAvailabilityWithProviderParams = {
  patient: PatientWithIdentity;
  provider: ProviderRecord;
  appointment?: AppointmentRecord;
  sessions?: { start_timestamp: string }[];
  scheduleDate?: Date;
  lastSession?: string
  nextSession?: string
}

export async function getPatientSchedulingAvailabilityWithProvider(context: IContext, params: GetPatientSchedulingAvailabilityWithProviderParams): Promise<Result<HouseholdMemberWithSchedulingInfo, ErrCode>> {
  const { logger, i18n } = context
  const TAG = [...MTAG, 'getPatientSchedulingAvailabilityWithProvider']

  try {
    const { patient, provider, appointment, scheduleDate } = params

    const sessionsTimstamps = params.sessions?.map((session) => session.start_timestamp);
    const { lastSession, nextSession } = sessionsTimstamps
      ? getNextAndLastSessions(sessionsTimstamps)
      : { lastSession: params.lastSession ?? null, nextSession: params.nextSession ?? null };
    const mappedPatient = mapPatientRecord(patient)
    const patientId = patient.patient_id
    const appointmentId = appointment?.appointmentId
    const member: HouseholdMember = {
      ...mappedPatient,
      nextSession,
      lastSession,
    }

    const appointmentTypeResult = await getNextAppointmentType(context, { patientId })

    if (appointmentTypeResult.isErr()) {
      const error = appointmentTypeResult.error
      if (error === ErrCode.INITIAL_CHECKIN_REQUIRED) {
        return ok({
          ...member,
          schedulingInfo: {
            canSchedule: false,
            errors: [{
              type: 'disallowed',
              reasonShort: i18n.__("Initial appointment check-in required"),
              reasonFull: getErrorCodeMessage(context, error)
            }]
          }
        })
      }

      logger.error(context, TAG, "error checking next appointment type", { patientId, error })
      return ok({
        ...member,
        schedulingInfo: {
          canSchedule: false,
          errors: [{
            type: 'error',
            code: getErrorCodeMessage(context, error),
            message: i18n.__("The member is not available for scheduling at this time.")
          }]
        }
      })
    }
    
    if (scheduleDate) {
      const scheduleDateDT = DateTime.fromJSDate(scheduleDate, { zone: patient.timezone }).startOf('day')
      const appointmentWithinWeek = sessionsTimstamps?.some(timestamp => {
        const timestampDT = DateTime.fromISO(timestamp, { zone: patient.timezone }).startOf('day');
        const startOfWeek = timestampDT.weekday === 7 ? timestampDT : timestampDT.startOf('week').minus({ day: 1 })
        const endOfWeek = startOfWeek.plus({ days: 7 })
        if (scheduleDateDT > startOfWeek && scheduleDateDT < endOfWeek) {
          return true;
        }
        return false;
      })

      if (appointmentWithinWeek) {
        return ok({
          ...member,
          schedulingInfo: {
            canSchedule: false,
            errors: [{
              type: 'disallowed',
              reasonShort: i18n.__("Visit within same week"),
              reasonFull: i18n.__("Members cannot schedule more than one appointment per week."),
            }]
          }
        })
      }
    }

    const patientPaymentMethodsResult = await Payment.Service.getPatientPaymentMethods(context, { patientId })
    if (patientPaymentMethodsResult.isErr()) {
      return err(patientPaymentMethodsResult.error)
    }
    const patientPaymentMethods = patientPaymentMethodsResult.value;

    const defaultPaymentResult = await Payment.Service.getDefaultPaymentMethod(context, {
      patientId,
      appointment,
      patientPaymentMethods,
    })

    if (defaultPaymentResult.isErr()) {
      const error = defaultPaymentResult.error

      if (defaultPaymentResult.error == ErrCode.NOT_FOUND) {
        logger.debug(context, TAG, "default payment method not found", { patientId, appointmentId, error })
        return ok({
          ...member,
          schedulingInfo: {
            canSchedule: false,
            errors: [{
              type: 'disallowed',
              reasonShort: i18n.__("Default payment required"),
              reasonFull: i18n.__("The member must have a default payment method for a provider to schedule with them.")
            }]
          }
        })
      } else if (defaultPaymentResult.error === ErrCode.PAYMENT_LIMIT_REACHED) {
        logger.debug(context, TAG, "payment limit reached", { patientId, appointmentId, error })
        return ok({
          ...member,
          schedulingInfo: {
            canSchedule: false,
            errors: [{
              type: 'disallowed',
              reasonShort: i18n.__("Visit limit reached"),
              reasonFull: i18n.__("This member has already reached the maximum covered number of appointments by their plan."),
            }]
          }
        })
      }

      logger.error(context, TAG, "error getting default payment method", { patientId, appointmentId, error })
      return ok({
        ...member,
        schedulingInfo: {
          canSchedule: false,
          errors: [{
            type: 'error',
            code: getErrorCodeMessage(context, ErrCode.SERVICE),
            message: i18n.__("The member is not available for scheduling at this time.")
          }]
        }
      })
    }

    const defaultPayment = defaultPaymentResult.value

    const canProviderScheduleForPatientResult = await Provider.Service.canProviderScheduleForPatient(context, {
      provider,
      payment: defaultPayment.payment,
      patient: mappedPatient,
    });

    if (canProviderScheduleForPatientResult.isErr()) {
      logger.error(context, TAG, "error checking if provider can schedule for patient", {
        patientId: patient.patient_id,
        providerId: provider.providerId,
        error: canProviderScheduleForPatientResult.error,
      })

      return err(canProviderScheduleForPatientResult.error)
    }

    if (canProviderScheduleForPatientResult.value.canSchedule == false) {
      logger.debug(context, TAG, "provider can not schedule for this patient", {
        patientId: patient.patient_id,
        providerId: provider.providerId
      })
      return ok({
        ...member,
        schedulingInfo: {
          canSchedule: false,
          errors: canProviderScheduleForPatientResult.value.errors,
        }
      })
    }

    const appointmentDurations = Appointment.Service.getAppointmentDurationsForPayment(context, {
      paymentMethod: defaultPayment,
      isFollowUp: appointmentTypeResult.value === AppointmentType.FollowUp
    })

    const audioSupport: AudioSupport = defaultPayment.type.audioSupport
    return ok({
      ...member,
      schedulingInfo: {
        canSchedule: true,
        patientPaymentMethods: patientPaymentMethods,
        defaultPaymentMethod: defaultPayment,
        validAppointmentDurations: appointmentDurations,
        canScheduleAudioOnly: audioSupport !== 'never' ? {
          canSchedule: true,
          defaultValue: audioSupport === 'default'
        } : {
          canSchedule: false,
        }
      }
    })
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

interface GetPatientProvidersParams {
  patientId: number;
  excludeProviderId?: number;
}

export async function getPatientProviders(context: IContext, { patientId, excludeProviderId }: GetPatientProvidersParams): Promise<Result<ProviderRecord[], ErrCode>> {
  const {logger, store: { reader }} = context
  
  const TAG = [...MTAG, 'getPatientProviders']
  try {
    const pool = await reader();
 
    const patientResult = await Store.selectOnePatient(context, { patientId })

    if (patientResult.isErr()) {
      logger.error(context, TAG, 'patient not found', { patientId })
      return err(ErrCode.NOT_FOUND)
    }

    const patient = patientResult.value

    const paymentMethodResult = await Payment.Service.getDefaultPaymentMethod(context, { patientId })

    if (paymentMethodResult.isErr()) {
      logger.error(context, TAG, 'error getting default payment method', { patientId, error: paymentMethodResult.error })
      return err(paymentMethodResult.error)
    }

    const paymentMethod = paymentMethodResult.value

    const providerIdListResult = await Appointment.Service.getDefaultProviderIdList(context, { patient, payment: paymentMethod.payment })
    if (providerIdListResult.isErr()) {
      logger.error(context, TAG, 'error getting provider id list', { error: providerIdListResult.error })
      return err(providerIdListResult.error)
    }

    const providerIdList = excludeProviderId ? providerIdListResult.value
        .filter(id => id !== excludeProviderId) : providerIdListResult.value

    const providerRecords = await db.select('telenutrition.schedule_provider', {
      provider_id: db.conditions.isIn(providerIdList)
    }).run(pool)

    return ok(providerRecords.map(provider => mapProviderRecord(provider)))
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export default {
  getPatientById,
  hasScheduledAppointment,
  getUserPatients,
  isPatientOwner,
  updatePatientEligibility,
  updateProviderPatientInfo,
  getPatientUser,
  getPatientAppointmentHistory,
  getPatientSchedulingAvailabilityWithProvider,
  getPatientProviders,
  getNextAppointmentType,
}