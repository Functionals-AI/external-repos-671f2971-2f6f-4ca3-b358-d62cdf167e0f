import { Logger } from "@mono/common"
import { IContext } from "@mono/common/lib/context"
import { ErrCode } from "@mono/common/lib/error"
import * as https from 'https'
import axios from "axios"
import { err, ok, Result } from "neverthrow"

const MTAG = Logger.tag()

export interface RegisterUserOptions {
  username: string,
  password?: string,
  member_id: string,
  subdomain: string,
  is_password_hashed: boolean,
}

export async function registerUser(context: IContext, payload: RegisterUserOptions): Promise<Result<number, ErrCode>> {
  const TAG = [...MTAG, 'registerUser']
  const { logger, config } = context

  try {
    // this is only needed for devenv
    if (config.isDevenv) {
      const httpsAgent = new https.Agent({
        rejectUnauthorized: false,
      })
      axios.defaults.httpsAgent = httpsAgent
    }
  
    const zipongoApiBase = config.telenutrition.scheduling.zipongo_app_api_base
    const { status, data } = await axios.post(`${zipongoApiBase}/auth/registerUser`, payload, {
      headers: {
        "x-zipongo-ua": 'telenutrition-api'
      }
    })

    if (status !== 200) {
      logger.error(context, 'service', 'auto create enterprise app account error')
      return err(ErrCode.SERVICE)
    }

    logger.info(context, `POST ${zipongoApiBase}/auth/registerUser`, `auto create enterprise app account succeeded`)
    return ok(data.payload.user_id)

  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export default {
  registerUser,
}