import * as crypto from 'crypto'
import { IContext } from "@mono/common/lib/context"
import { publishEvent } from '@mono/analytics/lib/events'
import { err, Result } from 'neverthrow'
import { ErrCode } from '@mono/common/lib/error'
import { IdentityRecord } from '../iam/types'
import { formatFederationId, isAppIdentity, isFederationIdentity } from '../iam/identity/service'
import Insurance from './insurance'
import Employer from './employer'
import { PaymentSchema } from './scheduling-flow/schema'
import {z} from 'zod';
import { BaseAppointmentRecord } from './appointment/types'

export interface PublishAuthEventOptions {
  cid: string,
  identity: IdentityRecord,
}

export async function publishAuthEvent(context: IContext, options: PublishAuthEventOptions): Promise<Result<void, ErrCode>> {
  const {logger} = context
  const {identity} = options

  try {
    const meta: any = {
      platform: 'api',
      version: context.version,
      cid: options.cid,
    }
  
    if (isAppIdentity(identity)) {
      meta.uid = identity.uid
    } else {
      meta.fid = formatFederationId(identity)
    }
  
    const event = {
      id: crypto.randomUUID(),
      app: 'telenutrition',
      type: 'app',
      name: 'auth',
      time: Date.now()/1000|0,
      meta,
    }
  
    return publishEvent(context, event)
  } catch(e) {
    logger.exception(context, `events.publishAuthEvent`, e)
    return err(ErrCode.EXCEPTION)
  }
}

export type PublishBookAppointmentEventOptions = {
  cid: string,
  uid?: number,
  identity: IdentityRecord,
  appointment: BaseAppointmentRecord,
  payment?: z.infer<typeof PaymentSchema>,
  promo?: string;
}

export async function publishBookAppointmentEvent(context: IContext, options: PublishBookAppointmentEventOptions): Promise<Result<void, ErrCode>> {
  const {logger} = context
  const {identity, appointment} = options

  try {
    const meta: any = {
      cid: options.cid,
      uid: options.uid,
      platform: 'api',
      version: context.version,
    }

    if (isFederationIdentity(identity)) {
      meta.fid = formatFederationId(identity)
    }

    const data: any = {
      appointment_id: appointment.appointmentId,
      patient_id: appointment.patientId,
      provider_id: appointment.providerId,
      department_id: appointment.departmentId,
      start_time: appointment.startTime,
      appointment_type_id: appointment.appointmentTypeId,
      duration: appointment.duration,
    }

    if (options.payment) {
      const [insuranceResult, employerResult] = await Promise.all([
        Insurance.Service.getInsuranceInfo(context, options.payment),
        Employer.Service.getEmployerInfo(context, options.payment),
      ])

      if (insuranceResult.isErr() || employerResult.isErr()) {
        if (insuranceResult.isErr()) {
          logger.error(context, `publishBookAppointmentEvent`, `failed to get insurance information used to publish book appointment event`, { payment: options.payment })
        }
        if (employerResult.isErr()) {
          logger.error(context, `publishBookAppointmentEvent`, `failed to get employer information used to publish book appointment event`, { payment: options.payment })
        }
      } else {
        const insurance = insuranceResult.value
        const employer = employerResult.value

        if (insurance.insuranceId !== undefined) {
          data.insurance_id = insurance.insuranceId
        }

        if (insurance.label !== undefined) {
          data.insurance_name = insurance.label
        }

        if (insurance.packageId !== undefined) {
          data.package_id = insurance.packageId
        }

        if (insurance.groupId !== undefined) {
          data.group_id = insurance.groupId
        }

        if (insurance.memberId !== undefined) {
          data.member_id = insurance.memberId
        }

        if (employer.employerId !== undefined) {
          data.employer_id = employer.employerId
        }

        if (employer.label !== undefined) {
          data.employer_name = employer.label
        }

        if (employer.specialProgram !== undefined) {
          data.employer_special_program = employer.specialProgram
        }
      }
    } 

    if (options.promo !== undefined) {
      data.promo = options.promo 
    }

    const event = {
      id: crypto.randomUUID(),
      app: 'telenutrition',
      type: 'app',
      name: 'book-appointment',
      time: Date.now()/1000|0,
      meta,
      data,
    }
  
    return publishEvent(context, event)
  } catch(e) {
    logger.exception(context, `events.publishBookAppointmentEvent`, e)
    return err(ErrCode.EXCEPTION)
  }
}

export default {
  publishAuthEvent,
  publishBookAppointmentEvent,
}