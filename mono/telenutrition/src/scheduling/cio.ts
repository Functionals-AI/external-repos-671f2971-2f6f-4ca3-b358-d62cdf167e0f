import { IContext } from "@mono/common/lib/context"
import { ErrCode } from "@mono/common/lib/error"
import { Result, ok, err } from "neverthrow"

import Cio from '@mono/common/lib/integration/customerio'
import { CustomerRecord, EventRecord } from "@mono/common/lib/integration/customerio/service"
import Service from './service'
import Patient from './patient'
import Appointment from './appointment'
import { type PatientRecord } from './patient/store'
import Provider from './provider'
import { ProviderRecord } from "./provider/shared"
import { DateTime } from 'luxon'

const MTAG = [ 'telenutrition', 'scheduling', 'cio' ]
const SUPPORT_PHONE = "+1 (415) 800-2311"

/**
 * Update C.io customer given a patient.
 * 
 * @param context
 * @param patient 
 * @returns 
 */
export async function updateCustomer(context: IContext, patient: PatientRecord): Promise<Result<void, ErrCode>> {
  const { logger } = context
  const TAG = [ ...MTAG, 'updateCustomer' ]
  try {
    const identityId = patient.identityId
    const identifier = `id:${identityId}`

    const customer: CustomerRecord = {
      id: identifier,
      firstname: patient.firstName,
      lastname: patient.lastName,
      ...(patient.email && { email: patient.email }),
      ...(patient.phone && { phone: patient.phone }),
      ...(patient.timezone && { timezone: patient.timezone }),
    }

    const result = await Cio.Service.updateCustomer(context, identifier, customer)

    if (result.isErr()) {
      logger.error(context, TAG, `failed to update customer.`, { customer, })

      return err(result.error)
    }

    return ok(undefined)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export type CioEventType = 
  'appointment_cancellation' |
  'appointment_confirmation' |
  'appointment_reminder' |
  'appointment_update'

export interface SendCioEventOptions {
    type: CioEventType;
    patientId: number;
    providerId?: number;
    appointmentId: number;
    appointmentTypeId: number;
    appointmentTimestamp: Date;
    appointmentDuration: number;
    cancelReasonId?: number;
    rescheduledAppointmentId?: number;
    cancelUrl?: string;
    canceledBy?: string;
    athenaPackageId?: number;
    employer?: string;
    specialProgram?: string;
    zoomPhone?: string;
    zoomShortLink?: string;
    zoomLink?: string;
    isReschedule?: boolean;
    isSwap?: boolean;
}

export async function sendCioEvent(context: IContext, options: SendCioEventOptions): Promise<Result<void, ErrCode>> {
    const TAG = 'service.message.sendCioEvent'
    const { logger } = context

    try {
        const { appointmentId, appointmentTypeId, appointmentTimestamp, appointmentDuration, providerId } = options

        // Get the patient's user record from the database which contains the identity ID.
        const patientResult = await Patient.Service.getPatientById(context, {patientId: options.patientId})

        if (patientResult.isErr()) {
            logger.error(context, TAG, 'Could not find patient ID, needed for CIO identity', {patientId: options.patientId})
            return err(ErrCode.NOT_FOUND)
        }

        const patient = patientResult.value

        let provider: ProviderRecord | undefined

        if (providerId) {
            const providerResult = await Provider.Service.getProviderByProviderId(context, { providerId })
            if (providerResult.isErr()) {
                logger.error(context, TAG, 'error fetching provider', { error: providerResult.error })
                return err(providerResult.error)
            }
            provider = providerResult.value
        }

        const timezone = patient.timezone
        const appointmentDate = DateTime.fromJSDate(appointmentTimestamp).setZone(timezone)
        const appointmentEndDate = appointmentDate.plus({ minutes: appointmentDuration })

        let appointmentDateText = appointmentDate.toFormat('MM/dd/yyyy hh:mma ZZZZ')
        let appointmentEndDateText = appointmentEndDate.toFormat('MM/dd/yyyy hh:mma ZZZZ')

        const providerName = provider?.name ?? "Foodsmart"

        const identifier = `id:${patient.identityId}`

        const customer: CustomerRecord = {
            id: identifier,
            firstname: patient.firstName,
            lastname: patient.lastName,
            appointment_date: appointmentDate.toJSDate(),
            ...(patient.email && { email: patient.email }),
            ...(patient.phone && { phone: patient.phone }),
            ...(patient.timezone && { timezone: patient.timezone }),
        }

        // Unique UID for each appointment
        const uid = `${appointmentId}@foodsmart.com`;

        // Formatting dates for the ICS file directly with the timezone
        const dtStart = appointmentDate.toFormat('yyyyMMdd\'T\'HHmmss');
        const dtEnd = appointmentEndDate.toFormat('yyyyMMdd\'T\'HHmmss');

        const appointmentTypesResult = await Appointment.Service.getAppointmentTypes(context, { ids: [appointmentTypeId] });
        if (appointmentTypesResult.isErr()) {
            logger.error(context, TAG, 'could not get appointment types', { error: appointmentTypesResult.error })
            return err(appointmentTypesResult.error)
        }
        const isAudioOnly = appointmentTypesResult.value[0]?.is_audio_only == true
        let { location, title, message } = getInviteData({
            providerName,
            // providerPhone: options.zoomPhone,
            patientPhone: customer.phone,
            isAudioOnly,
            zoomLink: options.zoomShortLink,
        })

        if (options.type === 'appointment_update') {
            title = `*Updated* ${title}`
        }
        const footerTemplate = (html: boolean) => {
            const actions: string[] = [`call ${SUPPORT_PHONE}`]
            if (options.cancelUrl) {
                actions.unshift(html ? `<a href="${options.cancelUrl}">click here</a>` : `visit ${options.cancelUrl}`)
            }
            return `If you need to cancel or reschedule your visit, please ${actions.join(' or ')}.`
        }
        const supportsHtmlDescription = customer.email?.endsWith("@gmail.com") === true
        const description = `${message}\n\n${footerTemplate(supportsHtmlDescription)}`.replace(/\n/g, "\\n")
        const invite = String.raw`
BEGIN:VCALENDAR
PRODID:-//Foodsmart//Nutrition Visit//EN
VERSION:2.0
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VTIMEZONE
TZID:${timezone}
BEGIN:STANDARD
DTSTART:16010101T020000
TZOFFSETFROM:-0500
TZOFFSETTO:-0600
RRULE:FREQ=YEARLY;INTERVAL=1;BYDAY=1SU;BYMONTH=11
END:STANDARD
BEGIN:DAYLIGHT
DTSTART:16010101T020000
TZOFFSETFROM:-0600
TZOFFSETTO:-0500
RRULE:FREQ=YEARLY;INTERVAL=1;BYDAY=2SU;BYMONTH=3
END:DAYLIGHT
END:VTIMEZONE
BEGIN:VEVENT
ORGANIZER;CN="${providerName}":mailto:${provider?.email}
UID:${uid}
ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${customer.firstname} ${customer.lastname};X-NUM-GUESTS=0:mailto:${customer.email}
DESCRIPTION:${description}
DTSTART;TZID=${timezone}:${dtStart}
DTEND;TZID=${timezone}:${dtEnd}
PRIORITY:5
DTSTAMP:${DateTime.now().toUTC().toFormat('yyyyMMdd\'T\'HHmmss\'Z\'')}
LOCATION:${location}
TRANSP:OPAQUE
SEQUENCE:0
STATUS:CONFIRMED
SUMMARY:${title}
BEGIN:VALARM
DESCRIPTION:REMINDER
TRIGGER;RELATED=START:-PT15M
ACTION:DISPLAY
END:VALARM
END:VEVENT
END:VCALENDAR`;

        const event: EventRecord = {
            name: options.type,
            data: {
                appointment_id: appointmentId,
                appointment_type_id: appointmentTypeId,
                appointment_date: appointmentDate.toUnixInteger(),
                appointment_datetext: appointmentDateText,
                appointment_end_date: appointmentEndDate.toUnixInteger(),
                appointment_end_datetext: appointmentEndDateText,
                provider_name: providerName,
                timezone,
                ...(options.cancelReasonId && { cancel_reason_id: options.cancelReasonId }),
                ...(options.canceledBy && { canceled_by: options.canceledBy }),
                ...(options.rescheduledAppointmentId && { rescheduled_appointment_id: options.rescheduledAppointmentId }),
                ...(options.cancelUrl && { cancel_url: options.cancelUrl }),
                ...(options.athenaPackageId !== undefined && { athena_package_id: options.athenaPackageId }),
                ...(options.employer && { employer: options.employer }),
                ...(options.specialProgram && { special_program: options.specialProgram }),
                ...(patient.sex && { patient_sex: patient.sex }),
                ...(patient.state && { patient_state: patient.state }),
                ...(options.zoomPhone && { zoom_phone: options.zoomPhone }),
                ...(options.zoomLink && { zoom_link: options.zoomLink }),
                ...(options.zoomShortLink && { zoom_short_link: options.zoomShortLink }),
                ...(options.isReschedule && { is_reschedule: options.isReschedule }),
                ...(options.isSwap && { is_swap: options.isSwap }),
                attachments: {
                    'invite.ics': Buffer.from(invite.trim()).toString('base64')
                },
            }
        }

        logger.info(context, TAG, `sending appointment confirmation event`, {identifier, options, patient, customer, event})

        const result = await Cio.Service.sendEvent(context, identifier, {customer, event})

        if (result.isErr()) {
            logger.error(context, TAG, `failed to send CIO event`, {customer, event})
        }

        return ok(undefined)
    } catch (e) {
        logger.exception(context, TAG, e, options)

        return err(ErrCode.EXCEPTION)
    }
}

type InviteData = {
    title: string,
    location: string,
    message: string,
}
function getInviteData(params: {
    providerName: string,
    providerPhone?: string,
    patientPhone?: string,
    isAudioOnly: boolean,
    zoomLink?: string
}): InviteData {
    const { providerName, providerPhone, patientPhone, isAudioOnly, zoomLink } = params

    // TODO
    // [If have incentive]: Make sure you attend your visit so you don’t miss out on $[x] in grocery money!

    if (isAudioOnly) {
        let message = `Your phone call with ${providerName} is confirmed.\n\nYour dietitian will call you the day of the visit`
        if (providerPhone) {
            message += ` from ${providerPhone}`
        }
        if (patientPhone) {
            message += ` at your phone # ${patientPhone}`
        }
        return {
            title: 'Foodsmart Nutrition Phone Call',
            location: 'Phone call - Foodsmart will call you',
            message: `${message}. Please make sure you answer the call in case it shows as spam.`,
        }
    }
    return {
        title: 'Foodsmart Nutrition Video Visit',
        location: zoomLink ?? 'Zoom Video Visit',
        message: `Your zoom visit with ${providerName} is confirmed.\n\nAt the time of your visit, please join your meeting here: ${zoomLink}`,
    }
}

export default {
    updateCustomer,
    sendCioEvent
}