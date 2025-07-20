import { IContext } from "@mono/common/lib/context";
import { ErrCode } from "@mono/common/lib/error";
import { Result, err, ok } from "neverthrow";
import { ProviderRecord } from "../scheduling/provider/shared";
import { IdTokenPayload, OktaProfile, exchangeCodeForIdTokenPayload, fetchOktaProfile } from "./api";
import Provider from "../scheduling/provider";
import { FederationIdentityRecord, FederationSource } from "../iam/types";
import { UserRecord } from "../iam/user/store";

type AppTokenData =
  | { user: UserRecord }
  | { identity: FederationIdentityRecord; user?: UserRecord };

interface FindMatchingProviderResult {
  provider: ProviderRecord,
  oktaProfile: OktaProfile,
}

interface FindMatchingProviderParams {
  tokenPayload: IdTokenPayload;
}

async function findMatchingProvider(
  context: IContext,
  params: FindMatchingProviderParams
): Promise<Result<FindMatchingProviderResult, ErrCode>> {
  const { logger } = context;
  const TAG = "auth.findMatchingProvider";

  try {
    const profileResult = await fetchOktaProfile(context, {
      accessToken: params.tokenPayload.accessToken,
    });

    if (profileResult.isErr()) {
      logger.error(context, TAG, "error fetching okta provider", {
        error: profileResult.error,
      });
      return err(profileResult.error);
    }

    const oktaProfile = profileResult.value.profile
    const { npi, firstName, lastName } = oktaProfile;

    if (npi) {
      const providerByNpiResult = await Provider.Service.getProvider(
        context,
        { npi }
      );

      if (providerByNpiResult.isOk()) {
        return ok({
          provider: providerByNpiResult.value,
          oktaProfile,
        });
      } else {
        logger.error(context, TAG, "failed to find provider using NPI", { npi, error: providerByNpiResult.error });
      }
    } else {
      logger.debug(context, TAG, "missing npi in okta profile", { oktaProfile })
    }

    if (firstName && lastName) {
      const providerByNameResult = await Provider.Service.getProviderByName(
        context,
        { firstName, lastName }
      );

      if (providerByNameResult.isOk()) {
        return ok({
          provider: providerByNameResult.value,
          oktaProfile,
      });
      }
    }

    return err(ErrCode.NOT_FOUND);
  } catch (e) {
    logger.exception(context, TAG, e as Error);
    return err(ErrCode.EXCEPTION);
  }
}

/**
 * Converts an auth code to an application token
 * Matches okta provider to provider in our system
 * Saves matching OID in schedule_provider if found
 *
 * @param context
 * @param code
 * @returns
 */
export async function handleOktaCode(
  context: IContext,
  code: string
): Promise<Result<AppTokenData, ErrCode>> {
  const { logger } = context;

  const TAG = "handleOktaCode";

  try {
    const idTokenPayloadResult = await exchangeCodeForIdTokenPayload(context, code);

    if (idTokenPayloadResult.isErr()) {
      return err(idTokenPayloadResult.error);
    }

    const idTokenPayload = idTokenPayloadResult.value

    const { sub: oid } = idTokenPayload

    const identity = {
      fid: oid,
      src: FederationSource.Okta,
    };

    // If already mapped to our system
    const providerByOidResult = await Provider.Service.getProvider(
      context,
      { oktaId: oid }
    );

    if (providerByOidResult.isOk()) {
      return ok({ identity });
    }

    // Attempt to find a match in system
    const matchedProviderResult = await findMatchingProvider(context, {
      tokenPayload: idTokenPayload,
    });

    if (matchedProviderResult.isErr()) {
      logger.error(
        context,
        TAG,
        "could not find matching provider in our system",
        { oid }
      );
      return err(ErrCode.NOT_FOUND);
    }

    const {
      provider,
      oktaProfile
    } = matchedProviderResult.value

    // Save new mapping
    await Provider.Service.updateProvider(context, {
      providerId: provider.providerId,
      oktaId: oid,
      ...( oktaProfile.email && { email: oktaProfile.email }),
    });

    return ok({ identity });
  } catch (e) {
    logger.exception(context, TAG, e as Error);
    return err(ErrCode.EXCEPTION);
  }
}

export function getAuthProviderUrl(context: IContext) {
  const {
    config: { okta },
  } = context;

  const params = new URLSearchParams({
    client_id: okta.clientId,
    response_type: "code",
    scope: "openid profile okta.myAccount.profile.read",
    redirect_uri: okta.redirectUri,
    state: "none",
  }).toString();

  return `https://${okta.host}/oauth2/v1/authorize?${params}`;
}

export default {
  handleOktaCode,
  getAuthProviderUrl,
};
