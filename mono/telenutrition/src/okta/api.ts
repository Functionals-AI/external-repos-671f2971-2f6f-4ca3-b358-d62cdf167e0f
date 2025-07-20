import { IContext } from "@mono/common/lib/context";
import { ErrCode } from "@mono/common/lib/error";
import axios from "axios";
import { Result, err, ok } from "neverthrow";
import { peekJsonWebToken } from "../iam/auth";

interface AuthenticateApiResponse {
  token_type: string;
  expires_in: string;
  access_token: string;
  scope: string;
  id_token: string;
}

export interface IdTokenPayload {
  sub: string;
  accessToken: string;
}

interface FetchOktaProfileParams {
  accessToken: string;
}

// This list can change without our knowing... proceed with caution
type OktaProfileData = {
  profileUrl: string;
  lastName: string;
  preferredLanguage: string;
  displayName: string;
  timezone: string;
  login: string;
  title: string;
  locale: string;
  employeeNumber: unknown;
  division: unknown;
  honorificSuffix: string;
  department: string;
  email: string;
  manager: string;
  nickName: string;
  costCenter: unknown;
  UserRoles: unknown;
  secondEmail: string;
  honorificPrefix: string;
  managerId: unknown;
  zip_email: string;
  firstName: string;
  mobilePhone: unknown;
  organization: string;
  middleName: string;
  userType: string;
  npi: number;
};

export type OktaProfile = Partial<Nullable<OktaProfileData>>

type Nullable<T> = { [K in keyof T]: T[K] | null };

interface OktaProfileResponse {
  createdAt: string;
  modifiedAt: string;
  profile: OktaProfile;
  _links: {
    self: {
      href: string;
    };
    describedBy: {
      href: string;
    };
  };
}

export async function fetchOktaProfile(
  context: IContext,
  params: FetchOktaProfileParams
): Promise<Result<OktaProfileResponse, ErrCode>> {
  const {
    logger,
    config: { okta },
  } = context;

  const TAG = "identity.auth.getOktaProfile";

  try {
    const { status, data } = await axios.get<OktaProfileResponse>(
      `https://${okta.host}/idp/myaccount/profile`,
      {
        headers: {
          Authorization: `Bearer ${params.accessToken}`,
          "Content-Type": "application/json;okta-version=1.0.0",
          Accept: "application/json;okta-version=1.0.0",
          "Accept-Language": "en-US",
        },
      }
    );

    if (status !== 200) {
      logger.error(context, TAG, `error fetching okta profile`, { status });
      return err(ErrCode.SERVICE);
    }

    return ok(data);
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

export async function exchangeCodeForIdTokenPayload(
  context: IContext,
  code: string
): Promise<Result<IdTokenPayload, ErrCode>> {
  const {
    config: { okta },
    logger,
  } = context;

  const params = new URLSearchParams();
  params.append("grant_type", "authorization_code");
  params.append("redirect_uri", okta.redirectUri);
  params.append("code", code);

  const { status, data } = await axios.post<AuthenticateApiResponse>(
    `https://${okta.host}/oauth2/v1/token`,
    params,
    {
      auth: {
        username: okta.clientId,
        password: okta.clientSecret,
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      validateStatus: () => true,
    }
  );

  if (status !== 200) {
    logger.error(
      context,
      `identity.auth.exchangeCode`,
      `error exchanging code`,
      { status }
    );
    return err(ErrCode.SERVICE);
  }
  const idToken = data.id_token;

  // Don't need to verify jwt, since we are exchanging directly over ssl
  const result = peekJsonWebToken(context, idToken);

  if (result.isErr()) {
    logger.error(
      context,
      `identity.auth.exchangeCode`,
      `unable to peek into json token`,
      { error: result.error, idToken }
    );
    return err(ErrCode.INVALID_DATA);
  }

  const tokenPayload = result.value;
  if (!("sub" in tokenPayload)) {
    logger.error(
      context,
      `identity.auth.parseFederationToken`,
      `payload missing sub field`,
      { payload: JSON.stringify(tokenPayload) }
    );
    return err(ErrCode.INVALID_DATA);
  }

  if (!("name" in tokenPayload)) {
    logger.error(
      context,
      `identity.auth.parseFederationToken`,
      `payload missing name field`,
      { payload: JSON.stringify(tokenPayload) }
    );
    return err(ErrCode.INVALID_DATA);
  }

  return ok({
    sub: tokenPayload["sub"] as string,
    accessToken: data.access_token,
  });
}

export default {
  exchangeCodeForIdTokenPayload,
  fetchOktaProfile,
};
