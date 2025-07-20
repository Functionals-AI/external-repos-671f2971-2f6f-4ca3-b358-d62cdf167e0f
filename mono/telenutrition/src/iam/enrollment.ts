import * as jwt from 'jsonwebtoken'
import * as z from 'zod'

import { IContext } from '@mono/common/lib/context'
import { ErrCode } from '@mono/common/lib/error'
import FoodappStore from '@mono/foodapp/lib/store'
import { shortenLink } from '@mono/common/lib/shortlink'
import { Result, err, ok } from 'neverthrow'
import { EligibleUserInfo, EligibleUsersShort } from '@mono/foodapp/lib/store/users-eligible'
import { InputWidget } from '../scheduling/flow-v2/types/widgets'
import { IdentityAttributes } from './types'
import { IdentityUsageRecord, selectIdentity } from './identity/store'
import { AccountIds } from '@mono/common/lib/account/service'
import { countUsers } from './user/store'
import { Logger } from '@mono/common'
import Account from '@mono/common/lib/account'
import { normalizeMemberId } from '../scheduling/payment/eligibility'

const MTAG = Logger.tag()

export enum EnrollmentType {
  Open = 1,
  Eligibility = 2,
}

const ENROLLMENT_LIMITS: Record<number, number> = {
  [AccountIds.BankOfAmerica]: 650
}

export async function isEligibleAccountId(context: IContext, accountId: number): Promise<Result<boolean, ErrCode>> {
  const { logger } = context
  const TAG = [...MTAG, 'isEligibleAccountId']
  const accountResult = await Account.Store.getAccount(context, accountId)
  if (accountResult.isErr()) {
    logger.error(context, TAG, "error fetching account", { accountId, error: accountResult.error })
    return err(accountResult.error)
  }
  return ok(accountResult.value.efile)
}

export async function canEnrollWithAccountId(context: IContext, accountId: number): Promise<Result<boolean, ErrCode>> {
  if (!(accountId in ENROLLMENT_LIMITS)) return ok(true)
  const countResult = await countUsers(context, { account_id: accountId })
  const limit = ENROLLMENT_LIMITS[accountId]
  if (countResult.isErr()) {
    return err(ErrCode.SERVICE)
  }
  return ok(countResult.value < limit)
}

const EnrollmentTokenSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal(EnrollmentType.Open), accountId: z.number().int(), leadId: z.number().int().optional()}),
  z.object({ type: z.literal(EnrollmentType.Eligibility), accountId: z.number().int(), eligibleId: z.preprocess((arg) => parseInt(arg as string), z.number().int()), leadId: z.number().int().optional()}),
])

export type EnrollmentToken = z.infer<typeof EnrollmentTokenSchema>

export async function createEnrollmentToken(context: IContext, accountId: number, eligibleId?: number, leadId?: number): Promise<Result<string, ErrCode>> {
  const {config, logger} = context
  
  try {
    let payload: Partial<EnrollmentToken> = {accountId, leadId}

    if (eligibleId === undefined) {
      payload = {...payload, type: EnrollmentType.Open}
    } else {
      payload = {...payload, type: EnrollmentType.Eligibility, eligibleId}
    }
    
    return ok(jwt.sign(payload, config.telenutrition.enrollment.secret))
  } catch(e) {
    logger.exception(context, 'createTokenEligibility', e)
    return err(ErrCode.EXCEPTION)
  }
}

export function parseEnrollmentToken(context: IContext, raw: string): Result<EnrollmentToken, ErrCode> {
  const {config, logger} = context

  try {
    const payload = jwt.verify(raw, config.telenutrition.enrollment.secret, { ignoreExpiration: true })
    const result = EnrollmentTokenSchema.safeParse(payload)

    if (result.success === false) {
      logger.error(context, 'parseEnrollmentToken', 'token failed enrollment token schema validation', {jwt: raw})
      return err(ErrCode.INVALID_DATA)
    }

    return ok(result.data)
  } catch(e) {
    logger.exception(context, 'validateToken', e)
    return err(ErrCode.EXCEPTION)
  }
}

export type EnrollmentEligibilityInfo = Partial<IdentityAttributes> & {
  eligibleId: number
  memberId?: string;
  organizationId?: number;
  suborganizationId?: string;
  accountId?: number;
  phone?: string
}

function mapEligibilityInfo(info: EligibleUserInfo): EnrollmentEligibilityInfo {
  return {
    eligibleId: info.id,
    ...(info.person_id && { memberId: info.person_id }),
    ...(info.organization_id && { organizationId: info.organization_id }),
    ...(info.suborganization_id && { suborganizationId: info.suborganization_id }),
    ...(info.account_id && { accountId: info.account_id }),
    ...(info.mobile_phone && { phone: info.mobile_phone })
  }
}

export async function fetchEligibilityInfo(context: IContext, eligibleId: number): Promise<Result<EnrollmentEligibilityInfo, ErrCode>> {
  const { logger } = context

  const eligibilityInfoResult = await FoodappStore.UsersEligible.fetchEligibleUserInfo(context, eligibleId)
  if (eligibilityInfoResult.isErr()) {
    if (eligibilityInfoResult.error == ErrCode.NOT_FOUND) {
      logger.error(context, 'fetchEnrollmentEligibilityInfo', 'invalid eligible id', { eligibleId })
      return err(ErrCode.INVALID_DATA)
    }
    logger.error(context, 'fetchEnrollmentEligibilityInfo', 'error fetching eligibility info', {error: eligibilityInfoResult.error})
    return err(eligibilityInfoResult.error)
  }
  return ok(mapEligibilityInfo(eligibilityInfoResult.value))
}

export type EligibilityKey = keyof Pick<EnrollmentEligibilityInfo, 'memberId'>

type EligibilityChallenge = {
  fields: EligibilityKey[]
  questions: InputWidget[]
}

export async function getEligibilityChallenge(context: IContext, eligibleId: number): Promise<Result<EligibilityChallenge, ErrCode>> {
  const { logger } = context

  const eligibilityInfoResult = await fetchEligibilityInfo(context, eligibleId)
  if (eligibilityInfoResult.isErr()) {
    logger.error(context, 'getEligibilityChallenge', 'failed to fetch eligibility info', { eligibleId, error: eligibilityInfoResult.error })
    return err(eligibilityInfoResult.error)
  }

  const eligibilityInfo = eligibilityInfoResult.value

  const fields = getChallengeFields(eligibilityInfo)
  if (fields.length == 0) {
    logger.error(context, 'getChallengeQuestions', 'Unable to determine eligibility challenge', { eligibleId: eligibilityInfo.eligibleId })
    return err(ErrCode.NOT_IMPLEMENTED)
  }
  return ok({
    fields,
    questions: fields.map(field => getChallengeQuestion(context, field))
  })
}

function getChallengeFields(eligibilityInfo: EnrollmentEligibilityInfo): EligibilityKey[] {
  if (eligibilityInfo.memberId != undefined) {
    return ['memberId'];
  }
  return [];
}

function getChallengeQuestion(context: IContext, key: EligibilityKey): InputWidget {
  const {i18n} = context;
  switch(key) {
    case 'memberId': return { key, label: i18n.__('Member ID'), type: 'text' } // TODO: more descriptive label based on orgId or other data?
  }
}

export type VerifyEligibilityParams = {
  eligibleId: number,
  fields: EligibilityKey[],
  values: Partial<Record<EligibilityKey, any>>,
  accountId? : number
}

export async function verifyEligibility(context: IContext, params: VerifyEligibilityParams): Promise<Result<boolean, ErrCode>> {
  const { logger } = context
  const { eligibleId, fields, values, accountId } = params

  const eligibilityInfoResult = await fetchEligibilityInfo(context, eligibleId)
  if (eligibilityInfoResult.isErr()) {
    logger.error(context, 'verifyEligibility', 'failed to fetch eligibility info', { eligibleId, error: eligibilityInfoResult.error })
    return err(eligibilityInfoResult.error)
  }

  const eligibilityInfo = eligibilityInfoResult.value
  const success = fields.every(field => verifyChallenge(field, eligibilityInfo, values, accountId))
  return ok(success)
}

export type EnrollmentVerificationResult = {
  success: true;
} | {
  success: false,
  challenge: InputWidget[],
  failed: EligibilityKey[]
}

function verifyChallenge(key: EligibilityKey, expected: EnrollmentEligibilityInfo, actual: Partial<EnrollmentEligibilityInfo>, accountId?: number) {
  switch(key) {
    case 'memberId': {
      const expectedId = expected[key]
      const actualId = actual[key]
      return expectedId !== undefined && actualId !== undefined &&
        normalizeMemberId(expectedId, accountId) === normalizeMemberId(actualId, accountId)
    }
  }
}

type VerifiedEnrollmentParams = {
  eligibleId: number,
  challenge: Partial<EnrollmentEligibilityInfo>,
  accountId?: number
}

export async function getVerifiedEnrollmentInfo(context: IContext, params: VerifiedEnrollmentParams): Promise<Result<EnrollmentVerificationResult, ErrCode>> {
  const { logger } = context
  const { eligibleId, challenge, accountId } = params

  const eligibilityInfoResult = await fetchEligibilityInfo(context, eligibleId)
  if (eligibilityInfoResult.isErr()) {
    logger.error(context, 'getVerifiedEnrollmentInfo', 'failed to fetch eligibility info', { eligibleId, error: eligibilityInfoResult.error })
    return err(eligibilityInfoResult.error)
  }

  const eligibilityInfo = eligibilityInfoResult.value
  const fields = getChallengeFields(eligibilityInfo)
  const failed = fields.filter(key => !verifyChallenge(key, eligibilityInfo, challenge, accountId))
  if (failed.length > 0) {
    return ok({
      success: false,
      challenge: failed.map(key => getChallengeQuestion(context, key)),
      failed,
    })
  }
  return ok({ success: true })
}

export interface CreateEnrollmentLinkOptions {
  eligibleId?: number;
  path?: string;
  lang?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
}

export async function createEnrollmentLink(context: IContext, accountId: number, options?: CreateEnrollmentLinkOptions): Promise<Result<string, ErrCode>> {
  const {config, logger} = context

  try {
    const eligibleId = options?.eligibleId
    const lang = options?.lang

    const result = await createEnrollmentToken(context, accountId, eligibleId)

    if (result.isErr()) {
      return err(result.error)
    }

    let url = config.marketing_web?.base_url || 'https://foodsmart-devenv.com'
    
    url += options?.path || `/schedule/auth/register`
    url += `?enrollment=${result.value}`

    if (lang !== undefined) {
      url += `&locale=${lang}`
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

    if (options?.utmContent !== undefined) {
      url += `&utm_content=${options.utmContent}`
    }

    const resultShorten = await shortenLink(context, url, {length: 10, expires: {years: 1}})

    if (resultShorten.isErr()) {
      logger.error(context, 'createEnrollmentLink', 'error shortening link')
      return err(resultShorten.error)
    } else {
      url = resultShorten.value.url
    }        

    return ok(url)
  } catch(e) {
    logger.exception(context, 'createEnrollmentLink', e)
    return err(ErrCode.EXCEPTION)
  }
}

type EnrollmentHint = {
  type: EnrollmentType,
  accountId?: number,
  limitReached?: boolean,
  loginInfo?: IdentityUsageRecord['loginInfo'],
  hint?: Partial<IdentityAttributes>,
  isEligible?: boolean
}

export async function getEnrollmentHint(context: IContext, token: string): Promise<Result<EnrollmentHint, ErrCode>> {
  const TAG = 'getEnrollmentHint'
  const { logger } = context
  const enrollmentTokenResult = parseEnrollmentToken(context, token)
  if (enrollmentTokenResult.isErr()) {
    logger.error(context, TAG, 'Error parsing enrollment token', { error: enrollmentTokenResult.error })
    return err(enrollmentTokenResult.error)
  }
  const enrollmentToken = enrollmentTokenResult.value
  const { type, accountId } = enrollmentToken
  let limitReached = false
  if (accountId) {
    const canEnrollResult = await canEnrollWithAccountId(context, accountId)
    if (canEnrollResult.isErr()) {
      return err(canEnrollResult.error)
    }
    limitReached = !canEnrollResult.value
  }
  if (type === EnrollmentType.Eligibility) {
    const { eligibleId } = enrollmentToken
    const identityResult = await selectIdentity(context, { eligibleId })
    if (identityResult.isErr()) {
      logger.error(context, TAG, 'Error selecting identity from enrollment token', { error: identityResult.error, eligibleId })
      return err(identityResult.error)
    }
    const { firstName, lastName, loginInfo } = identityResult.value
    return ok({
      type,
      accountId,
      limitReached,
      loginInfo,
      hint: {
        firstName,
        lastName,
      }
    })
  }

  const isEligibleAccountResult = await isEligibleAccountId(context, accountId)
  if (isEligibleAccountResult.isErr()) {
    logger.error(context, TAG, "error checking if account id is eligible", { error: isEligibleAccountResult.error })
    return err(isEligibleAccountResult.error)
  }

  return ok({
    type,
    accountId,
    limitReached,
    isEligible: isEligibleAccountResult.value
  })
}

export async function determineAccountForEligibleUser(context: IContext, eligibilityInfo: EligibleUsersShort): Promise<Result<number | undefined, ErrCode>> {
  return ok(eligibilityInfo.account_id || undefined);
}

export default {
  canEnrollWithAccountId,
  createEnrollmentLink,
  createEnrollmentToken,
  parseEnrollmentToken,
  getEnrollmentHint,
  getVerifiedEnrollmentInfo,
}