import { IContext } from "@mono/common/lib/context"
import { ErrCode } from "@mono/common/lib/error"
import { Result, err, ok } from "neverthrow"
import { Logger } from "@mono/common"
import * as  _ from "lodash"
import FoodappStore from "@mono/foodapp/lib/store"
import * as db from 'zapatos/db'
import '@mono/common/lib/zapatos/schema'
import { AccountIds } from "@mono/common/lib/account/service"
import { PaymentMethodRecord } from "../payment/store"
import { EligibilityCheckType, EligibilityStatus } from "../payment/shared"
import SafetyNetConnect from "@mono/common/lib/integration/cal-optima-connect"
import Patient from "../patient"
import Store from "./store"
import { DateTime } from "luxon"
import { EligibleUsersShort } from "@mono/foodapp/lib/store/users-eligible"

const MTAG = Logger.tag()

type EligibilityResult = { paymentMethodId: number, result: Result<EligibilityStatus, any> }

/**
 * Performs a payment eligibility check for each of the requested payment method records.
 * Checks will be delegated to the appropriate handler (in batches) based on the CheckType assosicated with the payment method type
 *
 * @param context
 * @param paymentMethods
 * @returns A list of EligibilityResult, which maps the paymentMethodId to the new eligibility status (or an error if the checked failed)
 */
export async function checkPaymentMethodsEligibility(context: IContext, paymentMethods: PaymentMethodRecord[]): Promise<EligibilityResult[]> {
  const { logger } = context
  const TAG = [...MTAG, 'checkPaymentMethodsEligibility']

  // Group methods by the check type
  const checks = _(paymentMethods)
    .uniqBy(method => method.id)
    .groupBy(method => method.type.eligibilityCheckType)
    .toPairs()
    .map(async ([key, methods]) => {
      const type = key as EligibilityCheckType
      const result = await checkPaymentMethodsEligibilityByType(context, type, methods)
      const resultIds = new Set(result.map(m => m.paymentMethodId))
      const missing = methods.map(m => m.id).filter(id => !resultIds.has(id))
      if (missing.length > 0) {
        // Payment checks should return a result for all requested methods
        logger.error(context, TAG, "missing payment check result for payment methods", { type, paymentMethodIds: missing })
      }
      return result
    }).value()

  const results = await Promise.all(checks)
  return results.flat()
}

// Perform the appropriate eligibility check based on the CheckType
async function checkPaymentMethodsEligibilityByType(context: IContext, type: EligibilityCheckType, methods: PaymentMethodRecord[]): Promise<EligibilityResult[]> {
  switch(type) {
    case 'efile':
      return checkEligiblePaymentMethods(context, methods)
    case 'snc':
      return checkSNCPaymentMethods(context, methods)
    case 'none':
      return mapEligibilityResults(methods, ok('unchecked'))
    case 'invalid':
      return mapEligibilityResults(methods, ok('invalid'))
    default:
      return mapEligibilityResults(methods, err(ErrCode.NOT_IMPLEMENTED))
  }
}

// Check eligibility using Safety Net Connect
async function checkSNCPaymentMethods(context: IContext, methods: PaymentMethodRecord[]): Promise<EligibilityResult[]> {
  const { logger } = context
  const TAG = [...MTAG, 'checkSNCPaymentMethods']

  const results: EligibilityResult[] = []
  const eligibleMethods: EligiblePaymentMethod[] = []
  for (const method of methods) {
    if (hasEligibleId(method)) {
      eligibleMethods.push(method)
    } else {
      logger.error(context, TAG, "missing eligible id for payment method", { paymentMethodId: method.id })
      results.push({ paymentMethodId: method.id, result: err(ErrCode.STATE_VIOLATION) })
    }
  }

  if (eligibleMethods.length === 0) {
    return results
  }

  const eligibleIds = _.uniq(eligibleMethods.map(row => row.eligibleId))
  const eligibleUsersResult = await FoodappStore.UsersEligible.fetchEligibleIds(context, { eligibleIds })
  if (eligibleUsersResult.isErr()) {
    logger.error(context, TAG, 'error fetching eligible users', {
      eligibleIds,
      error: eligibleUsersResult.error
    })
    return [
      ...results,
      ...mapEligibilityResults(eligibleMethods, err(eligibleUsersResult.error))
    ]
  }

  const eligibilityInfo = _.keyBy(eligibleUsersResult.value, eligibleUser => eligibleUser.id)
  for (const method of eligibleMethods) {
    const statusResult = await checkSNCPaymentMethod(context, method, eligibilityInfo[method.eligibleId])
    results.push({ paymentMethodId: method.id, result: statusResult })
  }
  return results
}

async function checkSNCPaymentMethod(context: IContext, method: PaymentMethodRecord, eligibleUser?: EligibleUsersShort): Promise<Result<EligibilityStatus, ErrCode>> {
  const { logger } = context
  const TAG = [...MTAG, 'checkSNCPaymentMethod']

  try {
    if (eligibleUser === undefined) {
      logger.error(context, TAG, "unable to find eligible user for payment method", {
        eligibleId: method.eligibleId,
      })
      return err(ErrCode.NOT_FOUND)
    }
    const parsedEligibleUserResult = eligibleUser.raw_data ? JSON.parse(eligibleUser.raw_data) : undefined
    const patientUid: string | undefined = _.get(parsedEligibleUserResult, 'PATIENT_UID')
    if (patientUid === undefined) {
      logger.error(context, TAG, 'missing patientUid checking eligibility via sncIsPatientEligible', {
        eligibleId: method.eligibleId,
      })
      return err(ErrCode.STATE_VIOLATION)
    }
    const sncIsEligibleResult = await SafetyNetConnect.isPatientEligible(context, patientUid)
    if (sncIsEligibleResult.isErr()) {
      logger.error(context, TAG, 'error checking eligibility via sncIsPatientEligible', {
        eligibleId: method.eligibleId,
        patientUid,
        error: sncIsEligibleResult.error
      })
      return err(sncIsEligibleResult.error)
    }
    const eligibilityStatus = sncIsEligibleResult.value ? 'valid' : 'invalid'
    return ok(eligibilityStatus)
  } catch(e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

function mapEligibilityResults(
  methods: PaymentMethodRecord[],
  result: EligibilityResult['result']
) {
  return methods.map(m => ({ paymentMethodId: m.id, result }))
}

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
type EligiblePaymentMethod = RequiredFields<PaymentMethodRecord, 'eligibleId'>

function hasEligibleId(record: PaymentMethodRecord): record is EligiblePaymentMethod {
  return record.eligibleId !== undefined
}

/*
 * Check payment methods that we have an e-file for
 */
async function checkEligiblePaymentMethods(context: IContext, paymentMethods: PaymentMethodRecord[]): Promise<EligibilityResult[]> {
  const { logger } = context
  const TAG = [...MTAG, 'checkEligiblePaymentMethods']
  logger.debug(context, TAG, "Checking eligible payment methods", { ids: paymentMethods.map(m => m.id)})

  const matched: EligiblePaymentMethod[] = []
  const unmatched: PaymentMethodRecord[] = []
  for (const method of paymentMethods) {
    if (hasEligibleId(method)) {
      matched.push(method)
    } else {
      unmatched.push(method)
    }
  }

  const results = await Promise.all([
    await verifyEligiblePaymentMethods(context, matched),
    await matchEligiblePaymentMethods(context, unmatched),
  ])
  return results.flat()
}

/*
 * Check payment methods that have an eligible id, to see if they still exist in our eligibility table.
 */
async function verifyEligiblePaymentMethods(context: IContext, paymentMethods: EligiblePaymentMethod[]): Promise<EligibilityResult[]> {
  const { logger } = context
  const TAG = [...MTAG, 'verifyEligiblePaymentMethods']

  const eligibleIds = _.uniq(paymentMethods.map(row => row.eligibleId))
  let existing: Set<number> = new Set()
  if (eligibleIds.length > 0) {
    const eligibleUsersResult = await FoodappStore.UsersEligible.fetchEligibleIds(context, { eligibleIds })
    if (eligibleUsersResult.isErr()) {
      logger.error(context, TAG, 'error fetching eligible users', {
        eligibleIds,
        error: eligibleUsersResult.error
      })
      return mapEligibilityResults(paymentMethods, err(eligibleUsersResult.error))
    }
    const eligibleUsers = eligibleUsersResult.value
    eligibleUsers.forEach(row => existing.add(row.id))
  }

  const [valid, invalid] = _.partition(paymentMethods, method => existing.has(method.eligibleId))
  const results: EligibilityResult[] = valid.map(method => ({ paymentMethodId: method.id, result: ok('valid') }))
  if (invalid.length > 0) {
    // try and match them anyways, in case the eligibleId changed
    const matchedResults = await matchEligiblePaymentMethods(context, invalid)
    return [
      ...results,
      ...matchedResults
    ]
  }
  return results
}

/*
 * Check payment methods that do not have an eligible id, but have a CheckType that requires one.
 * The returned status value will be one of:
 *   - 'valid' if the memberId and accountId matches an efile record
 *   - 'invalid' if the memberId does not match any record
 *   - 'undetermined' if the memberId matches a record but the accountId does not match
 *
 * In the 'valid' case, the payment method (and patient identity) will be updated with the matched eligibleId
 */
async function matchEligiblePaymentMethods(context: IContext, paymentMethods: PaymentMethodRecord[]): Promise<EligibilityResult[]> {
  const { logger } = context
  const TAG = [...MTAG, 'matchEligiblePaymentMethods']

  logger.debug(context, TAG, "Matching eligible payment methods", { ids: paymentMethods.map(m => m.id)})

  const unmatched: { method: PaymentMethodRecord, accountIds: number[], memberId: string }[] = []
  const results: EligibilityResult[] = []

  const accountPaymentMethodTypesResult = await Store.selectAccountPaymentMethodTypes(context)
  if (accountPaymentMethodTypesResult.isErr()) {
    logger.error(context, TAG, "error fetching account payment method types", {
      error: accountPaymentMethodTypesResult.error
    })
    return mapEligibilityResults(paymentMethods, err(accountPaymentMethodTypesResult.error))
  }

  const accountPaymentMethodTypes = _.groupBy(accountPaymentMethodTypesResult.value, m => m.type.id)

  for (const method of paymentMethods) {
    const { payment } = method

    const accountIds = accountPaymentMethodTypes[method.type.id]?.map(record => record.accountId) || []
    let memberId: string | undefined
    if ('member_id' in payment && payment.member_id && accountIds.length > 0) {
      memberId = normalizeMemberId(payment.member_id, accountIds[0]) // TODO
    }

    if (accountIds.length === 0 || !memberId || memberId.length === 0) {
      results.push({ paymentMethodId: method.id, result: ok('invalid')})
    } else {
      unmatched.push({
        method,
        accountIds,
        memberId
      })
    }
  }

  if (!_.isEmpty(unmatched)) {
    logger.debug(context, TAG, "Checking unmatched payment methods", { ids: unmatched.map(m => m.method.id)})
    const memberIds = unmatched.map(m => m.memberId)
    const eligibleUsersResult = await FoodappStore.UsersEligible.fetchEligibleIds(context, { memberIds })
    if (eligibleUsersResult.isErr()) {
      logger.error(context, TAG, 'error fetching eligible users', {
        memberIds,
        error: eligibleUsersResult.error
      })
      for (const { method } of unmatched) {
        results.push({ paymentMethodId: method.id, result: err(eligibleUsersResult.error )})
      }
      return results
    }

    const patientIds = unmatched.map(({ method }) => method.patientId)
    const patientsResult = await Patient.Store.selectPatientsById(context, patientIds)
    if (patientsResult.isErr()) {
      logger.error(context, TAG, 'error fetching patients', {
        patientIds,
        error: patientsResult.error
      })
      for (const { method } of unmatched) {
        results.push({ paymentMethodId: method.id, result: err(patientsResult.error) })
      }
      return results
    }

    const patients = _.keyBy(patientsResult.value, patient => patient.patientId)
    const eligibleUsers = _.groupBy(eligibleUsersResult.value, u => normalizeMemberId(u.person_id!, u.account_id ?? undefined))
    const updates: PatientPaymentEligibilityUpdate[] = []
    for (let { method, memberId, accountIds }  of unmatched) {
      const matches = eligibleUsers[memberId] || []
      const patient = patients[method.patientId]
      if (patient === undefined) {
        logger.debug(context, TAG, "unable to find patient for payment method id", { paymentMethodId: method.id })
        results.push({ paymentMethodId: method.id, result: ok('undetermined')})
        continue
      }
      if (matches.length === 0 && !method.type.eligibilityOptional) {
        results.push({ paymentMethodId: method.id, result: ok('invalid')})
        continue
      }
      const match = matches.find(match =>
        match.account_id !== null && accountIds.includes(match.account_id) &&
        patient.birthday !== undefined && compareDate(match.birthday || undefined, DateTime.fromISO(patient.birthday).toJSDate())
      )
      if (match && match.account_id) {
        updates.push({
          paymentMethodId: method.id,
          patientId: method.patientId,
          eligibleId: match.id,
          accountId: match.account_id
        })
        results.push({ paymentMethodId: method.id, result: ok('valid')})
      } else {
        if (matches.length === 0) {
          logger.debug(context, TAG, 'No matching member id found for payment method', {
            paymentMethodId: method.id
          })
        } else {
          logger.debug(context, TAG, 'Found matching member id, but not with matching account/birthday', {
            paymentMethodId: method.id
          })
        }
        results.push({ paymentMethodId: method.id, result: ok('undetermined')})
      }
    }
    // update the eligibleId for matched payment methods
    if (!_.isEmpty(updates)) {
      logger.debug(context, TAG, "Updating unmatched payment methods", { updates })
      const updateResult = await batchUpdatePatientPaymentEligibility(context, updates)
      if (updateResult.isErr()) {
        logger.error(context, TAG, "Error upating patient payment eligibility", { error: updateResult.error })
      }
    }
  }
  return results
}

export function normalizeMemberId(memberId: string, accountId?: number) {
  const normalizeMemberId = memberId.toLowerCase().trim()
  if (accountId === AccountIds.Elevance) {
    return normalizeMemberId.replace(/\D/g,'')
  }
  return normalizeMemberId
}

type PatientPaymentEligibilityUpdate = { paymentMethodId: number, patientId: number, eligibleId: number, accountId: number }

/*
 * Updates the eligibleId of the payment method, and the eligibleId/accountId of the patient (if not already set)
 */
async function batchUpdatePatientPaymentEligibility(context: IContext, updates: PatientPaymentEligibilityUpdate[]): Promise<Result<boolean, ErrCode>> {
  const { logger, store: { writer } } = context
  const TAG = [...MTAG, 'batchUpdatePatientPaymentEligibility']

  try {
    const pool = await writer()
    const patientUpdates = _.keyBy(updates, update => update.patientId)
    const patientIds = _.uniq(updates.map(u => u.patientId ))
    await db.serializable(pool, async (txnClient) => {
      const ops: any[] = []

      // update eligibileId for payment method
      for (const update of updates) {
        ops.push(db.update('telenutrition.schedule_patient_payment_method', {
          eligible_id: update.eligibleId
        }, {
          payment_method_id: update.paymentMethodId,
          patient_id: update.patientId
        }).run(txnClient))
      }
      const patients = await db.select('telenutrition.schedule_patient', {
        patient_id: db.conditions.isIn(patientIds)
      }, {
        columns: ['patient_id', 'identity_id']
      }).run(txnClient)

      for (const patient of patients) {
        const identityId = patient.identity_id
        if (identityId) {
          const update = patientUpdates[patient.patient_id]
          ops.push(db.update('telenutrition.iam_identity', {
            eligible_id: update.eligibleId,
            account_id: update.accountId
          }, {
            identity_id: identityId,
            eligible_id: db.conditions.isNull // only update if eligibleId is already null
          }).run(txnClient))
        }
      }
      await Promise.all(ops)
    })
    return ok(true)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export function compareDate(expect?: Date, actual?: Date) {
  return expect == actual ||
    (expect !== undefined && actual !== undefined &&
      DateTime.fromJSDate(expect).hasSame(DateTime.fromJSDate(actual), 'day'))
}
