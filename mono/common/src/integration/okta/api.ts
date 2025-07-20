
import { IContext } from '../../context';
import { err, ok, Result } from 'neverthrow';
import { ErrCode } from '../../error';
import { Logger } from '../..';
import axios from 'axios';
import { IConfig } from '../../config';
import { createSignedJWT, createDPoP } from './service';
import { parse as parseLinkHeader} from 'http-link-header';

const MTAG = Logger.tag();

interface TokenResponse {
  token_type: string;
  expires_in: number;
  access_token: string;
  scope: string;
}

// Request a new access token with the given scope. The scope must exist in the apps grant collection
async function getAccessToken(context: IContext, scope: string): Promise<Result<TokenResponse, ErrCode>> {
  const {
    logger,
    config: { okta },
  } = context;

  const TAG = [...MTAG, 'getAccessToken'];

  try {
    const endpoint = `https://${okta.host}/oauth2/v1/token`;
    const fetchToken = async (nonce?: string) => {
      const [ dpopResult, jwtResult ] = await Promise.all([
        createDPoP(context, {
          method: 'POST',
          endpoint,
          ...(nonce && { nonce })
        }),
        createSignedJWT(context, endpoint),
      ])

      if (jwtResult.isErr()) {
        logger.error(context, TAG, "Error creating jwt", { error: jwtResult.error })
        return err(jwtResult.error)
      }
      if (dpopResult.isErr()) {
        logger.error(context, TAG, "Error creating dpop", { error: dpopResult.error })
        return err(dpopResult.error)
      }

      const response = await axios.post<TokenResponse>(
        endpoint,
        {
          grant_type: 'client_credentials',
          scope: scope,
          client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
          client_assertion: jwtResult.value,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'DPoP': dpopResult.value,
            'User-Agent': 'foodsmart/mono'
          },
          validateStatus: () => true,
        },
      );

      if (response.status !== 200) {
        const nonceHeader = response.headers['dpop-nonce']
        if (nonceHeader && !nonce) {
          return fetchToken(nonceHeader)
        }
        logger.error(context, TAG, `Error creating okta access token`, {
          httpCode: response.status,
          data: response.data
        });
        return err(ErrCode.SERVICE);
      }
      return ok(response.data)
    }
    return fetchToken()
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

interface OktaAppUserData {
  id: string;
  externalId: string;
  profile?: {
    email?: string;
  }
}

type OktaApp = keyof IConfig['okta']['appIds'];
export async function fetchAppData(context: IContext, app: OktaApp): Promise<Result<OktaAppUserData[], ErrCode>> {
  const {
    logger,
    config: { okta },
  } = context;

  const TAG = [...MTAG, 'fetchAppData'];

  let result: OktaAppUserData[] = [];
  try {
    const tokenResult = await getAccessToken(context, 'okta.apps.read');
    if (tokenResult.isErr()) {
      logger.error(context, TAG, 'error getting okta auth token', { error: tokenResult.error });
      return err(ErrCode.AUTHENTICATION);
    }

    const token = tokenResult.value;
    const appId = okta.appIds[app];
    const endpoint = `https://${okta.host}/api/v1/apps/${appId}/users`;

    let url = `${endpoint}?limit=200`;
    do {
      const dpopResult = await createDPoP(context, {
        method: 'GET',
        endpoint,
        token: token.access_token,
      });
      if (dpopResult.isErr()) {
        logger.error(context, TAG, `error creating  dpop`, { appId, error: dpopResult.error });
        return err(dpopResult.error);
      }

      const { status, data, headers } = await axios.get<OktaAppUserData[]>(url, {
        headers: {
          Authorization: `DPoP ${token.access_token}`,
          DPoP: dpopResult.value,
          'Content-Type': 'application/json;okta-version=1.0.0',
          Accept: 'application/json;okta-version=1.0.0',
          'Accept-Language': 'en-US',
          'User-Agent': 'foodsmart/mono',
        },
        validateStatus: () => true,
      });

      if (status !== 200) {
        logger.error(context, TAG, `error fetching app users`, { appId, status, data, url });
        return err(ErrCode.SERVICE);
      }

      for (const { id, externalId, profile } of data) {
        result.push({ id, externalId, profile });
      }

      const linkHeader = parseLinkHeader(headers['link']);
      url = linkHeader?.rel('next')?.[0]?.uri;
    } while (url);

    return ok(result);
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

export default {
  fetchAppData,
};
