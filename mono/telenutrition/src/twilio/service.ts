import { err, ok, Result } from 'neverthrow'
import { phone } from 'phone'

import { ErrCode } from '@mono/common/lib/error'
import { IContext } from '@mono/common/lib/context'
import { Logger } from '@mono/common'
import { Twilio } from '@mono/common/lib/service'
import { selectOneAppointment, selectUpcomingAppointments } from '../scheduling/appointment/store'
import { AppointmentRecord } from '../scheduling/appointment/types'
import { cancelAppointment } from '../scheduling/appointment/service'
import { PatientRecord, selectPatientsByPhoneNumber } from '../scheduling/patient/store'

const MTAG = Logger.tag()

export type PhoneNumber = string

const SCHEDULED_APPOINTMENT_STATUS = 'f'
const APPTS_REPLY = 'APPTS'

function scheduledAppointmentsBodyWhenNone(patients: PatientRecord[]): string {
  const firstName = patients.length === 1 && patients[0].firstName ? ` ${patients[0].firstName}` : ''

  return `Hello${firstName}, you currently don't have any appointments scheduled!
Please visit https://foodsmart.com/schedule to book an appointment.
`
}

/**
 * Generate the 'scheduled appointments body' which contains a list of scheduled appointments,
 * followed by a cancellation line. Note, the startAt field is generated to be in the
 * patient's timezone.
 * 
 * @param patientIdentity 
 * @param appointments 
 * @returns 
 */
function scheduledAppointmentsBody(patients: PatientRecord[], appointments: AppointmentRecord[]): string {
  const firstName = patients.length === 1 && patients[0].firstName ? ` ${patients[0].firstName}` : ''
  const appointmentLines: string[] = []

  for (const [i, appointment] of appointments.entries()) {
    appointmentLines.push(`${i+1}: ${appointment.startDate} at ${appointment.startTime}`)
  }

  function cancelLine(count: number) {
    if (count == 1) {
      return `To cancel, reply: 1`
    }
    else if (count > 1) {
      let replies: string[] = []

      for (let i = 1; i < count; i++) {
        replies.push(`${i}`)
      }
      return `To Cancel, reply: ${replies.join(', ')} or ${count}`
    }
    return ''
  }

  return `Hello${firstName}, you have appointment(s) coming up. Your appointments are:
${appointmentLines.join('\n')}
${cancelLine(appointments.length)}
`
}

export interface RespondWithScheduledAppointmentsOptions {
  maxNumberOfAppointments?: number,
  maxNumberOfDaysInFuture?: number
}

export interface RespondWithScheduledAppointmentsResult {
  appointmentIds: number[]
}

/**
 * Respond to patient's SMS requesting a list of scheduled appointments.
 * 
 * @param context 
 * @param patient 
 * @param fromNumber 
 * @returns 
 */
async function respondWithScheduledAppointments(context: IContext, patients: PatientRecord[], fromNumber: PhoneNumber, options?: RespondWithScheduledAppointmentsOptions): Promise<Result<RespondWithScheduledAppointmentsResult, ErrCode>> {
  const { logger } = context
  const TAG = [ ...MTAG, 'respondWithScheduledAppointments' ]  

  try {
    const toNumber = patients.reduce(
      (phone, patient) => phone === undefined ? patient.phone : phone === patient.phone ? phone : undefined,
      undefined
    )

    if (toNumber === undefined) {
      logger.error(context, TAG, `Unable to retrieve mobile phone number.`, {
        patients,
      })

      return err(ErrCode.INVALID_DATA)
    }

    const patientIds = patients.map(patient => patient.patientId)

    const selectUpcomingAppointmentsResult = await selectUpcomingAppointments(context, {
      patientId: patientIds,
      status: SCHEDULED_APPOINTMENT_STATUS,
      ...(options?.maxNumberOfAppointments && { limit: options.maxNumberOfAppointments }),
      ...(options?.maxNumberOfDaysInFuture && { days: options.maxNumberOfDaysInFuture }),
      order: {
        by: 'start_timestamp',
        direction: 'ASC',
      }
    })

    if (selectUpcomingAppointmentsResult.isErr()) {
      logger.error(context, TAG, 'Error selecting appointments.', {
        patientIds,
        fromNumber,
      })

      return err(selectUpcomingAppointmentsResult.error)
    }

    const upcomingAppointments = selectUpcomingAppointmentsResult.value
    const upcomingAppointmentIds = upcomingAppointments.map(appointment => appointment.appointmentId)
    const upcomingAppointmentPatientIds = [ ...new Set(upcomingAppointments.map(a => a.patientId)) ]
    const patientsWithAppointments = patients.filter(patient => upcomingAppointmentPatientIds.includes(patient.patientId))

    logger.debug(context, TAG, 'Selected upcoming appointments.', {
      patientIds,
      fromNumber,
      upcomingAppointmentIds,
      upcomingAppointmentPatientIds,
      patientsWithAppointmentsIds: patientsWithAppointments.map(patient => patient.patientId),
    })

    const body = upcomingAppointmentIds.length === 0 ? 
      scheduledAppointmentsBodyWhenNone(patients) :
      scheduledAppointmentsBody(patientsWithAppointments, upcomingAppointments)

    const sendMessageResult = await Twilio.SMS.sendMessage(context, fromNumber, body)

    if (sendMessageResult.isErr()) {
      logger.error(context, TAG, 'Error sending response to patient.', {
        error: sendMessageResult.error,
        patients: patients,
        fromNumber,
        body,
      })
    }

    return ok({ appointmentIds: upcomingAppointmentIds, })
  }
  catch (e) {
    logger.exception(context, TAG, e, {
      patients,
      fromNumber,
    })

    return err(ErrCode.EXCEPTION)
  }
}

interface CancelSelectedAppointmentParams {
  patients: PatientRecord[],
  fromNumber: PhoneNumber,
  messageBody:string,
  appointmentIds: number[],
  canceledBy: 'patient' | 'provider',
}

export interface CancelSelectedAppointmentResult {
  canceledAppointmentId: number,
  canceledAppointmentPatientId?: number,
  appointmentIds: number[]
}

async function cancelSelectedAppointment(
  context: IContext,
  {
    messageBody,
    patients,
    fromNumber,
    appointmentIds,
    canceledBy,
  }: CancelSelectedAppointmentParams
): Promise<Result<CancelSelectedAppointmentResult, ErrCode>> {
  const { logger } = context
  const TAG = [ ...MTAG, 'cancelSelectedAppointment' ]

  try {
    const selectorStr = messageBody.trim()
    const selectedAppointmentIdx = Number(selectorStr)

    if (isNaN(selectedAppointmentIdx)) {
      logger.error(context, TAG, 'Selected appointment ID is invalid.', {
        patients,
        fromNumber,
        messageBody,
      })

      return err(ErrCode.INVALID_DATA)
    }
    else if (appointmentIds.length === 0) {
      logger.error(context, TAG, 'No appointment IDs to cancel.', {
        patients,
        fromNumber,
        messageBody,
        appointmentIds,
      })

      return err(ErrCode.INVALID_DATA)
    }
    else if (selectedAppointmentIdx > appointmentIds.length) {
      logger.error(context, TAG, 'Invalid selected appointment.', {
        patients,
        fromNumber,
        messageBody,
        appointmentIds,
      })

      //
      // Should a reply SMS be sent that the selected appointment does NOT exist?
      //
      return err(ErrCode.INVALID_DATA)
    }
    else {
      //
      // Ensure selected appointment is in actual upcoming appointment IDs.
      //
      const selectedAppointmentId = appointmentIds[selectedAppointmentIdx - 1]
      const selectedAppointmentResult = await selectOneAppointment(context, { appointmentId: selectedAppointmentId })

      if (selectedAppointmentResult.isErr()) {
        logger.error(context, TAG, `Error retrieving selected appointment.`, {
          patients,
          selectedAppointmentId,          
        })

        return err(selectedAppointmentResult.error)
      }

      const selectedAppointment = selectedAppointmentResult.value
      const patientId = selectedAppointment.patientId
      const selectAppointmentsResult = await selectUpcomingAppointments(context, {
        patientId,
        status: SCHEDULED_APPOINTMENT_STATUS,
      })
      
      if (selectAppointmentsResult.isErr()) {
        logger.error(context, TAG, 'Error getting upcoming appointments.', {
          patientId,
          fromNumber,
        })
      
        return err(selectAppointmentsResult.error)
      }
      
      const upcomingAppointments = selectAppointmentsResult.value
      const upcomingAppointmentIds = upcomingAppointments.map(appointment => appointment.appointmentId)

      if (!upcomingAppointmentIds.includes(selectedAppointmentId)) {
        //
        // The selected appointment is NOT in upcoming appointments.
        //
        logger.error(context, TAG, 'Appointment not in upcoming apointments.', {
          patientId,
          fromNumber,
          messageBody,
          upcomingAppointmentIds,
        })

        //
        // Should probably send an SMS reply stating that their selected appointment
        // is invalid and they should reply with 'APPTS' to get an updated list.
        //
        return err(ErrCode.INVALID_DATA)
      }
      //
      // Have something to cancel.
      //
      const cancelResult = await cancelAppointment(context, selectedAppointmentId, {
        patientId,
        canceledBy,
        cancelReason: 'PATIENT_CANCELLED'
      })

      if (cancelResult.isErr()) {
        logger.error(context, TAG, 'Error cancelling appointment.', {
          patientId,
          fromNumber,
          messageBody,
          selectedAppointmentId,
          upcomingAppointmentIds,
        })

        return err(cancelResult.error)
      }
      else {
        //
        // Should probably send a reply SMS stating the appointment was cancelled.
        // Reply should include a prompt to reply with 'APPTS' to get a list
        // of upcoming appointments.
        //
        // NOTE: DO NOT remove the cancelled appoint ID from the list. THe patient
        // may have sent multiple C<appointment ID> messages in response to the
        // same list.
        //
        return ok({ 
          canceledAppointmentId: selectedAppointmentId, 
          canceledAppointmentPatientId: patientId,
          appointmentIds, 
        })
      }
    }
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

function promptToGetScheduledOnInvalidCancelBody(patients: PatientRecord[]): string {
  const firstName = patients.length === 1 && patients[0].firstName ? ` ${patients[0].firstName}` : ''

  return `Hello${firstName}, we were unable to cancel your selected appointment.
  Please, reply with '${APPTS_REPLY}' to get your scheduled appointments!
  Visit https://foodsmart.com/schedule to book an appointment.
`
}

async function sendPromptToGetScheduledOnInvalidCancel(context: IContext, patients: PatientRecord[], fromNumber: PhoneNumber): Promise<Result<true, ErrCode>> {
  const {logger } = context
  const TAG = [ ...MTAG, 'sendPromptToGetScheduledOnInvalidCancel' ]

  try {
    const body = promptToGetScheduledOnInvalidCancelBody(patients)
    const sendMessageResult = await Twilio.SMS.sendMessage(context, fromNumber, body)

    if (sendMessageResult.isErr()) {
      logger.error(context, TAG, 'Error sending response to patient.', {
        error: sendMessageResult.error,
        patients,
        fromNumber,
        body,
      })
    }

    return ok(true)
  }
  catch (e) {
    logger.exception(context, TAG, e)
    
    return err(ErrCode.EXCEPTION)
  }
}

function cancelledReplyBody(patient?: PatientRecord): string {
  const firstName = patient && patient.firstName ? ` ${patient.firstName}` : ''

  return `Hello${firstName}, your selected appointment was successfully cancelled.
Please, visit https://foodsmart.com/schedule to book an appointment.
`
}

async function sendCancelledReply(context: IContext, patient: PatientRecord | undefined, fromNumber: PhoneNumber): Promise<Result<true, ErrCode>> {
  const { logger } = context
  const TAG = [ ...MTAG, 'sendCanceledReply']

  try {
    const body = cancelledReplyBody(patient)
    const sendMessageResult = await Twilio.SMS.sendMessage(context, fromNumber, body)

    if (sendMessageResult.isErr()) {
      logger.error(context, TAG, 'Error sending cancelled appointment reply.', {
        error: sendMessageResult.error,
        patient,
        fromNumber,
      })

      return err(ErrCode.SERVICE)
    }
    else {
      return ok(true)
    }
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export interface EmptyResponse {
  appointmentIds: number[]
}

/**
 * Respond with default text, such as when an incomming message is not understood.
 * 
 * @param context 
 * @param patient 
 * @param fromNumber 
 * @returns 
 */
async function respondWithDefaultResponse(context: IContext, fromNumber: PhoneNumber): Promise<Result<true, ErrCode>> {
  const { logger } = context
  const TAG = [ ...MTAG, 'respondWithScheduledAppointments' ]  

  try {
    const sendMessageResult = await Twilio.SMS.sendMessage(context, fromNumber, `
Thank you for your message, your provider can not reply using this number. If you need to make any changes to your upcoming appointments please text APPTS. If you need assistance with anything else please contact our support team to support@foodsmart.com.
`)

    if (sendMessageResult.isErr()) {
      logger.error(context, TAG, 'Error sending default response.', {
        error: sendMessageResult.error,
        fromNumber,
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

function isApptsReply(body: string): boolean {
  return body.toUpperCase().trim() === APPTS_REPLY
}

/**
 * A cancel reply, is a number selecting the appointment to cancel.
 * 
 * @param body
 * @returns 
 */
function isCancelReply(body: string): boolean {
  const selectorStr = body.trim()
  const selector = Number(selectorStr)

  return !isNaN(selector)
}

function normalizeNumber(phoneNumber: string): string | undefined {
  const validation = phone(phoneNumber, { country: 'USA' })

  return validation.isValid ? validation.phoneNumber : undefined
}

/**
 * Process an SMS response received from a patient. A patient can send two
 * flavors of replies (message with a single string):
 * 
 *  - APPTS: Reply which requests a list of the most recent appointments.
 *  - C<N>: Reply which request to cancel appointment N.
 * 
 * @param context - the context
 * @param fromNumber - The patient's phone number.
 * @param toNumber   - The phone number used by Foodsmart which received the reply.
 *                     This should be number used to send SMS messages in the context of 
 *                     the environment.
 * @param messageBody    - The body of the message.
 * @param appointmentIds - a list of appointments that would have been previously sent via
 *                         a 'appointments' reply which requested a list.
 *                         Required, if the reply is to cancel an appointment.
 * @returns 
 */
export async function processPatientSMSReply(
  context: IContext,
  fromNumber: PhoneNumber,
  toNumber: PhoneNumber,
  messageBody: string,
  appointmentIds?: number[]
): Promise<Result<RespondWithScheduledAppointmentsResult | CancelSelectedAppointmentResult | EmptyResponse, ErrCode>> {
  const { config, logger } = context
  const TAG = [ ...MTAG, 'processPatientSMSReply' ]

  try {
    logger.debug(context, TAG, `About to process patient's SMS reply:`, {
      fromNumber,
      toNumber,
      messageBody,
      appointmentIds,
    })
    const foodsmartPhoneNumber = config.common.twilio?.foodsmartPhoneNumber

    if (foodsmartPhoneNumber === undefined) {
      logger.error(context, TAG, 'Foodsmart phone number is not configured.')

      return err(ErrCode.NOT_FOUND) // Perhaps a better error code?
    }

    if (normalizeNumber(foodsmartPhoneNumber) !== normalizeNumber(toNumber)) {
      //
      // Ensure the config is compatible with the number which is the target
      // of the webhook.
      //
      return err(ErrCode.ARGUMENT_ERROR)
    }

    const patientsResult = await selectPatientsByPhoneNumber(context, fromNumber)

    if (patientsResult.isErr()) {
      logger.error(context, TAG, 'Error fetching patients.', {
        error: patientsResult.error
      })

      return err(ErrCode.SERVICE)
    }
    else if (patientsResult.value.length === 0) {
      logger.error(context, TAG, 'Unable to lookup patients using phone number.')

      return err(ErrCode.NOT_FOUND)
    }

    //
    // Have a valid patients, with IDs.
    //
    const patients = patientsResult.value

    if (isApptsReply(messageBody)) {
      const result = await respondWithScheduledAppointments(context, patients, fromNumber)

      if (result.isErr()) {
        logger.error(context, TAG, 'Error responding with scheduled appointments.', {
          error: result.error,
        })

        return err(result.error)
      }
      return ok(result.value)
    }
    else if (isCancelReply(messageBody)) {
      if (appointmentIds === undefined || appointmentIds.length === 0) {
        //
        // No appointment IDs. Cookie may have expired. Prompt user to reply with an 'APPTS'
        // reply.
        //
        const result = await sendPromptToGetScheduledOnInvalidCancel(context, patients, fromNumber)

        if (result.isErr()) {
          logger.error(context, TAG, 'Error prompting user to request scheduled appointments.', {
            error: result.error,
          })
        }
        return err(ErrCode.INVALID_DATA)
      }
      else {
        const result = await cancelSelectedAppointment(context, {patients, fromNumber, messageBody, appointmentIds, canceledBy: 'patient'})

        if (result.isErr()) {
          logger.error(context, TAG, 'Error canceling appointment.', {
            error: result.error
          })

          //
          // Since something went wrong cancelling, prompt them to request a new list.
          //
          const sendPromptResult = await sendPromptToGetScheduledOnInvalidCancel(context, patients, fromNumber)

          if (sendPromptResult.isErr()) {
            logger.error(context, TAG, 'Error prompting user to request scheduled appointments.', {
              error: result.error,
            })
            return err(sendPromptResult.error)
          }

          return err(result.error)
        }
        else {
          const { canceledAppointmentPatientId: patientId } = result.value
          const patient = patients.find(p => p.patientId === patientId)
          logger.info(context, TAG, 'Selected appointment has been cancelled.', {
            patientId,
            fromNumber,
            messageBody,
            appointmentIds,
          })

          const sendCancelledReplyResult = await sendCancelledReply(context, patient, fromNumber)

          if (sendCancelledReplyResult.isErr()) {
            logger.error(context, TAG, 'Error sending cancelled reply.', {
              error: sendCancelledReplyResult.error,
              patient,
              fromNumber,
              messageBody,
              appointmentIds,
            })
          }
          return ok(result.value)
        }
      }
    }
    else {
      logger.info(context, TAG, 'Reply not understood.', {
        messageBody,
      })

      const sendDefaultResponseResult = await respondWithDefaultResponse(context, fromNumber)

      if (sendDefaultResponseResult.isErr()) {
        logger.error(context, TAG, 'Error responding to reply which was not understood.', {
          fromNumber,
          error: sendDefaultResponseResult.error
        })
      }

      //
      // Send default response.
      //
      return ok({
        appointmentIds: []
      })
    }
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export default {
    processPatientSMSReply,
}