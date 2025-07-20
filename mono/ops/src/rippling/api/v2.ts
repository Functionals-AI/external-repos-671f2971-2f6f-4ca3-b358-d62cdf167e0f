import { IContext } from '@mono/common/lib/context'
import { ErrCode } from "@mono/common/lib/error"
import axios from "axios"
import { err, ok, Result } from "neverthrow"


const MTAG = `ops.rippling.api.v2`


export type User = {
  id: string
  updated_at: string
  created_at: string
  active: boolean
  username: string
  display_name: string,
  [x: string]: unknown
}

interface ListUsersOptions {
  nextLink?: string,
}

interface ListUsersResponse {
  __meta: object,
  results: User[],
  next_link?: string | null,
}

export async function listUsers(context: IContext, options?: ListUsersOptions): Promise<Result<ListUsersResponse, ErrCode>> {
  const tag = `${MTAG}.listUsers`
  const { logger, config } = context

  try {
    logger.debug(context, tag, 'fetching users from the rippling v2 api')

    const ripplingConfig = config.common.rippling?.fnnV2
    if (!ripplingConfig) {
      logger.error(context, tag, 'unable to get the rippling config.')
      return err(ErrCode.INVALID_CONFIG);
    }
    const { host, token } = ripplingConfig;

    const { data } = await axios.get<ListUsersResponse>(options?.nextLink ?? `${host}/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    logger.debug(context, tag, 'sucessfully fetched users from the rippling v2 api', { count: data.results.length, nextLink: data.next_link, ripplingMeta: data.__meta })
    return ok(data)
  } catch (e) {
    logger.exception(context, tag, e)
    return err(ErrCode.EXCEPTION)
  }
}


export default {
  listUsers,
}