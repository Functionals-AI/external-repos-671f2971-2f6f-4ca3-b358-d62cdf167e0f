import { DbTransaction, IContext } from "@mono/common/lib/context"
import * as db from 'zapatos/db'
import '@mono/common/lib/zapatos/schema'
import * as zs from 'zapatos/schema'
import { ErrCode } from "@mono/common/lib/error"
import { Result, err, ok } from "neverthrow"
import { Logger } from "@mono/common"
import * as  _ from "lodash"
import { PaymentRecord } from "../scheduling-flow/types"
import { AccountRecord, mapAccountRecord } from "@mono/common/lib/account/store"
import { PaymentSchema } from "../scheduling-flow/schema"
import { AudioSupport, EligibilityCheckType, EligibilityStatus } from './shared'

const MTAG = Logger.tag()

export interface PaymentMethodRecord {
  id: number
  patientId: number
  label: string
  memberId: string | null
  payment: PaymentRecord
  type: PaymentMethodTypeRecord
  lastUsed?: Date
  eligibleId?: number
  status: string
  isValid: boolean
  lastEligibilityCheck?: Date
  oversightRequired?: boolean
}

export interface PaymentMethodTypeRecord {
  id: number
  label: string
  method: string
  insuranceId?: number
  employerId?: number
  audioSupport: AudioSupport
  followUpDurations: number[]
  eligibilityCheckType: EligibilityCheckType
  eligibilityOptional: boolean
  visible: boolean
}

export interface AccountPaymentMethodTypeRecord {
  accountId: number
  type: PaymentMethodTypeRecord
}

const VALID_PAYMENT_STATUS: EligibilityStatus[] = ['valid', 'unchecked', 'undetermined']

export function isValidPaymentStatus(status: string) {
  return VALID_PAYMENT_STATUS.some(s => status === s)
}

function mapPaymentMethodRecord(record: zs.telenutrition.schedule_patient_payment_method.JSONSelectable
  & db.LateralResult<(typeof paymentMethodOptions)['lateral']>): PaymentMethodRecord {

  let label = record.type.label

  if (record.member_id) {
    label += ` (${record.member_id})`
  }

  let lastUsed: Date | undefined
  if (record.last_used?.scheduled_at) {
    lastUsed = db.toDate(record.last_used.scheduled_at, 'UTC')
  }

  const lastEligibilityCheck = record.last_eligibility_check ? db.toDate(record.last_eligibility_check.created_at, 'UTC') : undefined

  return {
    id: record.payment_method_id,
    patientId: record.patient_id,
    label,
    memberId: record.member_id,
    payment: PaymentSchema.parse(record.data),
    eligibleId: record.eligible_id || undefined,
    lastUsed,
    type: mapPaymentMethodTypeRecord(record.type),
    isValid: isValidPaymentStatus(record.status),
    status: record.status,
    lastEligibilityCheck: lastEligibilityCheck,
    oversightRequired: record.type.payer?.oversight_required
  }
}

function mapPaymentMethodTypeRecord(record: zs.telenutrition.payment_method_type.JSONSelectable): PaymentMethodTypeRecord {
  return {
    id: record.payment_method_type_id,
    label: record.label,
    method: record.method,
    insuranceId: record.insurance_id ?? undefined,
    employerId: record.employer_id ?? undefined,
    audioSupport: record.audio_support as AudioSupport,
    followUpDurations: record.follow_up_durations,
    eligibilityCheckType: record.eligibility_check_type as EligibilityCheckType,
    eligibilityOptional: record.eligibility_optional,
    visible: record.visible
  }
}

function mapAccountPaymentMethodTypeRecord(record: zs.telenutrition.account_payment_method_type.JSONSelectable
  & db.LateralResult<{type: db.SQLFragment<zs.telenutrition.payment_method_type.JSONSelectable, never>}>
): AccountPaymentMethodTypeRecord {
  return {
    accountId: record.account_id,
    type: mapPaymentMethodTypeRecord(record.type)
  }
}

type PaymentMethodUsageParams = {
  paymentMethodId: number,
  year: number,
  rescheduleAppointmentId?: number
}

export async function getPaymentMethodUsage(context: IContext, params: PaymentMethodUsageParams): Promise<Result<number, ErrCode>> {
  const {logger, store: {reader}} = context
  const TAG = [...MTAG, 'getPaymentMethodUsage']
  const { paymentMethodId, year, rescheduleAppointmentId } = params

  try {
    const pool = await reader()
    const [{ count }] = await db.sql<zs.telenutrition.schedule_appointment.SQL, [{ count: string }]>`
      SELECT count(*)
      FROM ${'telenutrition.schedule_appointment'}
      WHERE ${{
        payment_method_id: paymentMethodId,
        frozen: false,
        status: db.conditions.ne('x'),
        start_timestamp: db.sql`DATE_PART('year', ${db.self}) = ${db.param(year)}`,
        ...(rescheduleAppointmentId && { appointment_id: db.conditions.ne(rescheduleAppointmentId)})
      }}`.run(pool);

    // TODO: once patient_payment_transaction has been backfilled
    // const [{ count }] = await db.sql<zs.telenutrition.patient_payment_transaction.SQL | zs.telenutrition.schedule_appointment.SQL, [{ count: string }]>`
    //   SELECT count(*)
    //   FROM ${'telenutrition.patient_payment_transaction'} PPT
    //   JOIN ${"telenutrition.schedule_appointment"} SA USING (${'appointment_id'})
    //   WHERE PPT.${'payment_method_id'} = ${db.param(paymentMethodId)}
    //   AND PPT.${'status'} != 'void'
    //   AND ${{
    //     start_timestamp: db.sql`DATE_PART('year', ${db.self}) = ${db.param(year)}`,
    //     ...(rescheduleAppointmentId && { appointment_id: db.conditions.ne(rescheduleAppointmentId)})
    //   }}`.run(pool)

    return ok(parseInt(count))
  } catch(e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

const paymentMethodOptions = {
  lateral: {
    type: db.selectExactlyOne('telenutrition.payment_method_type', {
      payment_method_type_id: db.parent('payment_method_type_id')
    }, {
      lateral: {
        payer: db.selectOne('telenutrition.payer', {
          payer_id: db.parent('payer_id')
        })
      }
    }),
    last_eligibility_check: db.selectOne('telenutrition.payment_eligibility_check', {
      eligibility_check_id: db.parent('last_eligibility_check_id')
    }),
    last_used: db.selectOne('telenutrition.schedule_appointment', {
      payment_method_id: db.parent('payment_method_id')
    }, {
      columns: ['scheduled_at', 'date'],
      order: { by: 'scheduled_at', direction: 'DESC'}
    })
  }
}

type AddPatientPaymentMethodParameters = {
  patientId: number,
  paymentMethodTypeId: number,
  data: {
    member_id?: string,
    group_id?: string,
    insurance_id?: number, // allow insurance_id for now to handle employers with insurance_id
  }, // TODO?
  eligibleId?: number
}

export async function insertPatientPaymentMethod(context: IContext, params: AddPatientPaymentMethodParameters): Promise<Result<number, ErrCode>> {
  const {logger, store: {writer}} = context

  const TAG = [...MTAG, 'insertPatientPaymentMethod']
  const { patientId, paymentMethodTypeId, eligibleId } = params

  try {

    const pool = await writer()

    const record = await db.selectOne('telenutrition.payment_method_type', {
      payment_method_type_id: paymentMethodTypeId
    }).run(pool)

    if (record === undefined) {
      return err(ErrCode.NOT_FOUND)
    }

    const paymentMethodType = mapPaymentMethodTypeRecord(record)

    const payment = {
      method: paymentMethodType.method,   // TODO: remove from table
      ...(paymentMethodType.insuranceId && { insurance_id: paymentMethodType.insuranceId }), // TODO: remove from table
      ...(paymentMethodType.employerId && { employer_id: paymentMethodType.employerId }),    // TODO: remove from table
      ...params.data
    }

    // TODO paymentMethodType.schema.validate(data)
    const parseResult = PaymentSchema.safeParse(payment)
    if (!parseResult.success) {
      logger.error(context, TAG, "Payment schema validation failed", { error: parseResult.error })
      return err(ErrCode.INVALID_DATA)
    }

    const { method, ...data} = payment
    let insertRecord: zs.telenutrition.schedule_patient_payment_method.Insertable = {
      patient_id: patientId,
      type: method,
      ...data,
      data: JSON.stringify(payment),
      payment_method_type_id: paymentMethodTypeId,
      eligible_id: eligibleId
    }

    const insertResult = await db.upsert("telenutrition.schedule_patient_payment_method", insertRecord, ["patient_id", "data"]).run(pool)

    return ok(insertResult.payment_method_id)
  } catch(e) {
    if (db.isDatabaseError(e, 'IntegrityConstraintViolation_UniqueViolation')) {
      logger.warn(context, TAG, "attempt to add payment method that already exists")
      return err(ErrCode.ALREADY_EXISTS)
    }
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}


type PatientPaymentMethodParams = {
  patientId?: number,
  paymentMethodId: number,
}

export async function selectPatientPaymentMethod(context: IContext, params: PatientPaymentMethodParams): Promise<Result<PaymentMethodRecord, ErrCode>> {
  const {logger, store: {reader}} = context

  const TAG = [...MTAG, 'getPatientPaymentMethod']
  const { patientId, paymentMethodId } = params


  try {
    const pool = await reader()

    const record = await db.selectOne('telenutrition.schedule_patient_payment_method', {
      ...(patientId && { patient_id: patientId }),
      payment_method_id: paymentMethodId
    }, paymentMethodOptions).run(pool)

    if (record === undefined) {
      return err(ErrCode.NOT_FOUND)
    }

    return ok(mapPaymentMethodRecord(record))
  } catch(e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

type PatientPaymentMethodsParams = {
  patientId: number,
}

export async function selectPatientPaymentMethods(context: IContext, params: PatientPaymentMethodsParams): Promise<Result<PaymentMethodRecord[], ErrCode>> {
  const {logger, store: {reader}} = context
  const TAG = [...MTAG, 'getPatientPaymentMethods']
  const { patientId } = params

  try {
    const pool = await reader()

    const records = await db.select('telenutrition.schedule_patient_payment_method', {
      patient_id: patientId,
      visible: true
    }, paymentMethodOptions).run(pool)

    const methods = records
      .map(record => mapPaymentMethodRecord(record))
      .sort((a,b) => (b.lastUsed?.getTime() ?? 0) - (a.lastUsed?.getTime() ?? 0))

    return ok(methods)
  } catch(e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export async function selectAccountPaymentMethodTypes(context: IContext, accountId?: number): Promise<Result<AccountPaymentMethodTypeRecord[], ErrCode>> {
  const {logger, store: {reader}} = context
  const TAG = [...MTAG, 'selectAccountPaymentMethodType']

  try {
    const pool = await reader()
    // Determine the default payment method type for this account
    const records = await db.select('telenutrition.account_payment_method_type', {
      ...(accountId && { account_id: accountId })
    }, {
      lateral: {
        type: db.selectExactlyOne('telenutrition.payment_method_type', {
          payment_method_type_id: db.parent('payment_method_type_id')
        })
      }
    }).run(pool)

    return ok(records.map(mapAccountPaymentMethodTypeRecord))
  } catch(e) {
    logger.exception(context,TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export async function selectPaymentMethodsById(context: IContext, paymentMethodIds: number[]): Promise<Result<PaymentMethodRecord[], ErrCode>> {
  const {logger, store: {reader}} = context
  const TAG = [...MTAG, 'selectPaymentMethodsById']

  if (paymentMethodIds.length === 0) {
    return ok([])
  }
  try {
    const pool = await reader()

    const records = await db.select('telenutrition.schedule_patient_payment_method', {
      payment_method_id: db.conditions.isIn(paymentMethodIds),
    }, paymentMethodOptions).run(pool)

    const methods = records.map(record => mapPaymentMethodRecord(record))
    return ok(methods)
  } catch(e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

type SelectAllPaymentTypesParams = {
  showHidden?: boolean,
  methodType?: string | null,
}
export async function selectPaymentMethodTypes(context: IContext, params: SelectAllPaymentTypesParams = {}): Promise<Result<PaymentMethodTypeRecord[], ErrCode>> {
  const {logger, store: {reader}} = context
  const TAG = [...MTAG, 'selectPaymentMethodTypes']

  const showHidden = params?.showHidden;
  const methodType = params?.methodType;

  try {
    const pool = await reader()
    const records = await db.select('telenutrition.payment_method_type', {
      ...(!showHidden && { visible: true }),
      ...(methodType ? { method: methodType } : {}),
    }, {
      order: { by: 'label', direction: 'ASC' }
    }).run(pool)

    return ok(records.map(mapPaymentMethodTypeRecord))
  } catch(e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export async function selectPaymentMethodTypeWithAccounts(context: IContext, paymentMethodTypeId: number): Promise<Result<PaymentMethodTypeRecord & { accounts: AccountRecord[] }, ErrCode>> {
  const {logger, store: {reader}} = context

  const TAG = [...MTAG, 'selectPaymentMethodTypeWithAccounts']

  try {
    const pool = await reader()
    const record = await db.selectOne('telenutrition.payment_method_type', {
      payment_method_type_id: paymentMethodTypeId
    }, {
      lateral: {
        accounts: db.select('telenutrition.account_payment_method_type', {
          payment_method_type_id: db.parent('payment_method_type_id')
        }, {
          lateral: {
            account: db.selectExactlyOne('common.account', {
              account_id: db.parent('account_id')
            })
          }
        })
      }
    }).run(pool)

    if (record === undefined) {
      return err(ErrCode.NOT_FOUND)
    }

    const paymentMethodType = mapPaymentMethodTypeRecord(record)

    return ok({
      ...paymentMethodType,
      accounts: record.accounts.map(account => mapAccountRecord(account.account)
      )
    })
  } catch(e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

interface PatientPaymentMethodUpdateables {
  eligibleId: number,
}

/** 
 * Update a patient payment method with allowable values to update.
 * 
 * TODO: Note, there  is  probably a useful subset of attributes that should be updateable. However,
 * this is in the context of an urgent need to  update eligible_id at the  moment.
*/
export async function updatePatientPaymentMethod(context: IContext, paymentMethodId: number, updates: PatientPaymentMethodUpdateables): Promise<Result<number, ErrCode>> {
  const {logger, store: {writer}} = context

  const TAG = [...MTAG, 'updatePatientPaymentMethod']

  try {

    const pool = await writer()

    const updateResult = await db.update("telenutrition.schedule_patient_payment_method", 
      { eligible_id: updates.eligibleId },
      { payment_method_id: paymentMethodId }      
    ).run(pool)

    if (updateResult.length === 1) {
      return ok(updateResult[0].payment_method_id)
    }
    else {
      logger.error(context, TAG, 'Failed to update payment method.', {
        updates: updateResult,
      })

      return err(ErrCode.SERVICE)
    }
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export async function voidPaymentTransactionsByAppointmentId(context: IContext, appointmentId: number, dbTxn: DbTransaction): Promise<Result<boolean, ErrCode>> {
  const { logger } = context
  const TAG = [...MTAG, 'voidPaymentTransactionsByAppointmentId']

  try {
    const updatedPaymentTransactions = await db.update(
      'telenutrition.patient_payment_transaction',
      {
        status: 'void',
        updated_at: db.conditions.now,
      },
      {
        appointment_id: appointmentId,
      }
    ).run(dbTxn);
    logger.debug(context, TAG, 'updated payment transactions for appointment id to void status', { updatedPaymentTransactions })

    return ok(true)
  } catch(e) {
    logger.error(context, TAG, 'error voiding payment transactions by appointment id', e)
    return err(ErrCode.EXCEPTION)
  }
}

export default {
  insertPatientPaymentMethod,
  selectPatientPaymentMethod,
  selectPatientPaymentMethods,
  selectPaymentMethodTypes,
  selectAccountPaymentMethodTypes,
  selectPaymentMethodTypeWithAccounts,
  selectPaymentMethodsById,
  getPaymentMethodUsage,
  updatePatientPaymentMethod,
  voidPaymentTransactionsByAppointmentId,
}
