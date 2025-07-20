import { IContext } from "@mono/common/lib/context"
import { ErrCode } from "@mono/common/lib/error"
import axios from "axios"
import { err, ok, Result } from "neverthrow"
import { authenticate } from './auth';
import { Payer } from "./types";


const MTAG = 'telenutrition.candid.api.payers'


export interface GetAllPayersApiRequest {
  limit?: number,
  search_term?: string,
  page_token?: string,
}

export interface GetAllPayersApiResponse {
  prev_page_token?: string
  next_page_token?: string
  items: Payer[]
}

export async function getPayers(context: IContext, request?: GetAllPayersApiRequest): Promise<Result<GetAllPayersApiResponse, ErrCode>> {
  const tag = `${MTAG}.getAllPayers`
  const { config, logger } = context
  const { host } = config.telenutrition.candidhealth

  try {
    const authenticateResult = await authenticate(context);
    if (authenticateResult.isErr()) {
      logger.error(context, tag, `Error authenticating with the candid api`)
      return err(ErrCode.SERVICE);
    }
    const token = authenticateResult.value;

    const { status, data } = await axios.get<GetAllPayersApiResponse>(`${host}/api/payers/v3`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        limit: request?.limit,
        search_term: request?.search_term,
        page_token: request?.page_token,
      },
    })

    return ok(data);

  } catch (e) {
    logger.exception(context, tag, e, e?.response?.data)
    return err(ErrCode.EXCEPTION)
  }
}


export default {
  getPayers
}
