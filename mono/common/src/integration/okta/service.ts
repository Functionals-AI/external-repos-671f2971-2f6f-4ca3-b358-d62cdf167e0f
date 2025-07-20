import { IContext } from '../../context';
import { err, ok, Result } from 'neverthrow';
import { ErrCode } from '../../error';
import { Logger } from '../..';
import {
  DescribeKeyCommand,
  SignCommand,
  GetPublicKeyCommand
} from '@aws-sdk/client-kms';
import { createPublicKey, randomBytes, createHash } from 'crypto';

const MTAG = Logger.tag();

export const OKTA_KEY_ALIAS = 'alias/okta-auth';
export const OKTA_DPOP_KEY_ALIAS = 'alias/okta-dpop';

// standard names https://www.rfc-editor.org/rfc/rfc7515.html#section-4.1
export interface JwtHeader {
  [key: string]: any;
  alg: string;
  typ?: string;
  kid?: string;
}

// standard claims https://datatracker.ietf.org/doc/html/rfc7519#section-4.1
export interface JwtPayload {
  [key: string]: any;
  iss?: string;
  sub?: string;
  aud?: string;
  exp?: number;
  iat?: number;
  jti?: string;
}

type CreateDPoPParams = {
  endpoint: string;
  method: 'GET' | 'PUT' | 'POST' | 'DELETE';
  token?: string;
  nonce?: string;
};

export async function exportJwk(context: IContext, keyId: string): Promise<Result<any, ErrCode>> {
  const {
    logger,
    aws: { kms },
  } = context;

  const TAG = [...MTAG, 'exportJwk'];

  const res = await kms.send(new GetPublicKeyCommand({ KeyId: keyId }));
  if (!res.PublicKey) {
    logger.error(context, TAG, 'unable to load public key', { keyId });
    return err(ErrCode.NOT_FOUND);
  }
  const pk = createPublicKey({ key: Buffer.from(res.PublicKey), format: 'der', type: 'spki' });
  const jwk = pk.export({ format: 'jwk' });
  const kid = res.KeyId?.match(/:key\/(.*?)($|\/)/)?.[1]

  return ok({
    ...jwk,
    ...(kid && { kid }),
  })
}

export async function createDPoP(context: IContext, { endpoint, method, token, nonce }: CreateDPoPParams) {
  const {
    logger,
  } = context;

  const TAG = [...MTAG, 'createDPoP'];

  const jwkResult = await exportJwk(context, OKTA_DPOP_KEY_ALIAS)
  if (jwkResult.isErr()) {
    logger.error(context, TAG, 'unable to export dpop jwk', { error: jwkResult.error });
    return err(jwkResult.error);
  }
  const jwk = jwkResult.value

  const header = {
    alg: 'RS256',
    typ: 'dpop+jwt',
    jwk: jwk,
  };

  const payload = {
    htu: endpoint,
    htm: method,
    ...(nonce && { nonce }),
    ...(token && { ath: createHash('sha256').update(token).digest('base64url') }),
  };

  return signJwt(context, {
    keyId: OKTA_DPOP_KEY_ALIAS,
    header,
    payload,
  });
}

type SignJwtParams = {
  keyId: string;
  header: JwtHeader;
  payload: JwtPayload;
  expiresIn?: number;
};
async function signJwt(context: IContext, { keyId, header, payload, expiresIn = 5 }: SignJwtParams) {
  const {
    logger,
    aws: { kms },
  } = context;

  const TAG = [...MTAG, 'signJwt'];

  const now = Math.floor(Date.now() / 1000);
  payload = {
    iat: now,
    exp: now + (60 * expiresIn),
    jti: randomBytes(32).toString('hex'),
    ...payload,
  };

  const token = [header, payload]
    .map((component) => Buffer.from(JSON.stringify(component)).toString('base64url'))
    .join('.');

  const command = new SignCommand({
    KeyId: keyId,
    Message: Buffer.from(token),
    SigningAlgorithm: 'RSASSA_PKCS1_V1_5_SHA_256',
    MessageType: 'RAW',
  });
  const res = await kms.send(command);

  if (!res.Signature) {
    logger.error(context, TAG, 'KMS Signature undefined');
    return err(ErrCode.SERVICE);
  }

  const signature = Buffer.from(res.Signature).toString('base64url');
  return ok(`${token}.${signature}`);
}

export async function createSignedJWT(context: IContext, endpoint: string): Promise<Result<string, ErrCode>> {
  const {
    logger,
    aws: { kms },
    config: { okta },
  } = context;

  const TAG = [...MTAG, 'createSignedJWT'];

  try {
    const keyData = await kms.send(
      new DescribeKeyCommand({
        KeyId: OKTA_KEY_ALIAS,
      }),
    );
    const kid = keyData.KeyMetadata?.KeyId;
    if (!kid) {
      logger.error(context, TAG, 'KMS KeyId undefined');
      return err(ErrCode.SERVICE);
    }

    const header = {
      alg: 'RS256',
      typ: 'JWT',
      kid,
    };

    let payload = {
      aud: endpoint,
      iss: okta.serviceClientId,
      sub: okta.serviceClientId,
    };

    return signJwt(context, {
      keyId: kid,
      header,
      payload,
    });
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

export default {
  createSignedJWT,
  createDPoP,
  exportJwk,
};
