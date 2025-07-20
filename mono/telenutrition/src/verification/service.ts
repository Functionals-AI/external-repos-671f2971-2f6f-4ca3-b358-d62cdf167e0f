import { IContext } from "@mono/common/lib/context"
import Logger from '@mono/common/lib/logger'
import * as db from 'zapatos/db'
import '@mono/common/lib/zapatos/schema'
import * as zs from 'zapatos/schema'
import { ErrCode } from "@mono/common/lib/error"
import { err, ok, Result } from "neverthrow"
import CustomerioApi from  '@mono/common/lib/integration/customerio/api'
import Twilio from  '@mono/common/lib/integration/twilio'

import * as crypto from 'crypto'
import { DateTime } from 'luxon'
import { VerificationMethod, VerificationMethodRecord } from '../rewards/shared'

const MTAG = Logger.tag()

export type VerificationType = 'patient' | 'registration' | 'password-reset' | 'referral'

export type CreateVerificationParameters = {
  type: VerificationType,
  subject?: number,
  email?: string,
  sms?: string,
  call?: string
}

async function createVerification(context: IContext, parameters: CreateVerificationParameters): Promise<Result<[VerificationRecord, VerificationMethodRecord[]], ErrCode>> {
  const { logger, store: { writer }, config, i18n } = context
  const { type, subject, email, sms, call } = parameters

  try {
    const pool = await writer()
    const code = crypto.randomInt(100000, 999999)

    const insertable: zs.telenutrition.common_verification.Insertable = {
      type,
      subject,
      code,
      email,
      sms,
      call
    }

    const insertResult = await db.insert('telenutrition.common_verification', insertable).run(pool)

    const record = mapVerificationRecord(insertResult)

    const methods: VerificationMethodRecord[] = []

    if (record.email !== undefined) {
      const target = maskEmail(record.email)
      methods.push({
        method: 'email',
        label: i18n.__("Send code via email to %s", target),
        target
      })
    }
    if (record.sms !== undefined) {
      const target = maskPhone(record.sms)
      methods.push({
        method: 'sms',
        label: i18n.__("Send text message with code to %s", target),
        target
      })
    }
    if (record.call !== undefined) {
      const target = maskPhone(record.call)
      methods.push({
        method: 'call',
        label:  i18n.__("Call with code to %s", target),
        target
      })
    }

    if (!config.isProduction) {
      logger.debug(context, 'createVerification', `created verification code: ${code}`, {code})
    }

    return ok([record, methods])
  } catch (e) {
    logger.exception(context, 'TAG', e)
    return err(ErrCode.EXCEPTION)
  }
}

export function maskEmail(email: string): string {
  const parts = email.split('@')

  return parts.map(part => `${part[0]}${'*'.repeat(part.length - 2)}${part[part.length - 1]}`).join('@')
}

export function maskPhone(phone: string): string {
  return `XXX-XXX-${phone.slice(-4)}`
}

export type createImmediateVerificationParameters = {
  type: VerificationType,
  subject?: number,
  email?: string,
  phone?: string,
  method: VerificationMethod,
  linkTemplate?: (code: string) => string;
}

async function createImmediateVerification(context: IContext, parameters: createImmediateVerificationParameters): Promise<Result<VerificationRecord, ErrCode>> {
  const verificationResult = await createVerification(context, {
    type: parameters.type,
    subject: parameters.subject,
    sms: parameters.phone,
    email: parameters.email
  })

  if (verificationResult.isErr()) {
    return err(verificationResult.error)
  }

  const [verification, methods] = verificationResult.value

  const method = parameters.method
  if (!methods.some(m => m.method === method)) {
    return err(ErrCode.STATE_VIOLATION)
  }

  const verificationMethodResult = await createVerificationMethod(
    context,
    verification.verificationId,
    method,
    parameters.linkTemplate
  )
  if (verificationMethodResult.isErr()) {
    return err(verificationMethodResult.error)
  }

  return ok(verification)
}

export interface VerificationRecord {
  verificationId: number,
  type: VerificationType,
  subject?: number,
  code: number,
  email?: string,
  sms?: string,
  call?: string,
  attempts: number,
  createdAt: Date,
}



async function createFakeVerificationId(context: IContext): Promise<Result<number, ErrCode>> {
  const { logger, store: { writer } } = context

  try {
    const pool = await writer()

    // Use the next val from the verification sequence to prevent distinguishing real vs fake ids for user enumeration
    const [{ nextval }] = await db.sql`select nextval(pg_get_serial_sequence('${db.raw("telenutrition.common_verification")}', '${db.raw("verification_id")}'))`.run(pool)
    return ok(parseInt(nextval))
  } catch (e) {
    logger.exception(context, 'TAG', e)
    return err(ErrCode.EXCEPTION)
  }
}

/**
 *
 *
 * @param context
 * @param parameters
 * @returns
 */
async function createVerificationMethod(
  context: IContext,
  verificationId: number,
  method: VerificationMethod,
  linkTemplate?: (string) => string
): Promise<Result<number, ErrCode>> {
  const { logger, store: { writer } } = context

  try {
    const pool = await writer()
    const verification = await db.selectOne('telenutrition.common_verification', { verification_id: verificationId }).run(pool)

    if (verification === undefined) {
      logger.error(context, 'createVerificationMethod', `invalid verification id sent`, { verficationId: verificationId })
      return err(ErrCode.NOT_FOUND)
    }

    if (verification.attempts > 3) {
      logger.error(context, 'createVerificationMethod', `exceeded maximum attempts`, { verficationId: verificationId })
      return err(ErrCode.STATE_VIOLATION)
    }


    if (verification[method] === null) {
      if (verification.sms === null) {
        logger.error(context, 'createVerificationMethod', `verification method is invalid`, { method, verficationId: verificationId })
        return err(ErrCode.STATE_VIOLATION)
      }
    }

    const isReferral = verification.type == 'referral'
    const code = isReferral ? `${verificationId}-${verification.code}` : verification.code

    if (method === 'sms' && verification.sms) {
      const message = `Your Foodsmart ${isReferral ? 'referral' : 'verification'} code is: ${code}`
      // send text message
      await Twilio.Api.sendSMS(context, {
        to: verification.sms,
        body: message,
      })

    } else if (method === 'email' && verification.email) {
      const link = linkTemplate?.(code)
      // send email message
      await CustomerioApi.sendEmail(context, {
        to: verification.email,
        transactional_message_id: isReferral ? "referral_code" : "verification_code",
        message_data: {
          code: code.toString(),
          type: verification.type,
          ...(link && { link })
        },
        identifiers: {
          id: `verification:${verification.verification_id}`
        }
      })
    } else if (method === 'call') {
      // TODO?
    } else {
      return err(ErrCode.INVALID_DATA)
    }


    // insert new verification method attempt
    const insertResult = await db.insert('telenutrition.common_verification_method', {
      verification_id: verificationId,
      method,
      value: verification[method] as string,
    }).run(pool)

    // increment attempts counter
    const updateResult = await db.update('telenutrition.common_verification', { attempts: db.sql`attempts+1` }, { verification_id: verificationId }).run(pool)

    return ok(insertResult.verification_method_id)
  } catch (e) {
    logger.exception(context, 'TAG', e)
    return err(ErrCode.EXCEPTION)
  }
}


function mapVerificationRecord(record: zs.telenutrition.common_verification.JSONSelectable) {
  return {
    verificationId: record.verification_id,
    type: record.type as VerificationType,
    subject: record.subject || undefined,
    code: record.code,
    email: record.email || undefined,
    sms: record.sms || undefined,
    call: record.call || undefined,
    attempts: record.attempts,
    createdAt: new Date(record.created_at),
  }
}

async function getVerification(context: IContext, verificationId: number, code: number): Promise<Result<VerificationRecord, ErrCode>> {
  const { logger, store: { reader } } = context

  try {
    const pool = await reader()

    const record = await db.selectOne('telenutrition.common_verification', {
      verification_id: verificationId,
      code
    }, {
      order: { by: 'verification_id', direction: 'DESC' }
    }).run(pool)

    if (record === undefined) {
      return err(ErrCode.NOT_FOUND)
    }

    const verification = mapVerificationRecord(record)

    if (isExpired(verification)) {
      return err(ErrCode.EXPIRATION)
    }

    return ok(verification)
  } catch (e) {
    logger.exception(context, 'service.getVertification', e)
    return err(ErrCode.EXCEPTION)
  }
}

async function getVerificationByAny(context: IContext, params: Record<string, any>): Promise<Result<VerificationRecord, ErrCode>> {
  const { logger, store: { reader } } = context

  try {
    const pool = await reader()

    const record = await db.selectOne('telenutrition.common_verification', params, {
      order: { by: 'verification_id', direction: 'DESC' }
    }).run(pool)

    if (record === undefined) {
      return err(ErrCode.NOT_FOUND)
    }

    const verification = mapVerificationRecord(record)

    if (isExpired(verification)) {
      return err(ErrCode.EXPIRATION)
    }

    return ok(verification)
  } catch (e) {
    logger.exception(context, 'service.getVerificationByAny', e)
    return err(ErrCode.EXCEPTION)
  }
}

async function getVerificationByCode(context: IContext, code: number): Promise<Result<VerificationRecord, ErrCode>> {
  const { logger } = context

  try {
    const verification = await getVerificationByAny(context, { code: code })

    if (verification.isErr()) {
      return err(verification.error)
    }

    return verification
  } catch (e) {
    logger.exception(context, 'service.getVerificationByCode', e)
    return err(ErrCode.EXCEPTION)
  }
}

async function getVerificationByEmail(context: IContext, email: string): Promise<Result<VerificationRecord, ErrCode>> {
  const { logger } = context

  try {
    const verification = await getVerificationByAny(context, { email: email })

    if (verification.isErr()) {
      return err(verification.error)
    }

    return verification
  } catch (e) {
    logger.exception(context, 'service.getVerificationByEmail', e)
    return err(ErrCode.EXCEPTION)
  }
}

async function getVerificationBySMS(context: IContext, sms: string): Promise<Result<VerificationRecord, ErrCode>> {
  const { logger } = context

  try {
    const verification = await getVerificationByAny(context, { sms: sms })

    if (verification.isErr()) {
      return err(verification.error)
    }

    return verification
  } catch (e) {
    logger.exception(context, 'service.getVerificationBySMS', e)
    return err(ErrCode.EXCEPTION)
  }
}

async function getVerificationByType(context: IContext, type: VerificationType): Promise<Result<VerificationRecord, ErrCode>> {
  const { logger } = context

  try {
    const verification = await getVerificationByAny(context, { type: type })

    if (verification.isErr()) {
      return err(verification.error)
    }

    return verification
  } catch (e) {
    logger.exception(context, 'service.getVerificationByType', e)
    return err(ErrCode.EXCEPTION)
  }
}

const EXPIRATION_TIMES: Record<VerificationType, number> = {
  'patient': 60,
  'referral': 60,
  'registration': 60,
  'password-reset': 60 * 24
}

function isExpired(verification: VerificationRecord) {
  const expiration = EXPIRATION_TIMES[verification.type]
  return DateTime.fromJSDate(verification.createdAt).plus({ minutes: expiration }) < DateTime.now()
}

export default {
  createVerification,
  createVerificationMethod,
  createImmediateVerification,
  getVerification,
  getVerificationByCode,
  getVerificationByEmail,
  getVerificationBySMS,
  getVerificationByType,
  createFakeVerificationId
}
