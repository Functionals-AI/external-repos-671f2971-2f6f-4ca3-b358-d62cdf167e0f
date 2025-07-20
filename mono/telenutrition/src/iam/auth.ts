import { IContext } from '@mono/common/lib/context'
import { ErrCode } from '@mono/common/lib/error'
import { Result, err, ok } from 'neverthrow'
import * as jwt from 'jsonwebtoken'
import {JsonObject} from '@mono/common/lib/json'
import { FederationIdentityRecord, FederationSource, IdentityRecord } from './types'
import * as crypto from 'crypto'
import { promisify } from 'util'
import { UserRecord } from './user/store'
import { createEnrollmentToken } from './enrollment'
import Payment from '../scheduling/payment'
import { PatientRecord, selectOnePatient } from '../scheduling/patient/store'
import { InsuranceId } from '../scheduling/insurance/service'
import { AccountIds } from '@mono/common/lib/account/service'
import { shortenLink } from '@mono/common/lib/shortlink'
const pbkdf2Async = promisify(crypto.pbkdf2)

const JWT_REGEX = /^([a-zA-Z0-9_=]+)\.([a-zA-Z0-9_=]+)\.([a-zA-Z0-9_\-\+\/=]*)/

// Params to use for crypto.pbkdf2
const SALT_LENGTH = 32;
const KEY_LENGTH = 64;
const ITERATIONS = 10000;
const DIGEST = 'sha512';

export interface JwtPayload extends jwt.JwtPayload {
  scope?: string,
  userId?: number,
}

export type AppTokenPayload = JwtPayload & IdentityRecord
export type FederationTokenPayload = JwtPayload & FederationIdentityRecord

export function peekJsonWebToken(context: IContext, token: string): Result<JsonObject, ErrCode> {
  const {logger} = context

  try {
    if (!JWT_REGEX.test(token)) {
      return err(ErrCode.INVALID_DATA)
    }
  
    const payload = Buffer.from(token.split('.')[1], 'base64').toString()
  
    return ok(JSON.parse(payload))
  } catch(e) {
    logger.exception(context, `identity.auth.peekJsonWebToken`, e)
    return err(ErrCode.EXCEPTION)
  }
}

export function buildJsonWebToken(context: IContext, payload: object, secret: string, expiresIn: string = '180 days'): Result<string, ErrCode> {
  const {logger} = context

  try {
    return ok(jwt.sign(payload, secret, { expiresIn }))
  } catch(e) {
    logger.exception(context, 'buildJsonWebToken', e)
    return err(ErrCode.EXCEPTION)
  }
}

export function parseJsonWebToken<T>(context: IContext, token: string, secret: string, checkExpiration: boolean = false): Result<T, ErrCode> {
  const {logger} = context

  try {
    return ok(jwt.verify(token, secret, { ignoreExpiration: !checkExpiration }) as T)
  } catch(e) {
    if (e.name === 'TokenExpiredError') {
      logger.warn(context, 'parseJsonWebToken', e.message)
      return err(ErrCode.EXPIRATION)
    } else if (e.name === 'JsonWebTokenError' || e.name === 'NotBeforeError') {
      logger.error(context, 'parseJsonWebToken', e.message)
      return err(ErrCode.INVALID_DATA)
    }

    logger.exception(context, 'parseJsonWebToken', e)
    return err(ErrCode.EXCEPTION)
  }
}

export function buildAppToken(context: IContext, payload: AppTokenPayload, expiresIn?: string): Result<string, ErrCode> {
  // Use a shorter token lifetime for delegate tokens
  const expiresInCalc = expiresIn ?? (payload.userId !== undefined ? '3h' : '180 days')
  return buildJsonWebToken(context, payload, context.config.telenutrition.scheduling.auth.jwt_secret, expiresInCalc)
}

export function parseAppToken(context: IContext, token: string): Result<AppTokenPayload, ErrCode> {
  const {logger} = context

  const peekResult = peekJsonWebToken(context, token)

  if (peekResult.isErr()) {
    logger.error(context, `identity.auth.parseAppToken`, `unable to peek into json token`, {error: peekResult.error, token})
    return err(ErrCode.INVALID_DATA)
  }

  const peek = peekResult.value
  const isDelegate = 'userId' in peek

  const result = parseJsonWebToken<AppTokenPayload>(context, token, context.config.telenutrition.scheduling.auth.jwt_secret, isDelegate)

  if (result.isErr()) {
    if (result.error != ErrCode.EXPIRATION) {
      logger.error(context, `iam.auth.parseAppToken`, `failed to parse json web token`, {token})
    }
    return err(result.error)
  }

  const payload = result.value
  return ok(payload)
}

function getFederationTokenSecret(context: IContext, src: FederationSource): Result<string, ErrCode> {
  const {config} = context

  switch(src) {
    case FederationSource.Foodapp:
      return ok(config.telenutrition.scheduling.auth.foodapp_token_secret)
    case FederationSource.CallCenter:
    case FederationSource.CallCenterAgent:
    case FederationSource.CallCenterDial:
      return ok(config.telenutrition.scheduling.auth.call_center_token_secret)
  }

  return err(ErrCode.NOT_FOUND)
}

export function buildFederationToken(context: IContext, fid: string, src: FederationSource, extras?: JwtPayload): Result<string, ErrCode> {
  const {config, logger} = context

  const result = getFederationTokenSecret(context, src)

  if (result.isErr()) {
    logger.error(context, `identity.auth.buildFederationToken`, `error building token`, {fid, src})
    return err(result.error)
  }

  const secret = result.value

  return buildJsonWebToken(context, {fid, src, ...extras}, secret)
}

export interface BuildFederationScheduleLinkOptions {
  userId?: number,
  accountId?: number,
  eligibleId?: number,
  leadId?: number,
  utmSource?: string,
  utmMedium?: string,
  utmCampaign?: string,
  shorten?: boolean,
}

export async function buildFederationScheduleLink(context: IContext, fid: string, src: FederationSource, options: BuildFederationScheduleLinkOptions): Promise<Result<string, ErrCode>> {
  const { config, logger } = context
  const TAG = `identity.auth.buildFederationScheduleLink`

  try {
    const resultToken = buildFederationToken(context, fid, src, {
      userId: options.userId,
    })
    if (resultToken.isErr()) {
      return err(resultToken.error)
    }
    const token = resultToken.value

    let url: string = `${config.telenutrition_web.baseUrl}/auth/federation?token=${token}`

    // add enrollment link if linked to a client account
    if (options.userId === undefined && options.accountId !== undefined) {
      const result = await createEnrollmentToken(context, options.accountId, options.eligibleId, options.leadId)

      if (result.isErr()) {
        return err(result.error)
      }

      url += `&enrollment=${result.value}`
    }

    if (options?.utmSource !== undefined) {
      url += `&utm_source=${options.utmSource}`
    }

    if (options?.utmMedium !== undefined) {
      url += `&utm_medium=${options.utmMedium}`
    }

    if (options?.utmCampaign !== undefined) {
      url += `&utm_campaign=${options.utmCampaign}`
    }

    if (options.shorten) {
      const resultShorten = await shortenLink(context, url, {length: 12, expires: {months: 3}})

      if (resultShorten.isErr()) {
        logger.error(context, 'createEnrollmentLink', 'error shortening link')
        return err(resultShorten.error)
      } else {
        url = resultShorten.value.url
      }      

    }

    return ok(url);
  }
  catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

// only allow existing or eligible users for now...
export async function hasSSO(context: IContext, target: UserRecord | PatientRecord): Promise<Result<boolean, ErrCode>> {
  if (hasEligibleId(target)) {
    return ok(true)
  }
  const extrasResult = await getSSOOverride(context, target)
  if (extrasResult.isErr()) {
    return err(extrasResult.error)
  }
  return ok(extrasResult.value !== null)
}

export function hasEligibleId(target: UserRecord | PatientRecord) {
  if ('userId' in target) {
    return target.fsEligibleId !== undefined || target.fsUserId !== undefined
  } else {
    return target.eligibleId !== undefined
  }
}

export async function getSSOOverride(context: IContext, target: UserRecord | PatientRecord): Promise<Result<any | null, ErrCode>> {
  let patientId
  if (target.accountId === AccountIds.BankOfAmerica) {
    return ok({
      firstName: target.firstName,
      lastName: target.lastName,
      organization_id: 203
    })
  }
  if ('userId' in target) {
    const identityId = target.identityId
    if (identityId) {
      const patientResult = await selectOnePatient(context, { identityId })
      if (patientResult.isOk()) {
        patientId = patientResult.value.patientId
      } else if (patientResult.error !== ErrCode.NOT_FOUND) {
        return err(patientResult.error)
      }
    }
  } else {
    patientId = target.patientId
  }
  if (patientId) {
    const paymentMethodsResult = await Payment.Service.getPatientPaymentMethods(context, { patientId })
    if (paymentMethodsResult.isErr()) {
      return err(paymentMethodsResult.error)
    }

    if (paymentMethodsResult.value.some(({ payment }) => 'insurance_id' in payment && payment.insurance_id === InsuranceId.Cigna)) {
      return ok({
        firstName: target.firstName,
        lastName: target.lastName,
        organization_id: 196
      })
    }
  }
  return ok(null)
}

export async function buildFoodappSSOLink(context: IContext, target: UserRecord | PatientRecord, path?: string): Promise<Result<string, ErrCode>> {
  const {config} = context

  let extras
  if (!hasEligibleId(target)) {
    const overrideResult = await getSSOOverride(context, target)
    if (overrideResult.isErr()) {
      return err(overrideResult.error)
    } else if (overrideResult.value == null) {
      return err(ErrCode.FORBIDDEN)
    }
    extras = overrideResult.value
  }

  const payload = {
    ...('userId' in target ? {
      id: target.userId,
      iid: target.identityId,
      ...(target.fsUserId && { fsid: target.fsUserId }),
      ...(target.fsEligibleId && { eid: target.fsEligibleId }),
      ...(target.email && { username: crypto.createHash('md5').update(target.email).digest("hex") }),
    } : {
      iid: target.identityId,
      eid: target.eligibleId
    }),
    ...extras
  }

  const secret = config.telenutrition.scheduling.auth.foodapp_token_secret
  const tokenResult = buildJsonWebToken(context, payload, secret, '5m')
  if (tokenResult.isErr()) {
    return err(tokenResult.error)
  }

  const urlBase = config.telenutrition.scheduling.zipongo_app_web_base
  return ok(`${urlBase}/login?ftoken=${tokenResult.value}&return_to=${encodeURIComponent(path || "/recipes/home")}`)
}

export function parseFederationToken(context: IContext, token: string): Result<FederationTokenPayload, ErrCode> {
  const {logger} = context

  try {
    const result = peekJsonWebToken(context, token)

    if (result.isErr()) {
      logger.error(context, `identity.auth.parseFederationToken`, `unable to peek into json token`, {error: result.error, token})
      return err(ErrCode.INVALID_DATA)
    }
  
    const peek = result.value

    if (!('fid' in peek)) {
      logger.error(context, `identity.auth.parseFederationToken`, `payload missing fid field`, {payload: JSON.stringify(peek)})
      return err(ErrCode.INVALID_DATA)
    } 

    if (!('src' in peek)) {
      logger.error(context, `identity.auth.parseFederationToken`, `payload missing src field`, {payload: JSON.stringify(peek)})
      return err(ErrCode.INVALID_DATA)
    } 
  
    const src = peek.src as FederationSource
  
    const resultSecret = getFederationTokenSecret(context, src)
  
    if (resultSecret.isErr()) {
      logger.error(context, `identity.auth.parseFederationToken`, `error getting secret`)
      return err(resultSecret.error)
    }
  
    const secret = resultSecret.value
  
    const resultParse = parseJsonWebToken<FederationTokenPayload>(context, token, secret)

    if (resultParse.isErr()) {
      return err(resultParse.error)
    }

    const payload = resultParse.value

    return ok({
      fid: payload.fid,
      src: payload.src,
      ...(payload.userId && { userId: payload.userId }),
      ...(payload.scope && { scope: payload.scope })
    })
  } catch(e) {
    logger.exception(context, 'identity.auth.parseFederationToken', e)
    return err(ErrCode.EXCEPTION)
  }
}

/**
 * Create a password salt as raw bytes.
 */
 function createSalt(): string {
  return crypto.randomBytes(SALT_LENGTH).toString('hex');
}

async function createHashedPassword(salt: string, password: string): Promise<string> {
  const derivedKey = await pbkdf2Async(password, salt, ITERATIONS, KEY_LENGTH, DIGEST)
  return salt + ':' + derivedKey.toString('hex')
}

export async function hashPassword(password: string): Promise<string> {
  return createHashedPassword(createSalt(), password);
}

/**
 * Retrieve the salt from the dbPassword.
 */
function passwordSalt(dbPassword: string): string {
  const salt = dbPassword.split(':')[0]
  return salt
}

export async function validatePassword(password: string, hash: string): Promise<boolean> {
  let salt = passwordSalt(hash)
  let encoded = await createHashedPassword(salt, password)
  return hash === encoded
}

export default {
  buildAppToken,
  buildFoodappSSOLink,
  parseAppToken,
  buildFederationToken,
  buildFederationScheduleLink,
  parseFederationToken,
  hashPassword,
  validatePassword
}