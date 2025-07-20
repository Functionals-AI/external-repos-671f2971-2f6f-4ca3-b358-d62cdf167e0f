import { IContext } from "@mono/common/lib/context"
import { ErrCode } from "@mono/common/lib/error"
import axios from "axios"
import { err, ok, Result } from "neverthrow"
import { DateTime } from "luxon"

const MTAG = 'telenutrition.candid.api.auth'

interface AuthenticateApiResponse {
  access_token: string,
  expires_in: number,
  token_type: string,
}

let _token: string | undefined = undefined;
let _tokenExpiresAtMs: number | undefined = undefined;

export async function authenticate(context: IContext): Promise<Result<string, ErrCode>> {
  const tag = `${MTAG}.authenticate`
  const { config, logger } = context
  const { host, clientId, clientSecret } = config.telenutrition.candidhealth

  try {
    // If the auth token has expired or does not exist
    if (_token === undefined || _tokenExpiresAtMs == undefined || DateTime.now().plus({ minutes: 5 }) > DateTime.fromMillis(_tokenExpiresAtMs)) {

      const { status, data } = await axios.post<AuthenticateApiResponse>(`${host}/api/auth/v2/token`,
        {
          client_id: clientId,
          client_secret: clientSecret,
        },
        {
          validateStatus: () => true,
        }
      )

      if (status !== 200) {
        logger.error(context, tag, `Error authenticating with the candid api`, { status, data })
        return err(ErrCode.SERVICE)
      }

      _token = data.access_token
      _tokenExpiresAtMs = Date.now() + (data.expires_in * 1000);

      logger.info(context, tag, `Authenticated with the candid api`, { _tokenExpiresAtMs })
    }

    return ok(_token);

  } catch (e) {
    logger.exception(context, tag, e)
    return err(ErrCode.EXCEPTION)
  }
}
