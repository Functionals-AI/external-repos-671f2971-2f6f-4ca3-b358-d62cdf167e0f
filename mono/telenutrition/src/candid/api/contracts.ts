import { IContext } from "@mono/common/lib/context"
import { ErrCode } from "@mono/common/lib/error"
import axios from "axios"
import { err, ok, Result } from "neverthrow"
import { authenticate } from './auth';
import { AuthorizedSignatory, Contract, OrganizationProvider2, Payer, Regions } from "./types";

const MTAG = 'telenutrition.candid.api.contracts'




export interface GetContractsApiRequest {
  skip?: number,
  limit?: number,
  contracting_provider_id?: string,
  contract_status?: string
}

export type GetContractsApiResponse = Contract[]

export async function getContracts(context: IContext, request?: GetContractsApiRequest): Promise<Result<GetContractsApiResponse, ErrCode>> {
  const tag = `${MTAG}.getContracts`
  const { config, logger } = context
  const { host } = config.telenutrition.candidhealth

  try {
    const authenticateResult = await authenticate(context);
    if (authenticateResult.isErr()) {
      logger.error(context, tag, `Error authenticating with the candid api`)
      return err(ErrCode.SERVICE);
    }
    const token = authenticateResult.value;

    const { status, data } = await axios.get<GetContractsApiResponse>(`${host}/api/v1/contracts`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: request,
    })

    return ok(data);

  } catch (e) {
    logger.exception(context, tag, e, e?.response?.data)
    return err(ErrCode.EXCEPTION)
  }
}


export type CreateContractApiRequest = {
  effective_date: string
  expiration_date?: string
  regions?: Regions
  contract_status?: string
  authorized_signatory?: AuthorizedSignatory
  contracting_provider_id: string
  rendering_provider_ids: string[]
  payer_uuid: string
}


export type CreateContractApiResponse = Contract;

export async function createContract(context: IContext, request?: CreateContractApiRequest): Promise<Result<CreateContractApiResponse, ErrCode>> {
  const tag = `${MTAG}.createContract`
  const { config, logger } = context
  const { host } = config.telenutrition.candidhealth

  try {
    const authenticateResult = await authenticate(context);
    if (authenticateResult.isErr()) {
      logger.error(context, tag, `Error authenticating with the candid api`)
      return err(ErrCode.SERVICE);
    }
    const token = authenticateResult.value;

    const { status, data } = await axios.post<CreateContractApiResponse>(`${host}/api/v1/contracts`, request, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    return ok(data);

  } catch (e) {
    logger.exception(context, tag, e, e?.response?.data)
    return err(ErrCode.EXCEPTION)
  }
}


export type UpdateContractApiRequest = {
  rendering_provider_ids?: Array<string>
  effective_date?: string
  expiration_date?: string
  regions?: Regions
  contract_status?: string
  authorized_signatory?: AuthorizedSignatory
}

export type UpdateContractApiResponse = Contract;

export async function updateContract(context: IContext, contractId: string, request?: UpdateContractApiRequest): Promise<Result<UpdateContractApiResponse, ErrCode>> {
  const tag = `${MTAG}.updateContract`
  const { config, logger } = context
  const { host } = config.telenutrition.candidhealth

  try {
    const authenticateResult = await authenticate(context);
    if (authenticateResult.isErr()) {
      logger.error(context, tag, `Error authenticating with the candid api`)
      return err(ErrCode.SERVICE);
    }
    const token = authenticateResult.value;

    const { status, data } = await axios.patch<UpdateContractApiResponse>(`${host}/api/v1/contracts/${contractId}`, request, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    return ok(data);

  } catch (e) {
    logger.exception(context, tag, e, e?.response?.data)
    return err(ErrCode.EXCEPTION)
  }
}


export default {
  getContracts,
  createContract,
  updateContract,
}
