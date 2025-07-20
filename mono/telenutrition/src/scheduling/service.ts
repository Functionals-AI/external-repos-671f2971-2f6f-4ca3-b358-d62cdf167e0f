import { DbTransaction, IContext } from "@mono/common/lib/context"
import * as db from 'zapatos/db'
import '@mono/common/lib/zapatos/schema'
import * as zs from 'zapatos/schema'
import { ErrCode, ErrCodeError } from "@mono/common/lib/error"
import { err, ok, Result } from "neverthrow"
import { sendAppointmentUpdateEvent } from './sync'
import Appointment from './appointment'
import Patient from './patient'
import Provider from "./provider"
import Store, { DepartmentRecord } from './store'
import { z } from 'zod';

import Events from './events'
import { IdentityAttributes, IdentityRecord } from "../iam/types"
import { ContactSchema } from "./scheduling-flow/schema"
import { UserRecord } from "../iam/user/store"
import Consent from "./consent"
import { ConsentSource } from "./consent/service"
import { insertIdentitySQLFragment, selectIdentity } from "../iam/identity/store"
import { isFullyIdentified } from "../iam/user/service"
import Payment from "./payment"
import { PaymentMethodRecord } from "./payment/store"
import { DateTime } from 'luxon'
import { isAppIdentity, isProviderIdentity } from "../iam/identity/service"
import { AppointmentRecord, BaseAppointmentRecord } from "./appointment/types"
import { PatientRecord, mapPatientRecord } from "./patient/patient-record"
import Zoom, { ZoomMeeting } from "./zoom"
import { getPaymentCoverage } from "./benefits/service"
import { AppointmentCancelReason, buildSchedulingParams, CancelAppointmentOptions, fetchBookableTimeSlots, SchedulingParams } from "./appointment/service"
import _ = require("lodash")
import { mapProviderRecord } from "./provider/store"
import { ProviderRecord } from "./provider/shared"
import { v4 as uuidv4 } from 'uuid'
import { shortenLink } from "@mono/common/lib/shortlink"

type PatientNewRecord = {
  email?: string | undefined;
  address2?: string | undefined;
  city?: string | undefined;
  state: string;
  birthday?: Date | undefined;
  timezone: string;
  sex?: string | undefined;
  firstName?: string | undefined;
  lastName?: string | undefined;
  zipCode?: string | undefined;
  departmentId: number;
  address1?: string | undefined;
  phoneMobile?: string | undefined;
  phoneHome?: string | undefined;
}


const MTAG = [ 'telenutrition', 'scheduling', 'service' ]

export type BookAppointmentOptions = {
  cid: string,
  appointment: {
    appointmentIds: number[],
    appointmentTypeId: number,
  },
  cancelAppointment?: {
    appointmentRecord: AppointmentRecord,
    canceledBy: 'patient' | 'provider',
    cancelReason: AppointmentCancelReason,
  },
  paymentMethodId: number,
  contact?: Partial<z.infer<typeof ContactSchema>>,
  promo?: string,
  patientId: number,
  userConsent?: {
    source: ConsentSource
  }
  identity: IdentityRecord,
  userId?: number
  eventSource?: 'swap' | 'reschedule'
}

type CanBookAppointmentWithPaymentMethodParams = {
  paymentMethod: PaymentMethodRecord,
  rescheduleAppointmentId?: number
} & ({
  appointment: BaseAppointmentRecord
} | {
  startTimestamp: Date
})

export async function hasCoverageWithPaymentMethod(context: IContext, params: CanBookAppointmentWithPaymentMethodParams): Promise<Result<boolean, ErrCode>> {
  const { logger } = context
  const TAG = [...MTAG, 'canBookAppointmentWithPaymentMethod']

  const startDT = 'appointment' in params
    ? DateTime.fromFormat(params.appointment.startDate, 'MM/dd/yyyy')
    : DateTime.fromJSDate(params.startTimestamp)

  const coverageResult = await getPaymentCoverage(context, { 
    paymentMethod: params.paymentMethod,
    rescheduleAppointmentId: params.rescheduleAppointmentId,
    year: startDT.year
  })

  if (coverageResult.isErr()) {
    logger.error(context, TAG, 'error getting payment coverage for method', {
      paymentMethodId: params.paymentMethod.id
    })
    return err(coverageResult.error)
  }
  const { remaining } = coverageResult.value
  return ok(remaining === undefined || remaining > 0)
}

// TODO: move to Store?
export type RankedProviderSlot = {
  provider: ProviderRecord,
  appointmentIds: number[],
  startTimestamp: Date,
  previouslyBooked: boolean,
  isW2: boolean,
  capacity: number,
  score: number
}
export async function fetchAvailableProviderSlotsForBooking(
  context: IContext,
  params: {
    schedulingParams: SchedulingParams;
    startTimestamp: Date;
    duration: number;
    patientId?: number;
    timezone?: string;
    ignoreDateRestrictions?: boolean;
  },
): Promise<Result<RankedProviderSlot[], ErrCode>> {
  const {
    logger,
    store: { reader },
  } = context;
  const TAG = [...MTAG, 'service.fetchAvailableProvidersForBooking'];

  const { providerIds, timestampQuery } = params.schedulingParams;

  logger.debug(context, TAG, `Fetching availble providers for booking`, {
    startTimestamp: params.startTimestamp,
    duration: params.duration,
    providerIds,
    ignoreDateRestrictions: params.ignoreDateRestrictions
  })

  if (!isValidDuration(params.duration)) {
    logger.error(context, TAG, 'Invalid duration', { duration: params.duration });
    return err(ErrCode.ARGUMENT_ERROR)
  }

  const startDT = DateTime.fromJSDate(params.startTimestamp);
  if (params.duration === 60 && startDT.minute !== 0) {
    logger.error(context, TAG, '60 minute slots can only be booked at the top of the hour');
    return err(ErrCode.STATE_VIOLATION);
  }

  if (providerIds.length === 0) {
    return ok([]);
  }

  try {
    const pool = await reader();
    const openAppointmentSlots = await db.select('telenutrition.schedule_appointment', {
      status: 'o',
      frozen: false,
      provider_id: db.conditions.isIn(providerIds),
      start_timestamp: db.conditions.and(
        params.duration === 60
          ? db.conditions.isIn([startDT.toJSDate(), startDT.plus({ minutes: 30 }).toJSDate()])
          : db.conditions.eq(startDT.toJSDate()),
        ...(params.ignoreDateRestrictions ? [] : [ timestampQuery ])
      ),
    }, {
      extras: {
        appointmentIds: db.sql`ARRAY_AGG(${'appointment_id'} ORDER BY ${'start_timestamp'} ASC)`,
        startTimestamp: db.sql`MIN(${'start_timestamp'})`,
      },
      columns: ['provider_id'],
      groupBy: ['provider_id'],
      having: params.duration === 60 ? db.sql`COUNT(DISTINCT ${"start_timestamp"}) = 2` : undefined
    }).run(pool);

    logger.debug(context, TAG, `Found ${openAppointmentSlots.length} open provider slots`, {
      openAppointmentSlots
    })

    const foundProviderIds = openAppointmentSlots.map((slot) => slot.provider_id!);
    const [providers, availability, previousProviders] = await Promise.all([
      db.select('telenutrition.schedule_provider', {
        provider_id: db.conditions.isIn(foundProviderIds),
      }, {
        lateral: {
          employee: db.selectOne('common.employee', {
            employee_id: db.parent('employee_id'),
          }),
        },
      }).run(pool),
      db.select('telenutrition.schedule_appointment', {
        status: 'o',
        frozen: false,
        provider_id: db.conditions.isIn(foundProviderIds),
        start_timestamp: db.conditions.between(startDT.toJSDate(), startDT.plus({ days: 30 }).toJSDate()),
      }, {
        extras: {
          availability: db.sql<any, number>`count(*)`,
        },
        columns: ['provider_id'],
        groupBy: 'provider_id',
      }).run(pool),
      params.patientId ? db.select('telenutrition.schedule_appointment', {
        patient_id: params.patientId,
        provider_id: db.conditions.isIn(foundProviderIds),
      }, {
        columns: ['provider_id'],
        distinct: ['provider_id']
      }).run(pool) : Promise.resolve([])
    ]);

    const previousProviderIds = new Set(previousProviders.map(i => i.provider_id))
    const providerMap = providers.reduce((res, i) => ({ ...res, [i.provider_id]: i }), {})
    const availabilityMap = availability.reduce((res, i) => ({ ...res, [i.provider_id!]: i.availability }), {})

    const rankedSlots: RankedProviderSlot[] = openAppointmentSlots.map(slot => {
      const id = slot.provider_id!
      const previouslyBooked = previousProviderIds.has(id)
      const provider = providerMap[id]
      const employmentType = provider?.employee?.employment_type
      const isW2 = employmentType && ['salaried_ft', 'salaried_pt'].includes(employmentType);
      const capacity = availabilityMap[id] ?? 1;
      const score = (previouslyBooked ? 0 : 2) + (isW2 ? 0 : 1) + (1 / Math.floor((capacity / 20) + 1));

      return {
        provider: mapProviderRecord(provider),
        appointmentIds: slot.appointmentIds,
        startTimestamp: DateTime.fromISO(slot.startTimestamp).toJSDate(),
        previouslyBooked,
        isW2,
        capacity,
        score
      }
    })

    return ok (_.sortBy(rankedSlots, (slot) => slot.score, () => Math.random()))
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

type ValidDuration = 30 | 60
function isValidDuration(duration: number): duration is ValidDuration {
  return [30,60].includes(duration)
}

function canBookAppointmentForTimestamp(
  startTimestamp: DateTime<true>,
  schedulingParams: SchedulingParams,
): Result<true, ErrCode> {
  const { bookableRange, nonBookableDates, nonBookableMonths } = schedulingParams
  if (!bookableRange.contains(startTimestamp)) {
    return err(ErrCode.SLOT_OUTSIDE_BOOKABLE_RANGE)
  }
  if (nonBookableDates.includes(startTimestamp.toISODate())) {
    return err(ErrCode.SLOT_NOT_AVAILABLE_FOR_BOOKING)
  }
  if (nonBookableMonths.includes(startTimestamp.startOf('month').toISODate())) {
    return err(ErrCode.VISIT_FREQUENCY_REACHED)
  }
  return ok(true)
}

export async function bookAppointmentByTime(context: IContext, params: Omit<BookAppointmentOptions, 'appointment'> & {
  startTimestamp: Date,
  appointmentTypeId: number,
}): Promise<Result<BaseAppointmentRecord, ErrCode>> {
  const { logger, config } = context

  const TAG = [ ...MTAG, 'service.bookAppointmentByTime' ]

  logger.info(context, TAG, "booking appointment by time", params)

  const { patientId, paymentMethodId, appointmentTypeId, startTimestamp } = params

  const appointmentTypeResult = await Appointment.Store.selectAppointmentType(context, appointmentTypeId)
  if (appointmentTypeResult.isErr()) {
    logger.error(context, TAG, 'error getting appointment type', { error: appointmentTypeResult.error })
    return err(appointmentTypeResult.error)
  }
  const appointmentType = appointmentTypeResult.value

  const schedulingParamsResult = await buildSchedulingParams(context, {
    patientId,
    paymentMethodId
  })
  if (schedulingParamsResult.isErr()) {
    logger.error(context, TAG, 'error getting booking config', { error: schedulingParamsResult.error })
    return err(schedulingParamsResult.error)
  }
  const schedulingParams = schedulingParamsResult.value
  const { patient, paymentMethod, validAppointmentDurations } = schedulingParams

  if (!isValidDuration(appointmentType.duration) || !validAppointmentDurations.includes(appointmentType.duration)) {
    logger.error(context, TAG, "invalid appointment duration for booking", {
      appointmentTypeId,
      duration: appointmentType.duration,
      validAppointmentDurations
    })
    return err(ErrCode.ARGUMENT_ERROR)
  }

  if (!patient.identityId) {
    logger.error(context, TAG, 'cannot schedule appointment for patient without identity', { patientId })
    return err(ErrCode.STATE_VIOLATION)
  }

  const startDT = DateTime.fromJSDate(startTimestamp)
  if (!startDT.isValid) {
    logger.error(context, TAG, 'invalid appointment startTime', { timestamp: startTimestamp })
    return err(ErrCode.ARGUMENT_ERROR)
  }

  const canBookForTimestampResult = canBookAppointmentForTimestamp(startDT, schedulingParams)
  if (canBookForTimestampResult.isErr()) {
    logger.error(context, TAG, 'attempt to book for unbookable date (by time)', {
      error: canBookForTimestampResult.error,
      patientId: patient.patientId,
      startTimestamp: params.startTimestamp
    });
    return err(canBookForTimestampResult.error)
  }

  const hasCoverageResult = await hasCoverageWithPaymentMethod(context, {
    startTimestamp,
    paymentMethod
  })

  if (hasCoverageResult.isErr()) {
    logger.debug(context, TAG, "error checking coverage for book appointment attempt", {
      ...params,
      error: hasCoverageResult.error
    })
    return err(hasCoverageResult.error)
  }

  if (!hasCoverageResult.value) {
    logger.debug(context, TAG, "payment limit reached for book appointment attempt", params)
    return err(ErrCode.PAYMENT_LIMIT_REACHED)
  }

  if (params.userConsent) {
    const insertPatientProviderConsentResult = await Consent.Service.insertPatientProviderConsent(context, {
      identityId: patient.identityId,
      consentSource: params.userConsent.source,
    })
    if (insertPatientProviderConsentResult.isErr()) {
      logger.error(context, TAG, 'error updating patient provider consent', { error: insertPatientProviderConsentResult.error })
      return err(insertPatientProviderConsentResult.error)
    }
  }

  // Try and find an eligble provider to book with
  const availableProvidersResult = await fetchAvailableProviderSlotsForBooking(context, {
    schedulingParams,
    startTimestamp,
    duration: appointmentType.duration,
    patientId
  })

  if (availableProvidersResult.isErr()) {
    logger.error(context, TAG, 'error getting available providers for booking', { error: availableProvidersResult.error })
    return err(availableProvidersResult.error)
  }

  let bookResult: Result<BaseAppointmentRecord, ErrCode>
  let zoomMeeting: ZoomMeeting | undefined
  const availableSlots = availableProvidersResult.value

  logger.debug(context, TAG, `Found ${availableSlots.length} available slots for booking`)

  if (availableSlots.length > 0) {
    const slot = availableSlots[0]
    const bookAppointmentId = slot.appointmentIds[0]

    if (slot.provider === null) {
      logger.error(context, TAG, 'bookkable slot does not have a provider id', { bookAppointmentId })
      return err(ErrCode.SERVICE)
    }

    const zoomMeetingResult = await Zoom.createMeeting(context, {
      appointmentId: slot.appointmentIds[0],
      providerId: slot.provider.providerId,
      patientId: patient.patientId,
      startTimestamp: slot.startTimestamp,
      duration: appointmentType.duration,
    })

    if (zoomMeetingResult.isErr()) {
      logger.error(context, TAG, "unable to create zoom meeting for appointment", { error: zoomMeetingResult.error })
      return err(ErrCode.SERVICE)
    }

    zoomMeeting = zoomMeetingResult.value
    bookResult = await Appointment.Store.bookAppointment(context, {
      appointmentId: bookAppointmentId,
      appointmentTypeId: appointmentType.appointmentTypeId,
      patientId: patient.patientId,
      paymentMethodId: paymentMethod.id,
      scheduledBy: params.identity,
      zoomMeeting
    })
  } else {
    // If no providers are availabile, check if it is eligible to be overbooked
    const overbookingResult = await fetchBookableTimeSlots(context, {
      schedulingParams,
      startTimestamp,
      duration: appointmentType.duration,
      overbookingBuffer: true
    })
    if (overbookingResult.isErr()) {
      logger.error(context, TAG, 'error checking overbook slots', { error: overbookingResult.error })
      return err(ErrCode.SERVICE)
    }
    if (overbookingResult.value.length === 0) {
      // Not eligible for overbooking
      logger.debug(context, TAG, "slot not available for overbooking")
      return err(ErrCode.SLOT_NOT_AVAILABLE_FOR_BOOKING)
    }

    let waitingLinkResult = await createWaitingLink(context, startTimestamp)
    if (waitingLinkResult.isErr()) {
      logger.error(context, TAG, 'error creating overbook meeting shortlink', { error: waitingLinkResult.error })
      return err(ErrCode.SERVICE)
    }
    const {
      id: waitingId,
      url: meetingLink
    } = waitingLinkResult.value

    // Create a new overbooked slot
    bookResult = await Appointment.Store.createOverbookedSlot(context, {
      startTimestamp,
      appointmentTypeId,
      patientId,
      paymentMethodId,
      scheduledBy: params.identity,
      waitingId,
      meetingLink
    })
  }

  if (bookResult.isErr()) {
    logger.debug(context, TAG, "error booking appointment by time", { error: bookResult.error })
    return err(bookResult.error)
  }

  const appointmentBooked = bookResult.value

  await Promise.all([
    sendAppointmentUpdateEvent(context, appointmentBooked, true, {
      eventSource: params.eventSource,
      paymentMethod,
      zoomMeeting,
    }),
    Payment.Service.createPaymentTransaction(context, {
      patientId: paymentMethod.patientId,
      paymentMethodId: paymentMethod.id,
      appointmentId: appointmentBooked.appointmentId,
    }),
    Events.publishBookAppointmentEvent(context, {
      cid: params.cid,
      uid: params.userId,
      identity: params.identity,
      appointment: appointmentBooked,
      payment: paymentMethod.payment,
      promo: params.promo,
    }),
  ]);

  logger.info(context, TAG, 'booked appointment by time', { params, appointmentBooked })
  return ok(appointmentBooked)
}

export async function createWaitingLink(context: IContext, startTimestamp: Date, code?: string): Promise<Result<{ id: string, url: string }, ErrCode>> {
  const { logger, config } = context
  const TAG = [...MTAG, "createWaitingLink"]
  const waitingId = uuidv4()
  const url = `${config.telenutrition_web.baseUrl}/join/${waitingId}`

  let meetingLink: string
  if (config.isDevenv) {
    meetingLink = url
  } else {
    const shortLinkResult = await shortenLink(context, url, {
      expires: DateTime.fromJSDate(startTimestamp).diffNow().plus({ days: 2 }),
      length: 16,
      code
    })

    if (shortLinkResult.isErr()) {
      logger.error(context, TAG, 'error creating shortlink', { error: shortLinkResult.error })
      return err(ErrCode.SERVICE)
    }
    meetingLink = shortLinkResult.value.url
  }
  return ok({
    id: waitingId,
    url: meetingLink
  })
}

export async function bookAppointment(context: IContext, options: BookAppointmentOptions): Promise<Result<BaseAppointmentRecord, ErrCode>> {
  const { logger, store: { writer } } = context
  const TAG = [ ...MTAG, 'service.bookAppointment' ]

  const userId = isAppIdentity(options.identity) ? options.identity.uid : options.userId

  if (userId) {
    const isOwnerResult = await Patient.Service.isPatientOwner(context, { userId, patientId: options.patientId })
    if (isOwnerResult.isErr()) {
      logger.error(context, TAG, `error checking patient ownership`, { error: isOwnerResult.error })
      return err(isOwnerResult.error)
    }
    if (!isOwnerResult.value) {
      logger.error(context, TAG, `attempt to book appointment for patient not owned by user`, { userId, patientId: options.patientId })
      return err(ErrCode.FORBIDDEN)
    }
  }

  const appointmentId = options.appointment.appointmentIds[0]
  if (appointmentId < 0) {
    const startTimestamp = new Date(-appointmentId)
    return bookAppointmentByTime(context, {
      ...options,
      startTimestamp,
      appointmentTypeId: options.appointment.appointmentTypeId,
    })
  }

  try {
    const pool = await writer()

    // 1. VALIDATION
    logger.info(context, TAG, `appointment ids`, { appointmentIds: options.appointment.appointmentIds })

    const appointments: BaseAppointmentRecord[] = []
    const results = await Promise.all(options.appointment.appointmentIds.map(appointmentId => Appointment.Store.selectAppointmentById(context, appointmentId)))

    for (const [index, result] of results.entries()) {
      if (result.isErr()) {
        // secondary appointment slots are removed after a booking
        if (result.error === ErrCode.NOT_FOUND) {
          logger.info(context, TAG, `Failed to get the appointment from the athena api`, { appointmentId: options.appointment.appointmentIds[index] })
          return err(ErrCode.STATE_VIOLATION)
        }
        logger.error(context, TAG, `Failed to get the appointment from the athena api`, { appointmentId: options.appointment.appointmentIds[index] })
        return err(result.error)
      }

      appointments.push(result.value)
    }

    if (appointments.length !== options.appointment.appointmentIds.length) {
      logger.error(context, TAG, `appointmentId not found in athena`, { appointmentIds: options.appointment.appointmentIds })
      return err(ErrCode.NOT_FOUND)
    }

    const providerId = appointments[0].providerId

    if (providerId === undefined) {
      logger.error(context, TAG, 'Appointment slot must have a provider id', { appointment: appointments[0] })
      return err(ErrCode.STATE_VIOLATION)
    }
    for (const appointment of appointments) {
      if (appointment.status !== 'o' || appointment.frozen) {
        logger.error(context, TAG, 'At least one appointment status is not open or appointment is frozen', {appointment})
        return err(ErrCode.SLOT_NOT_AVAILABLE_FOR_BOOKING)
      }
      if (appointment.providerId !== providerId) {
        logger.error(context, TAG, 'appointment slots do not all belong to the same provider', {appointment})
        return err(ErrCode.STATE_VIOLATION)
      }
    }

    const appointmentType = await db.selectOne('telenutrition.schedule_appointment_type', { appointment_type_id: options.appointment.appointmentTypeId }).run(pool)

    if (appointmentType === undefined) {
      logger.error(context, TAG, `appointmentTypeId not found in database`, { appointmentTypeId: options.appointment.appointmentTypeId })
      return err(ErrCode.NOT_FOUND)
    }

    let ignoreDateRestrictions = false
    if (isProviderIdentity(options.identity)) {
      const providerResult = await Provider.Service.getProvider(context, { oktaId: options.identity.fid })
      if (providerResult.isErr()) {
        logger.error(context, TAG, 'unable to fetch provider', { identity: options.identity, error: providerResult.error })
        return err(ErrCode.SERVICE)
      }
      // Ignore restrictions if provider is self-scheduling
      ignoreDateRestrictions = providerResult.value.providerId === providerId
    }

    const schedulingParamsResult = await buildSchedulingParams(context, {
      patientId: options.patientId,
      paymentMethodId: options.paymentMethodId,
      providerIds: [providerId],
      noLeadTime: ignoreDateRestrictions,
      ...(options.cancelAppointment?.appointmentRecord && {
        rescheduleForAppointment: options.cancelAppointment.appointmentRecord
      })
    })
    if (schedulingParamsResult.isErr()) {
      logger.error(context, TAG, 'error getting booking config', { error: schedulingParamsResult.error })
      return err(schedulingParamsResult.error)
    }
    const schedulingParams = schedulingParamsResult.value
    const { patient, paymentMethod, providerIds } = schedulingParams

    if (!providerIds.includes(providerId)) {
      logger.debug(context, TAG, 'provider can not schedule for this patient', {
        patientId: patient.patientId,
        providerId: providerId,
        paymentMethodId: paymentMethod.id
      })
      return err(ErrCode.FORBIDDEN)
    }

    const patientIdentityAttributes: IdentityAttributes = {
      firstName: patient.firstName,
      lastName: patient.lastName,
      birthday: patient.birthday ? new Date(patient.birthday) : undefined,
      zipCode: patient.zipcode,
    }
    if (!isFullyIdentified(patientIdentityAttributes)) {
      logger.error(context, TAG, 'cannot schedule appointment for patient with partial identity', { patientId: options.patientId })
      return err(ErrCode.SERVICE)
    }

    const firstAppointment = _.minBy(appointments, appt => appt.startTimestamp.getTime())!
    const { startTimestamp, appointmentId: bookAppointmentId } = firstAppointment

    const canBookResult = await hasCoverageWithPaymentMethod(context, {
      appointment: firstAppointment,
      paymentMethod
    })

    if (canBookResult.isErr()) {
      logger.error(context, TAG, 'error checking if appointment can be booked with payment method', {
        appointmentId: bookAppointmentId,
        paymentMethodId: paymentMethod.id
      })
      return err(canBookResult.error)
    }

    if (!canBookResult.value) {
      logger.debug(context, TAG, 'Payment method is not valid for booking appointment due to visit limit reached', {
        appointmentId: firstAppointment.appointmentId,
        paymentMethodId: paymentMethod.id
      })
      return err(ErrCode.PAYMENT_LIMIT_REACHED)
    }

    const startDT = DateTime.fromJSDate(startTimestamp)
    if (!startDT.isValid) {
      logger.error(context, TAG, 'invalid appointment startTime', { timestamp: startTimestamp })
      return err(ErrCode.ARGUMENT_ERROR)
    }

    const canBookForTimestampResult = canBookAppointmentForTimestamp(startDT, schedulingParams)
    if (canBookForTimestampResult.isErr()) {
      logger.error(context, TAG, 'attempt to book for unbookable date', {
        error: canBookForTimestampResult.error,
        startTimestamp,
        appointmentId,
        patientId: patient.patientId,
      });
      return err(canBookForTimestampResult.error)
    }

    const zoomMeetingResult = await Zoom.createMeeting(context, {
      appointmentId: bookAppointmentId,
      providerId: providerId,
      patientId: patient.patientId,
      startTimestamp: startTimestamp,
      duration: appointmentType.duration,
    })

    let zoomMeeting: ZoomMeeting
    if (zoomMeetingResult.isErr()) {
      // Create a placeholder zoom meeting for Double Booking Pilot, this appointment should be cancelled and rescheduled with an active provider
      if (zoomMeetingResult.error === ErrCode.NOT_FOUND) {
        logger.error(context, TAG, "provider not found for appointment", { providerId })
        zoomMeeting = {
          id: 0,
          joinUrl: 'https://support.foodsmart.co/hc/en-us',
          shortJoinUrl: 'https://support.foodsmart.co/hc/en-us',
        }
      }
      logger.error(context, TAG, "unable to create zoom meeting for appointment", { error: zoomMeetingResult.error })
      return err(ErrCode.SERVICE)
    } else {
      zoomMeeting = zoomMeetingResult.value
    }

    let cancelAppointmentOptions: CancelAppointmentOptions;
    let cancelAppointmentId: number;
    if(options.cancelAppointment) {
      const oldAppointment = options.cancelAppointment.appointmentRecord;
      const canceledByParam = options.cancelAppointment.canceledBy;
      const cancelReasonParam = options.cancelAppointment.cancelReason;
      const eventSource = options.eventSource;
      const identity = options.identity;
      
      const cancelReason: AppointmentCancelReason =
        DateTime.fromJSDate(oldAppointment.startTimestamp) < DateTime.now() ?
        'LAST_MINUTE_CANCELLATION' : cancelReasonParam;
      
      cancelAppointmentOptions = {
        cancelReason,
        canceledBy: canceledByParam,
        eventSource,
        identity
      };
      const cancelAppointmentChecks = await Appointment.Service.runCancelAppointmentChecks(context, cancelAppointmentOptions, oldAppointment);
      if(cancelAppointmentChecks.isErr()) {
        logger.error(context, TAG, 'Error running checks for cancelAppointment.', {
          error: cancelAppointmentChecks.error,
        })
  
        throw cancelAppointmentChecks.error;
      }
      
      const {cancelReasonId, patientId} = cancelAppointmentChecks.value;
      cancelAppointmentOptions.patientId = patientId;
      cancelAppointmentOptions.cancelReasonId = cancelReasonId;
      cancelAppointmentId = oldAppointment.appointmentId;
    }

    const appointmentBookedResult: BaseAppointmentRecord = await db.serializable(pool, async (dbTxn) => {
      const updatePatientResult = await updatePatient(context, {
        patientId: options.patientId,
        userId,
        newProviderConsent: options.userConsent ? { consented_at: new Date(), source: options.userConsent.source } : undefined
      }, dbTxn);

      if (updatePatientResult.isErr()) {
        logger.error(context, TAG, `error updating patient contact info`, { error: updatePatientResult.error })
        throw updatePatientResult.error
      }

      if(cancelAppointmentOptions) {
        const cancelAppointmentResult = await Appointment.Service.performCancelAppointment(context, cancelAppointmentOptions, cancelAppointmentId, dbTxn);
  
        if (cancelAppointmentResult.isErr()) {
          throw ErrCode.SERVICE;
        }
      }

      const bookResult = await Appointment.Store.bookAppointment(context, {
        appointmentId: bookAppointmentId,
        appointmentTypeId: appointmentType.appointment_type_id,
        patientId: patient.patientId,
        paymentMethodId: options.paymentMethodId,
        scheduledBy: options.identity,
        zoomMeeting
      }, dbTxn)
  
      if (bookResult.isErr()) {
        logger.error(context, TAG, "error booking appointment", { error: bookResult.error })
        throw bookResult.error;
      }

      const appointmentBooked = bookResult.value
  
      const createPaymentResult = await Payment.Service.createPaymentTransaction(context, {
        patientId: paymentMethod.patientId,
        paymentMethodId: paymentMethod.id,
        appointmentId: appointmentBooked.appointmentId
      }, dbTxn)
      if (createPaymentResult.isErr()) {
        logger.error(context, TAG, 'error creating payment transaction during book appointment');
        throw new ErrCodeError(ErrCode.SERVICE)
      }
      logger.debug(context, TAG, 'created payment transaction during book appointment');
  
      return appointmentBooked;
    });

    await Promise.all([
      await sendAppointmentUpdateEvent(context, appointmentBookedResult, true, {
        eventSource: options.eventSource,
        paymentMethod,
        zoomMeeting
      }),
      await Events.publishBookAppointmentEvent(context, {
        cid: options.cid,
        uid: userId,
        identity: options.identity,
        appointment: appointmentBookedResult,
        payment: paymentMethod.payment,
        promo: options.promo,
      })
    ]);

    return ok(appointmentBookedResult)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

type IdentityFields = ({ identityId: number } | Required<IdentityAttributes>)
type CreatePatientRecord = Partial<Pick<PatientNewRecord, 'timezone'>> &
  Omit<PatientNewRecord, keyof IdentityAttributes | 'departmentId' | 'timezone'> &
  IdentityFields

async function createPatientFromUser(context: IContext, user: UserRecord, patientData: Omit<CreatePatientRecord, keyof IdentityFields>): Promise<Result<PatientRecord, ErrCode>> {
  const { logger } = context

  if (!user.identityId) {
    logger.error(context, 'service.createPatientFromUser', `missing user identity`, { userId: user.userId })
    return err(ErrCode.ARGUMENT_ERROR)
  }

  return createPatient(context, {
    email: user.email,
    phoneMobile: user.phone,
    identityId: user.identityId,
    ...patientData
  }, user.userId)
}

async function createPatient(context: IContext, patient: CreatePatientRecord, userId: number): Promise<Result<PatientRecord, ErrCode>> {
  const TAG = [ ...MTAG, 'createPatient' ]
  const { logger, store: { writer } } = context

  const selectedIdentityResult = await selectIdentity(context, patient)
  let identityFields: IdentityAttributes
  if (selectedIdentityResult.isOk()) {
    const selectedIdentity = selectedIdentityResult.value
    if ((selectedIdentity.userId !== undefined  && selectedIdentity.userId !== userId) || selectedIdentity.patientId !== undefined) {
      logger.debug(context, TAG, 'Trying to create patient with identity that is already in use', { identityId: selectedIdentity.identityId })
      return err(ErrCode.STATE_VIOLATION)
    } else if (selectedIdentity.eligibleId !== undefined && !('identityId' in patient)) {
      // If we find an eligible identity match, but no identityId was specified, it is likely that
      // we have not done an eligibility challenge yet. The caller of this method should
      // explicitly specify the identityId that was used for verification.
      logger.error(context, TAG, 'Unexpected eligible patient identity found', { identityId: selectedIdentity.identityId })
      return err(ErrCode.STATE_VIOLATION)
    } else {
      patient = {
        ...patient,
        identityId: selectedIdentity.identityId
      }
      identityFields = selectedIdentity
    }
  } else if (selectedIdentityResult.error !== ErrCode.NOT_FOUND) {
    logger.error(context, TAG, 'Error selecting identity')
    return err(ErrCode.SERVICE)
  } else if (isFullyIdentified(patient)) {
    identityFields = patient
  } else {
    logger.error(context, TAG, 'new patient is not fully identified', { userId, identityId: patient.identityId })
    return err(ErrCode.SERVICE)
  }

  try {
    const pool = await writer()

    // default home to mobile if missing
    if (patient.phoneHome === undefined) {
      patient.phoneHome = patient.phoneMobile
    }

    const state = patient.state
    const deptResult = await lookupDepartment(context, {state})
    if (deptResult.isErr()) {
      logger.error(context, TAG, `failed to lookup department for patient`, {state})
      return err(deptResult.error)
    }
    const dept = deptResult.value
    const newPatientRecord: PatientNewRecord & { patientId?: number } = {
      ...patient,
      ...identityFields,
      departmentId: dept.departmentId,
      timezone: patient.timezone || dept.timezone
    }

    const patientRecord = newPatientRecord

    if (patientRecord.patientId) {
      const record = await db.selectOne('telenutrition.schedule_patient', {
        patient_id: patientRecord.patientId
      }, {
        lateral: {
          owners: db.select(
            'telenutrition.schedule_user_patient',
            { patient_id: db.parent('patient_id') },
            { columns: ['user_id']}
          ),
        },
      }).run(pool)

      if (record !== undefined && !record.owners.some(owner => owner.user_id == userId)) {
        logger.warn(context, TAG, 'This patient is already owned by another user', {record, userId})
        return err(ErrCode.STATE_VIOLATION)
      }

      if (record?.identity_id) {
        const lastProviderConsentResult = await Consent.Service.getLastProviderConsent(context, { identityId: record.identity_id })
        if (lastProviderConsentResult.isErr()) {
          return err(ErrCode.STATE_VIOLATION)
        }
      }
    }

    const newPatient = await db.serializable(pool, async (pgclient) => {

      const existingPatient = patientRecord.patientId ? await db.selectOne(
        'telenutrition.schedule_patient',
        { patient_id: patientRecord.patientId }
      ).run(pgclient) : undefined

      let identityId: number
      if ('identityId' in patient) {
        identityId = patient.identityId
      } else if (existingPatient == null || existingPatient.identity_id == null) {
        const insertedIdentities = await insertIdentitySQLFragment({
          first_name: patientRecord.firstName,
          last_name: patientRecord.lastName,
          zip_code: patientRecord.zipCode,
          birthday: patientRecord.birthday
        }).run(pgclient)

        if (insertedIdentities.length === 1) {
          identityId = insertedIdentities[0].identity_id
        }
        else {
          logger.error(context, TAG, `Identity creation error.`, {
            patientRecord,
          })

          throw new ErrCodeError(ErrCode.STATE_VIOLATION)
        }
      } else {
        identityId = existingPatient.identity_id
      }

      // Create local patient record
      const insertable: zs.telenutrition.schedule_patient.Insertable = {
        ...(patientRecord.patientId && { patient_id: patientRecord.patientId }),
        identity_id: identityId,
        department_id: patientRecord.departmentId,
        state: patientRecord.state,
        phone: (patientRecord.phoneMobile || patientRecord.phoneHome),
        email: patientRecord.email,
        sex: patientRecord.sex,
        address: patientRecord.address1,
        address2: patientRecord.address2,
        city: patientRecord.city,
        timezone: newPatientRecord.timezone,
      }

      const upsertedPatient = await db.upsert("telenutrition.schedule_patient", insertable, 'patient_id').run(pgclient)

      // Add user/patient mapping
      await db.upsert("telenutrition.schedule_user_patient", {
        user_id: userId,
        patient_id: upsertedPatient.patient_id
      }, 'patient_id').run(pgclient)

      return upsertedPatient
    })


    if (selectedIdentityResult.isOk()) {
      const { eligibleId, accountId } = selectedIdentityResult.value
      await Payment.Service.createDefaultPaymentForPatient(context, {
        patientId: newPatient.patient_id,
        eligibleId,
        accountId
      })
    }

    return ok(mapPatientRecord(newPatient))

  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}


interface UpdatePatientParameters {
  newProviderConsent?: {
    consented_at: Date;
    source: ConsentSource
  }
  patientId: number;
  userId?: number;
}

export async function updatePatient(context: IContext, parameters: UpdatePatientParameters, dbTxn: DbTransaction): Promise<Result<boolean, ErrCode>> {
  const { logger } = context
  const TAG = [ ...MTAG, 'updatePatient' ]

  try {
    const record = await db.selectOne('telenutrition.schedule_patient', {
      patient_id: parameters.patientId
    }, {
      lateral: {
        owner: db.selectOne(
          'telenutrition.schedule_user_patient',
          { patient_id: db.parent('patient_id') },
          { columns: ['user_id']}
        ),
        identity: db.selectOne(
          'telenutrition.iam_identity',
          { identity_id: db.parent('identity_id') }
        ),
      },
    }).run(dbTxn)

    if (record === undefined || (parameters.userId && record.owner?.user_id !== parameters.userId)) {
      logger.error(context, TAG, 'patient undefined or there is not an owner for the patient', { patient: record })
      return err(ErrCode.STATE_VIOLATION)
    }

    if (parameters.newProviderConsent) {
      if (!record.identity_id) {
        logger.error(context, TAG, 'Error trying to insert patient provider consent, no identity_id on record', { record })
      } else {
        const insertPatientProviderConsentResult = await Consent.Service.insertPatientProviderConsent(context, {
          identityId: record.identity_id,
          consentSource: parameters.newProviderConsent.source,
        }, dbTxn)
        
        if (insertPatientProviderConsentResult.isErr()) {
          logger.error(context, TAG, 'error updating patient provider consent', { error: insertPatientProviderConsentResult.error })
          return err(insertPatientProviderConsentResult.error)
        }
      }
    }

    return ok(true)

  } catch (e) {
    logger.exception(context, 'service.updatePatient', e)
    return err(ErrCode.EXCEPTION)
  }
}

export interface ResolveDepartmentParameters {
  state: string,
}

export async function lookupDepartment(context: IContext, parameters: ResolveDepartmentParameters): Promise<Result<DepartmentRecord, ErrCode>> {
  return Store.fetchDepartmentByState(context, parameters.state)
}

export async function getDepartment(context: IContext, departmentId: number): Promise<Result<DepartmentRecord, ErrCode>> {
  const { logger, store: { reader } } = context

  // TODO: add some caching

  try {
    const result = await Store.fetchDepartment(context, departmentId)

    if (result.isErr()) {
      return err(result.error)
    }

    const department = result.value

    return ok(department)
  } catch (e) {
    logger.exception(context, 'service.lookupDepartment', e)
    return err(ErrCode.EXCEPTION)
  }
}

export default {
  Events,
  bookAppointment,
  createPatient,
  createPatientFromUser,
  getDepartment,
  lookupDepartment,
  updatePatient,
}
