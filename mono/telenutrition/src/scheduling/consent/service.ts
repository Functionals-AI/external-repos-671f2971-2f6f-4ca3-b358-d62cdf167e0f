import { DbTransaction, IContext } from "@mono/common/lib/context";
import Logger from "@mono/common/lib/logger";
import { Result, err, ok } from "neverthrow";
import { ErrCode } from "@mono/common/lib/error";
import * as db from "zapatos/db";
import * as zs from "zapatos/schema";
import Customerio from "@mono/common/lib/integration/customerio"
import Twilio from "@mono/common/lib/integration/twilio"
import { DateTime } from "luxon";

const CURRENT_APP_CONSENT_VERSION = '1.0';
const CURRENT_PROVIDER_CONSENT_VERSION = '1.0';

enum ConsentType {
  APP = "app",
  PROVIDER = "provider",
}

export enum ConsentSource {
  MEMBER = 1,
  CALL_CENTER = 2,
  REFERRER = 3,
}

const MTAG = Logger.tag();

export type InsertUserAppConsentParameters = {
  identityId: number;
  consentSource: ConsentSource;
};

type InsertUserAppConsentReturl =
  zs.telenutrition.schedule_consent.JSONSelectable;

export async function insertUserAppConsent(
  context: IContext,
  parameters: InsertUserAppConsentParameters
): Promise<Result<InsertUserAppConsentReturl, ErrCode>> {
  const {
    logger,
    store: { writer },
  } = context;
  const TAG = [...MTAG, "insertUserAppConsent"];

  try {
    const pool = await writer();

    const record = await db
      .insert("telenutrition.schedule_consent", {
        identity_id: parameters.identityId,
        version: CURRENT_APP_CONSENT_VERSION,
        consented_at: new Date(),
        consent_type: ConsentType.APP,
        source: parameters.consentSource,
      })
      .run(pool);

    return ok(record);
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

interface InsertPatientProviderConsentParameters {
  identityId: number;
  consentSource: ConsentSource
}

export async function insertPatientProviderConsent(
  context: IContext,
  parameters: InsertPatientProviderConsentParameters,
  dbTxn?: DbTransaction,
): Promise<Result<boolean, ErrCode>> {
  const { logger, store: { writer } } = context;
  const TAG = [...MTAG, 'insertPatientProviderConsent']

  try {
    const pool = await writer();

    await db.insert('telenutrition.schedule_consent', {
      source: parameters.consentSource,
      version: CURRENT_APP_CONSENT_VERSION,
      consent_type: ConsentType.PROVIDER,
      consented_at: new Date(),
      identity_id: parameters.identityId,
    }).run(dbTxn ?? pool);

    return ok(true);
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

type UserHasAppConsentParameters = {
  identityId: number;
};

export async function userHasAppConsent(
  context: IContext,
  parameters: UserHasAppConsentParameters
): Promise<Result<boolean, ErrCode>> {
  const {
    logger,
    store: { reader },
  } = context;
  const TAG = [...MTAG, "userHasAppConsent"];

  try {
    const pool = await reader();

    const consentRecord = await db
      .selectOne("telenutrition.schedule_consent", {
        identity_id: parameters.identityId,
        consent_type: ConsentType.APP,
        version: CURRENT_APP_CONSENT_VERSION,
      })
      .run(pool);

    return ok(consentRecord !== undefined);
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

type SendConsentLinksToPatientParameters =
  | {
      email: string;
    }
  | {
      phone: string;
    };

export async function sendConsentLinksToPatient(
  context: IContext,
  parameters: SendConsentLinksToPatientParameters
): Promise<Result<true, ErrCode>> {
  const { logger, config, i18n } = context;
  const TAG = [...MTAG, "sendConsentLinksToPatient"];

  try {
    const termsUrl = `${config.telenutrition_web.baseUrl}/legal/app-terms`;
    const privacyUrl = `${config.telenutrition_web.baseUrl}/legal/privacy`;
    const disclaimerUrl = `${config.telenutrition_web.baseUrl}/legal/disclaimer`;
    const emailMessage = `${i18n.__(
      `Please review the following:`
    )}:   <a href="${termsUrl}">${i18n.__(
      "Terms of Service"
    )}</a>   <a href="${privacyUrl}">${i18n.__(
      "Privacy Policy"
    )}</a>   <a href="${disclaimerUrl}">${i18n.__("Disclaimer")}</a>`;

    const smsMessage = `${i18n.__(
      `Please review the following: `
    )}:\n\n${i18n.__("Terms of Service")}: ${termsUrl}\n${i18n.__(
      "Privacy Policy"
    )}: ${privacyUrl}\n${i18n.__("Disclaimer")}: ${disclaimerUrl}`;

    if ("email" in parameters) {
      logger.debug(context, TAG, "Sending patient consent forms via email");
      const result = await Customerio.Api.sendEmail(context, {
        to: parameters.email,
        identifiers: {
          id: parameters.email,
        },
        from: config.env === 'production' ? "no-reply@foodsmart.com" : "no-reply@foodsmart-dev.com",
        body: emailMessage,
        subject: i18n.__("Foodsmart App Consent Requested"),
      });

      if (result.isErr()) {
        logger.error(context, TAG, "Could not send cio email", {
          errors: result.error,
        });
        return err(ErrCode.SERVICE);
      }
    } else if ("phone" in parameters) {
      logger.debug(context, TAG, "Sending patient consent forms via phone");
      const result = await Twilio.Api.sendSMS(context, {
        to: parameters.phone,
        body: smsMessage,
      });

      if (result.isErr()) {
        logger.error(context, TAG, "Could not send twilio email", {
          errors: result.error,
        });
        return err(ErrCode.SERVICE);
      }
    } else {
      logger.error(context, TAG, "Must send consent forms to email or phone");
      return err(ErrCode.STATE_VIOLATION);
    }

    return ok(true);
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

interface GetLastProviderConsentParameters {
  identityId: number;
}

export async function getLastProviderConsent(context: IContext, parameters: GetLastProviderConsentParameters): Promise<Result<zs.telenutrition.schedule_consent.JSONSelectable | null, ErrCode>> {
  const { store: { reader }, logger } = context;
  const TAG = [...MTAG, 'getLastProviderConsent']

  try {
    const pool = await reader();

    const consentResult = await db.selectOne('telenutrition.schedule_consent', {
      identity_id: parameters.identityId,
      consent_type: ConsentType.PROVIDER,
      version: CURRENT_PROVIDER_CONSENT_VERSION,
    }).run(pool);

    if (consentResult === undefined) {
      return ok(null);
    }

    return ok(consentResult)
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}


interface HasProviderConsentParameters {
  identityId: number;
}

/**
 * schedule_consent must have record with same version, consent_type PROVIDER that
 * is less than one year old
 */
export async function hasValidProviderConsent(context: IContext, parameters: HasProviderConsentParameters): Promise<Result<boolean, ErrCode>> {
  const { store: { reader }, logger } = context;
  const TAG = [...MTAG, 'hasValidProviderConsent']

  try {
    const pool = await reader();

    const consentResult = await db.selectOne('telenutrition.schedule_consent', {
      identity_id: parameters.identityId,
      consent_type: ConsentType.PROVIDER,
      version: CURRENT_PROVIDER_CONSENT_VERSION,
    }).run(pool);

    const consentedAt = consentResult?.consented_at

    if (!consentedAt) {
      return ok(false);
    }

    const earliestValidConsentDate = DateTime.now().minus({ years: 1 })
    const consentHasExpired = DateTime.fromJSDate(db.toDate(consentedAt, 'UTC')) > earliestValidConsentDate

    return ok(consentHasExpired)
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

export default {
  insertUserAppConsent,
  userHasAppConsent,
  sendConsentLinksToPatient,
  hasValidProviderConsent,
  insertPatientProviderConsent,
  getLastProviderConsent,
};
