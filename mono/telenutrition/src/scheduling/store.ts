import { IContext } from '@mono/common/lib/context'
import { ErrCode } from '@mono/common/lib/error'
import '@mono/common/lib/zapatos/schema'
import { Result, err, ok } from 'neverthrow'
import * as s from 'zapatos/schema'
import * as db from 'zapatos/db'
import _ = require('lodash')

export interface DepartmentRecord {
  departmentId: number,
  name: string,
  state: string,
  timezone: string,
}

function mapDepartmentRecord(record: s.telenutrition.schedule_department.JSONSelectable): DepartmentRecord {
  return {
    departmentId: record.department_id,
    name: record.name,
    state: record.state,
    timezone: record.timezone,
  }
}

async function fetchDepartmentByState(context: IContext, state: string): Promise<Result<DepartmentRecord, ErrCode>> {
  const {logger, store: {reader}} = context

  try {
    const pool = await reader()
    const department = await db.selectOne('telenutrition.schedule_department', {state}).run(pool)

    if (department === undefined) {
      return err(ErrCode.NOT_FOUND)
    }

    return ok(mapDepartmentRecord(department))
  } catch(e) {
    logger.exception(context, 'TAG', e)
    return err(ErrCode.EXCEPTION)
  }
}

async function fetchDepartment(context: IContext, departmentId: number): Promise<Result<DepartmentRecord, ErrCode>> {
  const {logger, store: {reader}} = context

  try {
    const pool = await reader()
    const department = await db.selectOne('telenutrition.schedule_department', {
      department_id: departmentId,
    }).run(pool)

    if (department === undefined) {
      return err(ErrCode.NOT_FOUND)
    }

    return ok(mapDepartmentRecord(department))
  } catch(e) {
    logger.exception(context, 'TAG', e)
    return err(ErrCode.EXCEPTION)
  }
}

export default {
  fetchDepartment,
  fetchDepartmentByState,
}