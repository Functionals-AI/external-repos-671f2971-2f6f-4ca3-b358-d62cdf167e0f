import { IContext } from "@mono/common/lib/context"
import * as db from 'zapatos/db'
import '@mono/common/lib/zapatos/schema'
import * as zs from 'zapatos/schema'
import { ErrCode } from "@mono/common/lib/error"
import { err, ok, Result } from "neverthrow"
import { EmployerRecord } from "./types"

function mapEmployerRecord(record: zs.telenutrition.schedule_employer.JSONSelectable): EmployerRecord {
  return {
    employerId: record.employer_id,
    label: record.label,
    ...(record.special_program && {specialProgram: record.special_program}),
    ...(record.insurance_package_id !== null && {insurancePackageId: record.insurance_package_id})
  }
}

export async function getEmployersList(context: IContext): Promise<Result<EmployerRecord[], ErrCode>> {
  const {logger, store: {reader}} = context

  try {
    const pool = await reader()
    const records = await db.select('telenutrition.schedule_employer', { visible: true }, {
      order: { by: 'label', direction: 'ASC' }
    }).run(pool)

    return ok(records.map(mapEmployerRecord))
  } catch(e) {
    logger.exception(context, 'employer.store.getEmployersList', e)
    return err(ErrCode.EXCEPTION)
  }
}

export async function selectEmployer(context: IContext, employerId: number): Promise<Result<EmployerRecord, ErrCode>> {
  const {logger, store: {reader}} = context

  try {
    const pool = await reader()
    const record = await db.selectOne('telenutrition.schedule_employer', {employer_id: employerId}).run(pool)

    if (record === undefined) {
      return err(ErrCode.NOT_FOUND)
    }

    const employer = mapEmployerRecord(record)

    logger.info(context, 'Scheduling.Employer.Store.selectEmployer', `Retrieved employer record.`, {
      employer_id: employerId,
      record,
      employer,
    })

    return ok(employer)
  } catch(e) {
    logger.exception(context, 'employer.store.selectEmployer', e)
    return err(ErrCode.EXCEPTION)
  }
}

export default {
  selectEmployer,
  getEmployersList
}