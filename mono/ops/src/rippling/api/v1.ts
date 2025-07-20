import { IContext } from '@mono/common/lib/context'
import { ErrCode } from "@mono/common/lib/error"
import axios from "axios"
import { err, ok, Result } from "neverthrow"


const MTAG = `ops.rippling.api.v1`


export type Employee = {
  id: string
  userId: string
  entityId: string
  employeeNumber: number
  firstName: string
  lastName: string
  preferredFirstName: string
  preferredLastName: string
  employmentType: 'CONTRACTOR' | 'SALARIED_FT' | 'SALARIED_PT' | 'HOURLY_FT' | 'HOURLY_PT' | 'TEMP'
  title: string
  roleState: 'INIT' | 'HIRED' | 'ACCEPTED' | 'ACTIVE' | 'TERMINATED'
  startDate: string | null
  endDate: string | null
  personalEmail: string
  workEmail: string | null
  customFields: object
  createdAt: string
  updatedAt: string
  [x: string]: unknown
}


interface GetEmployeesIncludingTerminatedOptions {
  limit?: number,
  offset?: number,
}

export async function getEmployeesIncludingTerminated(context: IContext, options?: GetEmployeesIncludingTerminatedOptions): Promise<Result<Employee[], ErrCode>> {
  const tag = `${MTAG}.getEmployeesIncludingTerminated`
  const { logger, config } = context

  try {
    logger.debug(context, tag, 'fetching employees (including terminated) from the rippling api', { options })

    const ripplingConfig = config.common.rippling?.fnn
    if (!ripplingConfig) {
      logger.error(context, tag, 'unable to get the rippling config.')
      return err(ErrCode.INVALID_CONFIG);
    }
    const { host, token } = ripplingConfig;

    const { data } = await axios.get<Employee[]>(`${host}/platform/api/employees/include_terminated`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        limit: options?.limit,
        offset: options?.offset,
      }
    })

    logger.debug(context, tag, 'sucessfully fetched employees (including terminated) from the rippling api', { options, count: data.length })
    return ok(data)
  } catch (e) {
    logger.exception(context, tag, e)
    return err(ErrCode.EXCEPTION)
  }
}


export default {
  getEmployeesIncludingTerminated,
}