import { IContext } from "@mono/common/lib/context";
import * as zs from "zapatos/schema";
import * as db from "zapatos/db";
import { ErrCode } from "@mono/common/lib/error";
import { err, ok, Result } from "neverthrow";
import {
  ReferrerRecord,
  ReferralRecord,
  ReferralData,
  InsertReferrerRecord,
  InsertReferralRecord,
} from "./types";

export async function insertReferrer(
  context: IContext,
  record: InsertReferrerRecord
): Promise<Result<ReferrerRecord, ErrCode>> {
  const {
    logger,
    store: { writer },
  } = context;

  try {
    const pool = await writer();

    const insertable: zs.telenutrition.schedule_referrer.Insertable = {
      first_name: record.firstName,
      last_name: record.lastName,
      email: record.email,
      org_id: record.orgId,
      ...(record.credentials && { credentials: record.credentials }),
    };

    const referrer = await db
      .insert("telenutrition.schedule_referrer", insertable)
      .run(pool);

    return ok({
      referrerId: referrer.referrer_id,
      firstName: referrer.first_name,
      lastName: referrer.last_name,
      email: referrer.email,
      ...(referrer.credentials && { credentials: referrer.credentials }),
      ...(referrer.organization && { organization: referrer.organization }),
      ...(referrer.org_id && { orgId: referrer.org_id }),
    });
  } catch (e) {
    logger.exception(context, "TAG", e);
    return err(ErrCode.EXCEPTION);
  }
}

export async function getReferrer(
  context: IContext,
  where: zs.telenutrition.schedule_referrer.Whereable
): Promise<Result<ReferrerRecord | null, ErrCode>> {
  const {
    logger,
    store: { reader },
  } = context;

  try {
    const pool = await reader();

    const record = await db
      .selectOne("telenutrition.schedule_referrer", where)
      .run(pool);

    if (record === undefined) {
      return ok(null);
    }

    return ok({
      referrerId: record.referrer_id,
      firstName: record.first_name,
      lastName: record.last_name,
      email: record.email,
      ...(record.credentials && { credentials: record.credentials }),
      ...(record.organization && { organization: record.organization }),
      ...(record.org_id && { orgId: record.org_id }),
    });
  } catch (e) {
    logger.exception(context, "TAG", e);
    return err(ErrCode.EXCEPTION);
  }
}

export async function insertReferral(
  context: IContext,
  record: InsertReferralRecord
): Promise<Result<ReferralRecord, ErrCode>> {
  const {
    logger,
    store: { writer },
  } = context;

  try {
    const pool = await writer();

    const insertable: zs.telenutrition.schedule_referral.Insertable = {
      referrer_id: record.referrerId,
      referral_source: 'teleapp',
      patient_id: record.patientId,
      appointment_id: record.appointmentId,
      icd10_codes: record.icd10Codes,
      type: record.type,
      data: record.data
    };

    const referral = await db
      .insert("telenutrition.schedule_referral", insertable)
      .run(pool);

    return ok(mapReferralRecord(referral));
  } catch (e) {
    logger.exception(context, "TAG", e);
    return err(ErrCode.EXCEPTION);
  }
}


export async function getReferral(
  context: IContext,
  where: zs.telenutrition.schedule_referral.Whereable
): Promise<Result<ReferralRecord, ErrCode>> {
  const {
    logger,
    store: { reader },
  } = context;

  try {
    const pool = await reader();

    const record = await db
      .selectOne("telenutrition.schedule_referral", where)
      .run(pool);

    if (record === undefined) {
      return err(ErrCode.NOT_FOUND)
    }

    return ok(mapReferralRecord(record));
  } catch (e) {
    logger.exception(context, "TAG", e);
    return err(ErrCode.EXCEPTION);
  }
}


export async function updateReferral(
  context: IContext,
  referralId: number,
  record: Pick<ReferralRecord, 'appointmentId' | 'patientId'>
): Promise<Result<boolean, ErrCode>> {
  const {
    logger,
    store: { writer },
  } = context;

  try {
    const pool = await writer();

    const updatable: zs.telenutrition.schedule_referral.Updatable = {
      ...(record.patientId && { patient_id: record.patientId}),
      ...(record.appointmentId && { appointment_id: record.appointmentId})
    };

    await db
      .update("telenutrition.schedule_referral", updatable, { referral_id: referralId })
      .run(pool);

    return ok(true);
  } catch (e) {
    logger.exception(context, "TAG", e);
    return err(ErrCode.EXCEPTION);
  }
}

function mapReferralRecord(record: zs.telenutrition.schedule_referral.JSONSelectable): ReferralRecord {
  return {
    referralId: record.referral_id,
    referrerId: record.referrer_id ?? 0,
    icd10Codes: record.icd10_codes ?? [],
    patientId: record.patient_id ?? undefined,
    appointmentId: record.appointment_id ?? undefined,
    type: record.type ?? '',
    data: record.data as ReferralData
  }
}

export default { insertReferrer, getReferrer, insertReferral, getReferral, updateReferral };
