import { IContext } from "@mono/common/lib/context"
import * as db from 'zapatos/db'
import '@mono/common/lib/zapatos/schema'
import * as zs from 'zapatos/schema'
import { ErrCode } from "@mono/common/lib/error"
import { err, ok, Result } from "neverthrow"
import { InsuranceRecord, InsuranceWithPayerRecord } from './service'

const MTAG = ['telenutrition', 'scheduling', 'insurance', 'store']

function mapInsuranceRecord(record: zs.telenutrition.schedule_insurance.JSONSelectable): InsuranceRecord {
  return {
    insuranceId: record.insurance_id,
    label: record.label,
    packageId: record.package_id,
  }
}

function mapInsuranceWithPayerRecord(record: zs.telenutrition.schedule_insurance.JSONSelectable & db.LateralResult<{
  payer: db.SQLFragment<zs.telenutrition.payer.JSONSelectable | undefined, never>;
}>): InsuranceWithPayerRecord {
  return {
    ...mapInsuranceRecord(record),
    payer: record.payer ? {
      payerId: record.payer.payer_id,
      rosterCheck: record.payer.roster_check,
      enrollmentCheck: record.payer.enrollment_check,
    } : undefined
  }
}

export async function getInsuranceList(context: IContext): Promise<Result<InsuranceRecord[], ErrCode>> {
  const {logger, store: {reader}} = context
  const TAG = [...MTAG, 'getInsuranceList']

  try {
    const pool = await reader()
    const records = await db.select('telenutrition.schedule_insurance', { visible: true }, {
      order: { by: 'label', direction: 'ASC' }
    }).run(pool)

    return ok(records.map(mapInsuranceRecord))
  } catch(e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export async function selectInsurance(context: IContext, insuranceId: number): Promise<Result<InsuranceRecord, ErrCode>> {
  const {logger, store: {reader}} = context
  const TAG = [...MTAG, 'selectInsurance']

  try {
    const pool = await reader()
    const record = await db.selectOne('telenutrition.schedule_insurance', {insurance_id: insuranceId}).run(pool)

    if (record === undefined) {
      return err(ErrCode.NOT_FOUND)
    }

    return ok(mapInsuranceRecord(record))
  } catch(e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export async function selectInsuranceWithPayer(context: IContext, insuranceId: number): Promise<Result<InsuranceWithPayerRecord, ErrCode>> {
  const { logger, store: { reader } } = context
  const TAG = [...MTAG, 'selectInsuranceWithPayer']

  try {
    const pool = await reader()
    const record = await db.selectOne(
      'telenutrition.schedule_insurance',
      { insurance_id: insuranceId },
      {
        lateral: {
          payer: db.selectOne('telenutrition.payer', { payer_id: db.parent('payer_id') })
        },
      }
    ).run(pool);

    if (!record) {
      return err(ErrCode.NOT_FOUND)
    }

    return ok(mapInsuranceWithPayerRecord(record))
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export default {
  selectInsurance,
  getInsuranceList,
  selectInsuranceWithPayer,
}