import * as _ from "lodash";
import { IContext } from "@mono/common/lib/context";
import Store from "./store";
import {
  ReferrerRecord,
  ReferralRecord,
  InsertReferrerRecord,
  InsertReferralRecord,
  CreateEligibleUserPayload,
  ReferralData,
} from "./types";
import { Result, ok, err } from "neverthrow";
import { ErrCode } from "@mono/common/lib/error";
import * as zs from "zapatos/schema";
import FoodappStore from "@mono/foodapp/lib/store";
import { FederationSource, IdentityRecord } from "../../iam/types";
import { isFederationIdentity } from "../../iam/identity/service";
import { UsersEligibleStoreRecord } from "@mono/foodapp/lib/store/users-eligible";
import { DateTime } from "luxon";

const organizationRequiresEligibleUserCreation = (orgId: number): boolean => {
  // Cigna Maternity is org 3
  return orgId === 3;
};

const mapOrganizationId = (orgId: number): number => {
  if (orgId === 3) {
    return 193;
  }

  return orgId;
};

export async function getReferrer(
  context: IContext,
  where: zs.telenutrition.schedule_referrer.Whereable
): Promise<Result<ReferrerRecord | null, ErrCode>> {
  const result = await Store.getReferrer(context, where);

  if (result.isErr()) {
    return err(result.error);
  }

  return ok(result.value);
}

export async function getOrCreateReferrer(
  context: IContext,
  referrer: InsertReferrerRecord
): Promise<Result<ReferrerRecord, ErrCode>> {
  const { logger } = context;

  try {
    const foundResult = await getReferrer(context, { email: referrer.email });

    if (foundResult.isErr()) {
      return err(foundResult.error);
    }

    if (foundResult.value) {
      return ok(foundResult.value);
    }

    // If not found, create new referrer
    const createdReferrerResult = await createReferrer(context, referrer);

    if (createdReferrerResult.isErr()) {
      logger.error(
        context,
        "referrer.service.getOrCreateReferrer",
        "could not create new referrer record"
      );
      return err(createdReferrerResult.error);
    }

    return ok(createdReferrerResult.value);
  } catch (e) {
    logger.exception(context, "referrer.service.getReferrerId", e);
    return err(ErrCode.EXCEPTION);
  }
}

async function createReferrer(
  context: IContext,
  referrer: InsertReferrerRecord
): Promise<Result<ReferrerRecord, ErrCode>> {
  const { logger } = context;

  try {
    const result = await Store.insertReferrer(context, referrer);

    if (result.isErr()) {
      return err(result.error);
    }

    return ok(result.value);
  } catch (e) {
    logger.exception(context, "referrer.service.createReferrer", e);
    return err(ErrCode.EXCEPTION);
  }
}

export async function createReferral(
  context: IContext,
  referralRecord: InsertReferralRecord
): Promise<
  Result<{ referral: ReferralRecord }, ErrCode>
> {
  const { logger } = context;

  try {

    if (referralRecord.type == 'referrer') {
      const referrerResult = await getReferrer(context, {
        referrer_id: referralRecord.referrerId,
      });

      if (referrerResult.isErr()) {
        return err(referrerResult.error);
      }

      if (referrerResult.value === null) {
        logger.error(
          context,
          "referral.service.createReferral",
          "no referrer found for this referrerId",
          referralRecord
        );
        return err(ErrCode.NOT_FOUND);
      }
    }

    const insertResult = await Store.insertReferral(context, referralRecord);

    if (insertResult.isErr()) {
      return err(insertResult.error);
    }

    return ok({ referral: insertResult.value });
  } catch (e) {
    logger.exception(context, "referrer.service.createReferral", e);
    return err(ErrCode.EXCEPTION);
  }
}

export async function getReferral(
  context: IContext,
  referralId: number
): Promise<Result<ReferralRecord, ErrCode>> {
  const result = await Store.getReferral(context, { referral_id: referralId });

  if (result.isErr()) {
    return err(result.error);
  }

  return ok(result.value);
}

export async function updateReferral(
  context: IContext,
  referralId: number,
  updates: Pick<ReferralRecord, 'appointmentId' | 'patientId'>,
): Promise<Result<boolean, ErrCode>> {
  const result = await Store.updateReferral(context, referralId, updates)

  if (result.isErr()) {
    return err(result.error);
  }

  return ok(result.value);
}

export async function shouldCreateEligibleUser(
  context: IContext,
  identity: IdentityRecord,
  orgId: number,
  memberId: string
): Promise<
  Result<
    { shouldCreate: true } | { shouldCreate: false; reason: string },
    ErrCode
  >
> {
  const { logger } = context;

  try {
    const isReferralFlow =
      isFederationIdentity(identity) &&
      identity.src === FederationSource.Referral;

    if (!isReferralFlow) {
      return ok({
        shouldCreate: false,
        reason: "this is not a referral token",
      });
    }

    if (!organizationRequiresEligibleUserCreation(orgId)) {
      return ok({
        shouldCreate: false,
        reason: "Organization does not requiere creating eligible user",
      });
    }

    const existingEligibleUsers =
      await FoodappStore.UsersEligible.fetchEligibleUsers(context, {
        organization_id: orgId,
        person_id: memberId,
      });

    if (existingEligibleUsers.isErr()) {
      return err(existingEligibleUsers.error);
    }

    if (existingEligibleUsers.value && existingEligibleUsers.value.length > 0) {
      return ok({
        shouldCreate: false,
        reason: "Eligible user already exists",
      });
    }

    return ok({ shouldCreate: true });
  } catch (e) {
    logger.exception(context, "referrer.service.shouldCreateEligibleUser", e);
    return err(ErrCode.EXCEPTION);
  }
}

export async function createEligibleUser(
  context: IContext,
  record: CreateEligibleUserPayload
): Promise<Result<UsersEligibleStoreRecord, ErrCode>> {
  const { logger } = context;

  try {
    const insertRecord = {
      ..._.omit(record, "birthday", "organization_id"),
      ...(record.birthday
        ? { birthday: DateTime.fromISO(record.birthday).toFormat("yyyy-MM-dd HH:mm:ss") }
        : {}),
      organization_id: mapOrganizationId(record.organization_id),
    };

    const insertResult = await FoodappStore.UsersEligible.insertEligibleUser(
      context,
      insertRecord
    );

    if (insertResult.isErr()) {
      return err(insertResult.error);
    }

    return ok(insertResult.value);
  } catch (e) {
    logger.exception(context, "referrer.service.createEligibleUser", e);
    return err(ErrCode.EXCEPTION);
  }
}

interface CreateEligibleUserIfNeededParams {
  identity: IdentityRecord,
  data: ReferralData;
}

export async function createEligibleUserIfNeeded(
  context: IContext,
  params: CreateEligibleUserIfNeededParams
): Promise<Result<null | UsersEligibleStoreRecord, ErrCode>> {
  const { logger } = context
  const { identity, data } = params
  if ("insurance_id" in data && data.member_id && data.insurance_id) {
    const { member_id, insurance_id } = data
    const shouldCreateResult = await shouldCreateEligibleUser(
      context,
      identity,
      insurance_id,
      member_id
    );

    if (shouldCreateResult.isErr()) {
      logger.error(context, 'api.scheduling.postAppointment', 'error checking if eligible user needs to be created')
    } else if (shouldCreateResult.value.shouldCreate) {

      const createPayload: CreateEligibleUserPayload = {
        person_id: member_id,
        organization_id: insurance_id,
        firstname: data.first_name,
        lastname: data.last_name,
        birthday: data.dob,
        gender: data.sex,
        mobile_phone: data.phone_mobile,
        address: data.address,
        city: data.address_city,
        state: data.address_state,
        email: data.email,
        group_id: data.group_id,
      };

      const createResult = await createEligibleUser(context, createPayload);

      if (createResult.isErr()) {
        logger.error(context, 'api.scheduling.postAppointment', 'error creating eligible user', { createPayload })
        return err(createResult.error)
      }

      return ok(createResult.value)
    }
  }
  return ok(null) // TODO?
}

export default {
  shouldCreateEligibleUser,
  createEligibleUser,
  createReferrer,
  getOrCreateReferrer,
  createReferral,
  getReferrer,
  getReferral,
  updateReferral,
  createEligibleUserIfNeeded,
};
