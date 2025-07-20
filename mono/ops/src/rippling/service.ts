import { IContext } from '@mono/common/lib/context'
import { ErrCode } from "@mono/common/lib/error"
import { err, ok, Result } from "neverthrow"
import * as db from 'zapatos/db'
import '@mono/common/lib/zapatos/schema'
import * as zs from 'zapatos/schema'
import Api from './api'
import { Employee } from './api/v1'
import { User } from './api/v2'
import { z } from "zod"


const MTAG = `ops.rippling.service`
const MAX_API_CALLS = 1000;
const LIMIT = 100;

type EmployeeCompany = 'zipongo' | 'fnn'
type EmployeeRoleState = 'init' | 'hired' | 'accepted' | 'active' | 'terminated'
type EmployeeEmploymentType = 'contractor' | 'salaried_ft' | 'salaried_pt' | 'hourly_ft' | 'hourly_pt' | 'temp'


interface SyncEmployeesReport {
  upsertedEmployeeCount: number,
  insertedEmployeeCount: number,
  updatedEmployeeCount: number,
  softDeletedEmployeeCount: number,
}

export async function syncEmployees(context: IContext): Promise<Result<SyncEmployeesReport, ErrCode>> {
  const tag = `${MTAG}.syncEmployees`
  const { logger, store } = context

  try {
    const pool = await store.writer()

    let upsertedEmployeeIds: number[] = [];
    let insertedEmployeeCount = 0;
    let updatedEmployeeCount = 0;
    for (let i = 0; i <= MAX_API_CALLS; i++) {
      if (i >= MAX_API_CALLS) {
        logger.error(context, tag, 'reached max api calls', { i, MAX_API_CALLS })
        return err(ErrCode.SERVICE)
      }

      const ripplingEmployeeBatchResult = await Api.V1.getEmployeesIncludingTerminated(context, {
        limit: LIMIT,
        offset: i * LIMIT,
      })
      if (ripplingEmployeeBatchResult.isErr()) {
        logger.error(context, tag, 'error fetching employees (including terminated) from rippling')
        return err(ErrCode.SERVICE)
      }
      const ripplingEmployeeBatch = ripplingEmployeeBatchResult.value;

      if (ripplingEmployeeBatch.length === 0) {
        logger.debug(context, tag, 'no more pages')
        break;
      }

      const mappedEmployeeBatch = ripplingEmployeeBatch.map(e => mapEmployee(context, e))

      const upsertedEmployeeBatch = await db.upsert(
        'common.employee',
        mappedEmployeeBatch,
        ['rippling_id'],
        {
          returning: ['employee_id']
        }
      ).run(pool);

      upsertedEmployeeIds = upsertedEmployeeIds.concat(upsertedEmployeeBatch.map(e => e.employee_id))
      insertedEmployeeCount += upsertedEmployeeBatch.filter(e => e.$action === 'INSERT').length
      updatedEmployeeCount += upsertedEmployeeBatch.filter(e => e.$action === 'UPDATE').length
    }

    const softDeletedEmployees = await db.update(
      'common.employee',
      {
        role_state: 'deleted'
      },
      {
        employee_id: db.conditions.isNotIn(upsertedEmployeeIds),
        role_state: db.conditions.ne('deleted'),
      },
      {
        returning: ['employee_id']
      }
    ).run(pool)

    return ok({
      upsertedEmployeeCount: upsertedEmployeeIds.length,
      insertedEmployeeCount,
      updatedEmployeeCount,
      softDeletedEmployeeCount: softDeletedEmployees.length,
    })
  }
  catch (e) {
    logger.exception(context, tag, e)
    return err(ErrCode.EXCEPTION)
  }
}


const RipplingEmployeeCustomFieldsSchema = z.object({
  'Provider NPI': z.coerce.number().optional()
}).passthrough()

function mapEmployee(context: IContext, ripplingEmployee: Employee): zs.common.employee.Insertable {
  const tag = `${MTAG}.syncEmployees`
  const { logger } = context

  const customFields = RipplingEmployeeCustomFieldsSchema.parse(ripplingEmployee.customFields)

  let roleState: EmployeeRoleState | null = null;
  switch (ripplingEmployee.roleState) {
    case 'INIT':
      roleState = 'init';
      break;
    case 'HIRED':
      roleState = 'hired'
      break;
    case 'ACCEPTED':
      roleState = 'accepted';
      break;
    case 'ACTIVE':
      roleState = 'active';
      break;
    case 'TERMINATED':
      roleState = 'terminated'
      break;
    default:
      logger.warn(context, tag, 'unmapped employee role_state', ripplingEmployee.roleState)
  }

  let employmentType: EmployeeEmploymentType | null = null;
  switch (ripplingEmployee.employmentType) {
    case 'CONTRACTOR':
      employmentType = 'contractor'
      break;
    case 'SALARIED_FT':
      employmentType = 'salaried_ft'
      break;
    case 'SALARIED_PT':
      employmentType = 'salaried_pt'
      break;
    case 'HOURLY_FT':
      employmentType = 'hourly_ft'
      break;
    case 'HOURLY_PT':
      employmentType = 'hourly_pt'
      break;
    case 'TEMP':
      employmentType = 'temp'
      break;
    default:
      logger.warn(context, tag, 'unmapped employee employment_type', ripplingEmployee.employmentType)
  }

  return {
    company: 'fnn' satisfies EmployeeCompany,
    role_state: roleState,
    employment_type: employmentType,
    start_date: ripplingEmployee.startDate as any,
    end_date: ripplingEmployee.endDate as any,
    title: ripplingEmployee.title?.trim(),
    first_name: ripplingEmployee.firstName,
    last_name: ripplingEmployee.lastName,
    preferred_first_name: ripplingEmployee.preferredFirstName ? ripplingEmployee.preferredFirstName : null,
    preferred_last_name: ripplingEmployee.preferredLastName ? ripplingEmployee.preferredLastName : null,
    personal_email: ripplingEmployee.personalEmail,
    work_email: ripplingEmployee.workEmail,
    custom_fields: customFields as db.JSONValue | null,
    rippling_id: ripplingEmployee.id,
    rippling_employee_number: ripplingEmployee.employeeNumber,
    source_created_at: ripplingEmployee.createdAt as any,
    source_updated_at: ripplingEmployee.updatedAt as any,
    rippling_user_id: ripplingEmployee.userId,
  }
}

interface SyncUsersReport {
  upsertedUsersCount: number,
  insertedUsersCount: number,
  updatedUsersCount: number,
}

export async function syncUsers(context: IContext): Promise<Result<SyncUsersReport, ErrCode>> {
  const tag = `${MTAG}.syncUsers`
  const { logger, store } = context

  try {
    const pool = await store.writer()

    let nextLink: string | null = null
    let upsertedUsersCount = 0;
    let insertedUsersCount = 0;
    let updatedUsersCount = 0;
    for (let i = 0; i <= MAX_API_CALLS; i++) {
      if (i >= MAX_API_CALLS) {
        logger.error(context, tag, 'reached max api calls', { i, MAX_API_CALLS })
        return err(ErrCode.SERVICE)
      }

      const ripplinglistUsersResult = await Api.V2.listUsers(context, nextLink ? { nextLink } : undefined);
      if (ripplinglistUsersResult.isErr()) {
        logger.error(context, tag, 'error fetching users from rippling')
        return err(ErrCode.SERVICE)
      }
      const ripplinglistUsersResponse = ripplinglistUsersResult.value
      const ripplingUserBatch = ripplinglistUsersResponse.results;

      const mappedUserBatch = ripplingUserBatch.map(u => mapUser(context, u))

      const upsertedUsersBatch = await db.upsert(
        'common.rippling_user',
        mappedUserBatch,
        ['rippling_user_id'],
        {
          returning: ['rippling_user_id']
        }
      ).run(pool);

      upsertedUsersCount += upsertedUsersBatch.length
      insertedUsersCount += upsertedUsersBatch.filter(e => e.$action === 'INSERT').length
      updatedUsersCount += upsertedUsersBatch.filter(e => e.$action === 'UPDATE').length
      
      nextLink = ripplinglistUsersResponse.next_link ?? null
      if (!nextLink) {
        logger.debug(context, tag, 'no more pages', { nextLink: ripplinglistUsersResponse.next_link })
        break;
      }
    }

    return ok({
      upsertedUsersCount,
      insertedUsersCount,
      updatedUsersCount,
    })
  }
  catch (e) {
    logger.exception(context, tag, e)
    return err(ErrCode.EXCEPTION)
  }
}

function mapUser(context: IContext, ripplingUser: User): zs.common.rippling_user.Insertable {
  return {
    rippling_user_id: ripplingUser.id,
    username: ripplingUser.username,
    display_name: ripplingUser.display_name,
    active: ripplingUser.active,
    source_created_at: ripplingUser.created_at as any,
    source_updated_at: ripplingUser.updated_at as any,
  }
}


interface MapProvidersToEmployeesReport {
  populatedRipplingUserIDProviderCount: number,
  insertedProviderCount: number,
  mappedProviderCount: number,
  unmappedProviderCount: number,
  employeesWithDuplicateNPI: number
}

export async function mapProvidersToEmployees(context: IContext): Promise<Result<MapProvidersToEmployeesReport, ErrCode>> {
  const tag = `${MTAG}.mapProvidersToEmployees`
  const { logger, store } = context

  try {
    const pool = await store.writer()

    // As long as there's a matching NPI, 
    // for providers who don't already have a rippling_user_id,
    // populate rippling_user_id from common.employees (either active or inactive) 
    const providersPopulatedWithUserID = await db.sql<zs.common.employee.SQL | zs.telenutrition.schedule_provider.SQL, { provider_id: number }[]>`
      WITH distinct_employees AS (
        SELECT DISTINCT ON ((E.${'custom_fields'} ->> 'Provider NPI')::TEXT::INT) 
          (E.${'custom_fields'} ->> 'Provider NPI')::TEXT::INT AS npi,
          E.${'rippling_user_id'}
        FROM ${'common.employee'} E
        ORDER BY 
          (E.${'custom_fields'} ->> 'Provider NPI')::TEXT::INT,
          CASE 
            WHEN E.${'role_state'} = 'active' THEN 1
            ELSE 2
          END
      )
      UPDATE ${'telenutrition.schedule_provider'} AS P
      SET ${'rippling_user_id'} = DE.${'rippling_user_id'}
      FROM distinct_employees AS DE
      WHERE P.${'npi'} = DE.${'npi'} AND P.${'rippling_user_id'} IS NULL
      RETURNING P.${'provider_id'};
    `.run(pool);

    // // Before inserting any new providers, 
    // // check if any new employees has the same NPI as any existing providers.
    const employeesWithDuplicateNPI = await db.sql<zs.common.employee.SQL | zs.telenutrition.schedule_provider.SQL, { provider_id: number }[]>`
      SELECT DISTINCT ON (P.${'npi'})
      P.${'npi'}, P.${'provider_id'}, E.${'rippling_user_id'}
      FROM ${'telenutrition.schedule_provider'} P
      LEFT JOIN ${'common.employee'} E ON (E.${'custom_fields'}->>'Provider NPI')::INT = P.${'npi'}
      WHERE P.${'rippling_user_id'} <> E.${'rippling_user_id'} AND E.${'role_state'} = 'active'
    `.run(pool);

    if(employeesWithDuplicateNPI.length > 0) {
      logger.warn(context, tag, `A new employee has the same NPI as an existing provider's, please look into following data - ${JSON.stringify(employeesWithDuplicateNPI)}`);
    }

    // For any active employees who don't exist in schedule_provider, 
    // i.e. provider with the same rippling_user_id does not exist,
    // insert a new provider to the table
    const newProvidersInserted = await db.sql<zs.common.employee.SQL | zs.telenutrition.schedule_provider.SQL, { provider_id: number }[]>`
      WITH distinct_employees AS (
        SELECT DISTINCT ON (E.${'rippling_user_id'}) 
          E.${'first_name'},
          E.${'last_name'},
          (E.${'custom_fields'} ->> 'Provider NPI')::TEXT::INT AS npi,
          E.${'rippling_user_id'},
          E.${'employee_id'}
        FROM ${'common.employee'} E
        WHERE E.${'role_state'} = 'active' AND E.${'title'} IN 
            ('Registered Dietitian', 'RD Manager', 'Registered Dietitian Manager')
        ORDER BY 
          E.${'rippling_user_id'}
      )
      INSERT INTO ${'telenutrition.schedule_provider'} AS SP
       (${'first_name'}, ${'last_name'}, ${'npi'}, ${'rippling_user_id'}, ${'employee_id'})
      SELECT 
        ${'first_name'}, ${'last_name'}, ${'npi'}, ${'rippling_user_id'}, ${'employee_id'}
      FROM 
        distinct_employees AS DE
      WHERE NOT EXISTS (
          SELECT 1 
          FROM ${'telenutrition.schedule_provider'} P
          WHERE P.${'rippling_user_id'} = DE.${'rippling_user_id'} OR 
            P.${'npi'} = DE.${'npi'}
      )
      RETURNING SP.${'provider_id'};
    `.run(pool);

    // Make sure employee_id is synced up across common.employee and schedule_provider,
    // if they have the same rippling_user_id
    const mappedProviders = await db.sql<zs.common.employee.SQL | zs.telenutrition.schedule_provider.SQL, { provider_id: number }[]>`
      WITH distinct_employees AS (
        SELECT DISTINCT ON (E.${'rippling_user_id'}) 
          (E.${'custom_fields'} ->> 'Provider NPI')::TEXT::INT AS npi,
          E.${'employee_id'},
          E.${'rippling_user_id'}
        FROM ${'common.employee'} E
        ORDER BY 
          E.${'rippling_user_id'},
          CASE 
            WHEN E.${'role_state'} = 'active' THEN 1
            ELSE 2
          END,
          E.${'employee_id'} DESC
      )
      UPDATE ${'telenutrition.schedule_provider'} AS P
      SET ${'employee_id'} = DE.${'employee_id'}
      FROM distinct_employees AS DE
      WHERE P.${'rippling_user_id'} = DE.${'rippling_user_id'}
      RETURNING P.${'provider_id'};
    `.run(pool);

    const mappedProviderIds = mappedProviders.map(p => p.provider_id);

    const unmappedProviders = await db.update(
      'telenutrition.schedule_provider',
      { employee_id: null },
      { provider_id: db.conditions.isNotIn(mappedProviderIds) },
    ).run(pool)

    return ok({ 
      populatedRipplingUserIDProviderCount: providersPopulatedWithUserID.length,
      insertedProviderCount: newProvidersInserted.length,
      mappedProviderCount: mappedProviderIds.length,
      unmappedProviderCount: unmappedProviders.length,
      employeesWithDuplicateNPI: employeesWithDuplicateNPI.length
    })
  } catch (e) {
    logger.exception(context, tag, e)
    return err(ErrCode.EXCEPTION)
  }
}


export default {
  syncEmployees,
  syncUsers,
  mapProvidersToEmployees,
}