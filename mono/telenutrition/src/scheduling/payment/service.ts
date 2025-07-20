import { DbTransaction, IContext } from "@mono/common/lib/context"
import { ErrCode } from "@mono/common/lib/error"
import { Result, err, ok } from "neverthrow"
import { Logger } from "@mono/common"
import * as  _ from "lodash"
import { PaymentRecord } from "../scheduling-flow/types"
import { InsuranceId } from "../insurance/service"
import Store, { PaymentMethodRecord, PaymentMethodTypeRecord, isValidPaymentStatus } from "./store"
import { EligibilityStatus } from "./shared"
import { EnrollmentEligibilityInfo, fetchEligibilityInfo } from "../../iam/enrollment"
import { BenefitsChallenge, getPaymentCoverage, performBenefitsCheck } from "../benefits/service"
import { PaymentCoverage } from "../benefits/shared"
import { hasCoverageWithPaymentMethod } from "../service"
import * as db from 'zapatos/db'
import * as zs from 'zapatos/schema'
import '@mono/common/lib/zapatos/schema'
import { DateTime } from "luxon"
import { AppointmentRecord } from "../appointment/types"
import { checkPaymentMethodsEligibility } from "./eligibility"

const MTAG = Logger.tag()

type AddPatientPaymentMethodParameters = {
  patientId: number,
  payment: PaymentRecord,
  birthday?: Date
}

export type PaymentMethodWithCoverage = PaymentMethodRecord & {
  coverage: PaymentCoverage
}

export async function addPatientPaymentMethod(context: IContext, params: AddPatientPaymentMethodParameters): Promise<Result<number, ErrCode | BenefitsChallenge>> {
  const {logger} = context

  const TAG = [...MTAG, 'addPatientPaymentMethod']

  const { patientId, payment } = params

  // Until the patient portal is revised to send the paymentMethodTypeId,
  // just try and match one by method/insurance_id/employer_id
  const paymentTypesResult = await Store.selectPaymentMethodTypes(context)
  if (paymentTypesResult.isErr()) {
    logger.error(context, TAG, "error fetching payment method types", { error: paymentTypesResult.error })
    return err(paymentTypesResult.error)
  }

  const paymentMethodType = paymentTypesResult.value.find(p => p.method == payment.method && (
    payment.method === 'self-pay' ||
    (payment.method === 'employer' && payment.employer_id === p.employerId) ||
    (payment.method === 'plan' && payment.insurance_id === p.insuranceId)
  ))

  if (paymentMethodType === undefined) {
    logger.error(context, TAG, "unable to find matching payment method type", { payment })
    return err(ErrCode.NOT_FOUND)
  }

  const eligibleResult = await performBenefitsCheck(context, {
    ...params,
    paymentMethodTypeId: paymentMethodType.id
  })
  if (eligibleResult.isErr()) {
    return err(eligibleResult.error)
  }

  if (!eligibleResult.value.success) {
    return err(eligibleResult.value.challenge)
  }

  const eligibleId = eligibleResult.value.eligibleId

  return Store.insertPatientPaymentMethod(context, {
    patientId,
    paymentMethodTypeId: paymentMethodType.id,
    data: {
      ...('member_id' in payment && { member_id: payment.member_id }),
      ...('group_id' in payment && { group_id: payment.group_id }),
      ...('insurance_id' in payment && { insurance_id: payment.insurance_id })
    },
    eligibleId
  })
}

type CreateDefaultPaymentForPatientParams = {
  patientId: number
  eligibleId?: number
  accountId?: number
}

export async function createDefaultPaymentForPatient(context: IContext, params: CreateDefaultPaymentForPatientParams): Promise<Result<boolean, ErrCode>> {
  const { logger } = context

  const TAG = [...MTAG, 'createDefaultPaymentForPatient']
  const { patientId, eligibleId } = params

  let accountId = params.accountId
  let eligibilityInfo: EnrollmentEligibilityInfo | undefined

  // Handle case where accountId is missing...
  if (eligibleId) {
    const eligibilityResult = await fetchEligibilityInfo(context, eligibleId)
    if (eligibilityResult.isErr()) {
      logger.error(context, TAG, 'Error fetching eligible user info', { error: eligibilityResult.error })
      return err(eligibilityResult.error)
    }
    eligibilityInfo = eligibilityResult.value
    accountId = eligibilityInfo.accountId ?? params.accountId
  }

  if (!accountId) return ok(false)

  const accountPaymentMethodTypesResult = await Store.selectAccountPaymentMethodTypes(context, accountId)
  if (accountPaymentMethodTypesResult.isErr()) {
    logger.error(context, TAG, 'Error fetching default payment type for account', { error: accountPaymentMethodTypesResult.error })
    return err(accountPaymentMethodTypesResult.error)
  }

  const paymentMethodTypes = accountPaymentMethodTypesResult.value

  // Only create default payment for 1-1 mappings
  if (paymentMethodTypes.length !== 1) {
    logger.error(context, TAG, 'Skipping default payment creation', { accountId, matches: paymentMethodTypes.length })
    return ok(false)
  }

  const defaultPaymentType = paymentMethodTypes[0].type

  if (defaultPaymentType.method === 'plan' && eligibilityInfo === undefined) {
    logger.debug(context, TAG, "Skipping default payment method creation for plan with no eligibility info", {
      patientId,
      accountId,
      defaultPaymentType
    })
    return ok(false)
  }

  let data: Record<string,any> = {}
  if (eligibilityInfo !== undefined) {
    const memberId = eligibilityInfo.memberId
    if (!memberId) return ok(false)

    data = {
      member_id: memberId,
      // TODO: define mapping in account_payment_method_type for eligible fields to payment method fields?
      ...(defaultPaymentType.insuranceId === InsuranceId.Cigna && { group_id: eligibilityInfo.suborganizationId })
    }
  }

  const paymentResult = await Store.insertPatientPaymentMethod(context, {
    patientId,
    paymentMethodTypeId: defaultPaymentType.id,
    data,
    eligibleId,
  })

  if (paymentResult.isErr()) {
    logger.error(context, TAG, 'error creating default payment method for patient', { error: paymentResult.error })
    return err(paymentResult.error)
  }
  return ok(true)
}

type PatientPaymentMethodParams = {
  patientId: number,
  paymentMethodId: number,
}

export async function getPatientPaymentMethod(context: IContext, params: PatientPaymentMethodParams): Promise<Result<PaymentMethodRecord, ErrCode>> {
  const {logger} = context
  const TAG = [...MTAG, 'getPatientPaymentMethod']

  return Store.selectPatientPaymentMethod(context, {
    patientId: params.patientId,
    paymentMethodId: params.paymentMethodId
  })
}

type PatientPaymentMethodsParams = {
  patientId: number,
}

export async function getPatientPaymentMethods(context: IContext, params: PatientPaymentMethodsParams): Promise<Result<PaymentMethodWithCoverage[], ErrCode>> {
  const {logger} = context
  const TAG = [...MTAG, 'getPatientPaymentMethods']

  const methodsResult = await Store.selectPatientPaymentMethods(context, {
    patientId: params.patientId
  })

  if (methodsResult.isErr()) {
    logger.error(context, TAG, 'error selecting patient payment methods', {
      patientId: params.patientId,
      error: methodsResult.error
    })
    return err(methodsResult.error)
  }

  const paymentMethods = methodsResult.value
  const currentYear = DateTime.now().year

  const paymentMethodsWithCoverage: PaymentMethodWithCoverage[] = []
  for (const method of paymentMethods) {
    const coverageResult = await getPaymentCoverage(context, { paymentMethod: method, year: currentYear })
    if (coverageResult.isErr()) {
      logger.error(context, TAG, 'error getting coverage for patient payment method', {
        patientId: params.patientId,
        paymentMethodId: method.id,
        error: coverageResult.error
      })
      return err(coverageResult.error)
    }
    paymentMethodsWithCoverage.push({
      ...method,
      coverage: coverageResult.value
    })
  }
  return ok(paymentMethodsWithCoverage)
}

type DefaultPaymentMethodParams = {
  patientId: number,
  appointment?: AppointmentRecord,
  rescheduleAppointmentId?: number,
  preferredPaymentMethodId?: number,
  patientPaymentMethods?: PaymentMethodWithCoverage[],
}

// Return the first method that has an insurance or employer id
export async function getDefaultPaymentMethod(context: IContext, params: DefaultPaymentMethodParams): Promise<Result<PaymentMethodWithCoverage, ErrCode>> {
  const { logger } = context
  const TAG = [...MTAG, 'getDefaultPaymentMethod']
  const { patientId, appointment } = params

  let patientPaymentMethods = params.patientPaymentMethods;
  if (!patientPaymentMethods) {
    const result = await getPatientPaymentMethods(context, { patientId });
    if (result.isErr()) {
      return err(result.error);
    }
    patientPaymentMethods = result.value;
  }

  // TODO: Don't allow invalid payment methods as a default
  // Need a way for admins to update payment methods first?
  // const validPaymentMethods = result.value.filter(m => m.isValid)

  // Allow self-pay as last resort
  const methods = _.sortBy(patientPaymentMethods, (p) => {
    if (p.id === params.preferredPaymentMethodId) {
      return 0 // sort first
    }
    if (p.payment.method === 'self-pay') {
      return 2 // sort last
    }
    return 1
  })

  // Prioritize valid payment methods for now
  const defaultMethods = _.sortBy(methods, method => method.isValid ? 0 : 1)

  if (defaultMethods.length == 0) {
    return err(ErrCode.NOT_FOUND)
  }

  if (appointment) {
    for (const paymentMethod of defaultMethods) {
      const canBookResult = await hasCoverageWithPaymentMethod(context, {
        appointment,
        paymentMethod,
        rescheduleAppointmentId: params.rescheduleAppointmentId
      })

      if (canBookResult.isErr()) {
        logger.error(context, TAG, 'error checking if appointment can be booked with payment method', {
          appointmentId: appointment.appointmentId,
          paymentMethodId: paymentMethod.id
        })
        return err(canBookResult.error)
      }
      if (canBookResult.value) {
        return ok(paymentMethod)
      }
    }
    logger.debug(context, TAG, 'no payment method method has remaining coverage for appointment', {
      patientId,
      appointmentId: appointment.appointmentId
    })
    return err(ErrCode.PAYMENT_LIMIT_REACHED)
  }
  return ok(defaultMethods[0])
}

export async function getAllPaymentMethods(context: IContext, methodType?: string | null): Promise<Result<PaymentMethodTypeRecord[], ErrCode>> {
  const {logger} = context
  const TAG = [...MTAG, 'getAllPaymentMethods']

  const methodsResult = await Store.selectPaymentMethodTypes(context, {methodType: methodType })

  if (methodsResult.isErr()) {
    logger.error(context, TAG, 'error selecting all payment method types', {
      methodType: methodType,
      error: methodsResult.error
    })
    return err(methodsResult.error)
  }

  return ok(methodsResult.value)
}

/**
 * Performs an eligibility check against all payment methods tied to
 * appointments occuring on the given date.
 */
export async function performAppointmentEligibilityChecks(context: IContext, date: Date): Promise<Result<boolean, ErrCode>> {
  const {logger, store: {reader}} = context
  const TAG = [...MTAG, 'performAppointmentEligibilityChecks']

  try {
    const pool = await reader()
    const paymentMethodIds = await db.select("telenutrition.schedule_appointment", {
      status: 'f',
      payment_method_id: db.conditions.isNotNull,
      start_timestamp: db.sql<zs.telenutrition.schedule_appointment.SQL>`DATE(${db.self}) = ${db.param(date) }`
    }, {
      columns: ['payment_method_id'],
      distinct: 'payment_method_id'
    }).run(pool)

    if (paymentMethodIds.length > 0) {
      const result = await performEligibilityChecks(context, paymentMethodIds.map(row => row.payment_method_id!))

      if (result.isErr()) {
        return err(result.error)
      }
    }
    return ok(true)
  } catch(e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export async function performEligibilityCheck(context: IContext, paymentMethodId: number): Promise<Result<boolean, ErrCode>> {
  const {logger, config} = context
  const TAG = [...MTAG, 'performEligibilityCheck']


  const result = await performEligibilityChecks(context, [paymentMethodId])
  if (result.isErr()) {
    logger.error(context, TAG, 'error checking eligiblity', {
      paymentMethodId,
      error: result.error
    })
    return err(result.error)
  }

  const statusResult = result.value[paymentMethodId]
  if (statusResult.isErr()) {
    logger.error(context, TAG, 'error checking eligiblity status', {
      paymentMethodId,
      error: statusResult.error
    })
    return err(statusResult.error)
  }
  return ok(isValidPaymentStatus(statusResult.value))
}

export async function performEligibilityChecks(context: IContext, paymentMethodIds: number[]): Promise<Result<Record<number, Result<EligibilityStatus, any>>, ErrCode>> {
  const {logger, store: {writer}, config} = context
  const TAG = [...MTAG, 'performEligibilityChecks']

  const selectResult = await Store.selectPaymentMethodsById(context, paymentMethodIds)
  if (selectResult.isErr()) {
    logger.error(context, TAG, "error selecting payment methods", { paymentMethodIds, error: selectResult.error })
    return err(selectResult.error)
  }

  const paymentMethods = selectResult.value

  // Existing status values
  const statusValues: Record<number, Result<EligibilityStatus, any>> = paymentMethods.reduce((res, m) => {
    res[m.id] = ok(m.status)
    return res
  }, {})

  const freshDate = DateTime.now().minus({ days: config.isProduction ? 1 : 0 })
  const stalePaymentMethods = paymentMethods.filter(
    m => !m.lastEligibilityCheck ||
    DateTime.fromJSDate(m.lastEligibilityCheck) < freshDate
  )

  const results = await checkPaymentMethodsEligibility(context, stalePaymentMethods)

  const inserts: zs.telenutrition.payment_eligibility_check.Insertable[] = []
  for (const { paymentMethodId, result } of results) {
    statusValues[paymentMethodId] = result
    if (result.isErr()) {
      inserts.push({
        payment_method_id: paymentMethodId,
        status: 'error',
        meta: {
          trace: context.trace,
          error: result.error
        }
      })
    } else {
      const status = result.value
      if (status !== 'unchecked') {
        inserts.push({
          payment_method_id: paymentMethodId,
          status
        })
      }
    }
  }

  try {
    const pool = await writer()
    if (inserts.length > 0) {
      // https://github.com/jawj/zapatos/issues/127
      const query = db.sql<zs.telenutrition.payment_eligibility_check.SQL | zs.telenutrition.schedule_patient_payment_method.SQL>`
        WITH ec AS (
          INSERT INTO ${'telenutrition.payment_eligibility_check'} (${db.cols(inserts[0])})
          VALUES ${inserts.flatMap((row, i) => [ ...(i > 0 ? [db.sql`,`] : []), db.sql`(${db.vals(row)})`])}
          RETURNING *
        )
        UPDATE ${'telenutrition.schedule_patient_payment_method'} pm SET
          ${'last_eligibility_check_id'} = ec.${'eligibility_check_id'},
          ${'status'} = ec.${'status'}
        FROM ec
        WHERE pm.${'payment_method_id'} = ec.${'payment_method_id'}
        AND ec.${'status'} != ${db.param('error')}
      `
      await query.run(pool)
    }

    return ok(paymentMethodIds.reduce((res, id) => {
      res[id] = statusValues[id] ?? ok('invalid')
      return res
    }, {}))
  } catch(e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export async function isPaymentMethodOwner(context: IContext, params: { paymentMethodId: number, userId: number }): Promise<Result<boolean, ErrCode>> {
  const { logger, store: { reader }} = context
  const TAG = [...MTAG, 'isPaymentMethodOwner']

  try {
    const pool = await reader()
    const method = await db.selectOne('telenutrition.schedule_patient_payment_method', {
      payment_method_id: params.paymentMethodId,
    }, {
      lateral: {
        owner: db.selectOne('telenutrition.schedule_user_patient', {
          patient_id: db.parent('patient_id'),
        })
      }
    }).run(pool)
    return ok(method?.owner?.user_id === params.userId)
  } catch(e) {
    logger.error(context, TAG, 'error checking payment method owner', e)
    return err(ErrCode.EXCEPTION)
  }
}

interface CreatePaymentTransactionParams {
  patientId: number;
  paymentMethodId: number;
  appointmentId: number;
}

export async function createPaymentTransaction(context: IContext, params: CreatePaymentTransactionParams, dbTxn?: DbTransaction): Promise<Result<boolean, ErrCode>> {
  const { logger, store } = context
  const TAG = [...MTAG, 'createPaymentTransaction']

  try {
    const wPool = await store.writer()

    const insertedPaymentTransaction = await db.insert(
      'telenutrition.patient_payment_transaction',
      {
        status: 'unknown',
        patient_id: params.patientId,
        payment_method_id: params.paymentMethodId,
        appointment_id: params.appointmentId,
      }
    ).run(dbTxn ?? wPool);
    logger.debug(context, TAG, 'inserted payment transaction', { insertedPaymentTransaction });

    return ok(true)
  } catch(e) {
    logger.error(context, TAG, 'error creating payment transaction', e)
    return err(ErrCode.EXCEPTION)
  }
}

export default {
  addPatientPaymentMethod,
  getPatientPaymentMethod,
  getPatientPaymentMethods,
  getDefaultPaymentMethod,
  getAllPaymentMethods,
  createDefaultPaymentForPatient,
  performEligibilityCheck,
  performEligibilityChecks,
  performAppointmentEligibilityChecks,
  isPaymentMethodOwner,
  createPaymentTransaction,
}
