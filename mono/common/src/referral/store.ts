import { Result, err, ok } from 'neverthrow';
import { DateTime } from 'luxon';

import { AccountIds } from '../account/service';
import { IContext } from '../context';
import { ErrCode } from '../error';
import { RequireAtLeastOne } from '../typescript';

import * as db from 'zapatos/db'
import '../zapatos/schema'
import * as zs from 'zapatos/schema'

const MTAG = ['common', 'referral', 'store'];

export enum Sources {
  CalOptima = 'cal-optima',
  AetnaABHIL = 'aetna-abhil',
  AAH = 'aah',
  SantaClara = 'santa-clara',
}

export enum ReferralStatus {
  'UNDEFINED' = '',
  'REQUESTED' = 'requested', // Received data w/o any validation.
  'INVALID' = 'invalid', // Validation failed, insufficient data received to allow further processing of the referral.
  'ACCEPTED' = 'accepted',
  'IN_PROGRESS' = 'in-progress',
  'DECLINED' = 'declined',
  'COMPLETED' = 'completed',
  'CANCELLED' = 'cancelled',
}

export enum ReferralRelationshipToMember {
  'SELF' = 'self',
  'DEPENDENT' = 'dependent',
}

export enum ReferralService {
  'HEALTH_ASSESSMENT' = 'health-assessment',
}

export enum ReferralGender {
  'MALE' = 'M',
  'FEMALE' = 'F',
}

function mapScheduleReferralRecord(record: zs.telenutrition.schedule_referral.JSONSelectable): ScheduleReferralRecord {
  const keyMap = {
    referral_id: 'referralId',
    referral_source: 'referralSource',
    referral_status: 'referralStatus',
    referred_by: 'referredBy',
    referral_date: 'referralDate',
    referral_external_id: 'referralExternalId',
    patient_external_id: 'patientExternalId',
    account_id: 'accountId',
    identity_id: 'identityId',
    payer_id: 'payerId',
    source_data: 'sourceData',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
  };

  return Object.keys(record).reduce(
    (target: ScheduleReferralRecord, k) => {
      const targetKey = keyMap[k];

      if ((record[k] ?? '') !== '') {
        target[targetKey] = record[k];
      }
      return target;
    },
    {
      //
      // Initialize to avoid casting and ensure type checking.
      //
      referralId: 0,
      referralStatus: ReferralStatus.UNDEFINED,
      referredBy: '',
      referralDate: new Date(),
      accountId: 0,
      payerId: 0,
      sourceData: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  );
}

export interface ScheduleReferralRecord extends Omit<ScheduleReferralNewRecord, 'referralStatus'> {
  referralId: number;
  referralStatus: ReferralStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduleReferralNewRecord {
  referralStatus: ReferralStatus;
  referredBy?: string;
  referralSource?: string;
  referralDate: Date;
  referralExternalId?: string;
  patientExternalId?: string;
  accountId: number;
  identityId?: number;
  payerId?: number;
  sourceData: db.JSONValue;
}

export async function createScheduleReferral(
  context: IContext,
  record: ScheduleReferralNewRecord,
): Promise<Result<ScheduleReferralRecord, ErrCode>> {
  const {
    logger,
    store: { writer },
  } = context;
  const TAG = [...MTAG, 'createInboundReferral'];

  try {
    const pool = await writer();

    const inserted = await db
      .insert('telenutrition.schedule_referral', {
        referral_status: record.referralStatus,
        ...(record.referredBy && { referred_by: record.referredBy }),
        referral_date: record.referralDate,
        referral_source: record.referralSource,
        ...(record.referralExternalId && { referral_external_id: record.referralExternalId }),
        ...(record.patientExternalId && { patient_external_id: record.patientExternalId }),
        account_id: record.accountId,
        ...(record.identityId !== undefined && { identity_id: record.identityId }),
        ...(record.payerId && { payer_id: record.payerId }),
        source_data: record.sourceData,
      })
      .run(pool);

    return ok(mapScheduleReferralRecord(inserted));
  } catch (e) {
    logger.exception(context, TAG, e);

    return err(ErrCode.EXCEPTION);
  }
}

export async function getScheduleReferral(
  context: IContext,
  referralId: number,
): Promise<Result<ScheduleReferralRecord, ErrCode>> {
  const {
    logger,
    store: { reader },
  } = context;
  const TAG = [...MTAG, 'getScheduleReferral'];

  try {
    const pool = await reader();

    const record = await db
      .selectOne('telenutrition.schedule_referral', {
        referral_id: referralId,
      })
      .run(pool);

    if (record) {
      return ok(mapScheduleReferralRecord(record));
    } else {
      return err(ErrCode.NOT_FOUND);
    }
  } catch (e) {
    logger.exception(context, TAG, e);

    return err(ErrCode.EXCEPTION);
  }
}

/**
 * Select by external ID, scoped by account.
 *
 * @param context
 * @param referralExternalId
 * @param accountId
 * @returns
 */
export async function getScheduleReferralByExternalId(
  context: IContext,
  referralExternalId: string,
  accountId: number,
): Promise<Result<ScheduleReferralRecord, ErrCode>> {
  const {
    logger,
    store: { reader },
  } = context;
  const TAG = [...MTAG, 'getScheduleReferral'];

  try {
    const pool = await reader();

    const record = await db
      .selectOne('telenutrition.schedule_referral', {
        referral_external_id: referralExternalId,
        account_id: accountId,
      })
      .run(pool);

    if (record) {
      return ok(mapScheduleReferralRecord(record));
    } else {
      return err(ErrCode.NOT_FOUND);
    }
  } catch (e) {
    logger.exception(context, TAG, e);

    return err(ErrCode.EXCEPTION);
  }
}

type ScheduleReferralUpdatable = {
  referralStatus: ReferralStatus;
  patientExternalId: ScheduleReferralRecord['patientExternalId'];
  identityId: ScheduleReferralRecord['identityId'];
  sourceData: ScheduleReferralRecord['sourceData'];
};

export type ScheduleReferralUpdates = RequireAtLeastOne<ScheduleReferralUpdatable>;

export async function updateScheduleReferral(
  context: IContext,
  referralId: number,
  updates: ScheduleReferralUpdates,
): Promise<Result<ScheduleReferralRecord, ErrCode>> {
  const {
    logger,
    store: { writer },
  } = context;
  const TAG = [...MTAG, 'updatecheduleReferral'];

  try {
    const pool = await writer();

    const updated = await db
      .update(
        'telenutrition.schedule_referral',
        {
          ...(updates.referralStatus && { referral_status: updates.referralStatus }),
          ...(updates.patientExternalId && { patient_external_id: updates.patientExternalId }),
          ...(updates.identityId && { identity_id: updates.identityId }),
          ...(updates.sourceData && { source_data: updates.sourceData }),
        },
        {
          referral_id: referralId,
        },
      )
      .run(pool);

    if (updated.length !== 1) {
      //
      // Should have updated one and only one referral.
      //
      logger.error(context, TAG, 'Error updating referral.', {
        referralId,
        updates,
      });

      return err(ErrCode.STATE_VIOLATION);
    }

    logger.debug(context, TAG, 'Updated referral.', {
      referralId,
      updates,
      updated,
    });

    return ok(mapScheduleReferralRecord(updated[0]));
  } catch (e) {
    logger.exception(context, TAG, e);

    return err(ErrCode.EXCEPTION);
  }
}

export async function updateScheduleReferralStatus(
  context: IContext,
  referralId: number,
  currentStatus: ReferralStatus,
  newStatus: ReferralStatus,
): Promise<Result<ScheduleReferralRecord, ErrCode>> {
  const {
    logger,
    store: { writer },
  } = context;
  const TAG = [...MTAG, 'updateScheduleReferralStatus'];

  try {
    const pool = await writer();

    const result = await db
      .update(
        'telenutrition.schedule_referral',
        {
          referral_status: newStatus,
        },
        {
          referral_id: referralId,
          referral_status: currentStatus,
        },
      )
      .run(pool);

    if (result.length !== 1) {
      logger.error(context, TAG, 'Status update error.', {
        result,
        currentStatus,
        newStatus,
      });

      return err(ErrCode.STATE_VIOLATION);
    }

    return ok(mapScheduleReferralRecord(result[0]));
  } catch (e) {
    logger.exception(context, TAG, e);

    return err(ErrCode.EXCEPTION);
  }
}

export enum ReferralActionType {
  ERROR = 'error',
  FOOD_REFERRAL = 'food_referral',
  FOOD_REAUTHORIZATION = 'food_reauthorization',
  DECLINE = 'decline',
  NO_ACTION = 'no_action',
}

export enum ReferralActionReasons {
  'MISSING_QUESTIONNAIRE' = 'missing_questionnaire',
}

export type ReferralInvalidDecisionReason = string;

export type ReferralActionReason = ReferralActionReasons | ReferralInvalidDecisionReason;

export enum ReferralActionStatus {
  REQUESTED = 'requested',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * JSON serializable referral action.
 */
export interface ReferralAction {
  action_type: ReferralActionType;
  action_date: string; // ISO Date, ie: DateTime.now().toISODate(),
  action_reason?: ReferralActionReason;
  status?: ReferralActionStatus;
  data?: any;
}

export async function getRequestedReferralActionsForSource(
  context: IContext,
  source: Sources,
): Promise<Result<{ referralId: number; referralAction: ReferralAction }[], ErrCode>> {
  const {
    logger,
    store: { reader },
  } = context;
  const TAG = [...MTAG, 'getRequestedReferralActionsForSource'];

  try {
    const pool = await reader();

    const sourceKey = Object.keys(Sources).find((key) => Sources[key as keyof typeof Sources] === source);
    const accountId = sourceKey ? AccountIds[sourceKey as keyof typeof AccountIds] : undefined;

    if (accountId === undefined) {
      logger.error(context, TAG, 'Invalid source.', { source });

      return err(ErrCode.INVALID_DATA);
    }

    const query = `
      SELECT
        sr.referral_id,
        referral_action_item
      FROM
        telenutrition.schedule_referral sr,
        jsonb_array_elements(referral_action) AS referral_action_item
      WHERE
        referral_action_item ->> 'status' = '${ReferralActionStatus.REQUESTED}'
        AND sr.account_id=${accountId}
    `;

    const { rows } = await pool.query(query);

    // check for referrals with more than one requested action
    const idCount = rows.reduce(
      (acc, row) => {
        acc[row.referral_id] = (acc[row.referral_id] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const uniqueReferrals = rows.filter((row) => idCount[row.referral_id] === 1);

    // log any referrals with more than one requested action
    if (rows.length !== uniqueReferrals.length) {
      logger.error(context, TAG, 'Referral(s) found with more than one requested action.', {
        referrals: rows.filter((row) => idCount[row.referral_id] > 1),
      });
    }

    return ok(
      uniqueReferrals.map((row) => ({
        referralId: row.referral_id as number,
        referralAction: row.referral_action_item as ReferralAction,
      })),
    );
  } catch (e) {
    logger.exception(context, TAG, e);

    return err(ErrCode.EXCEPTION);
  }
}

export async function updateScheduleReferralAction(
  context: IContext,
  referralId: number,
  action: ReferralAction,
): Promise<Result<ScheduleReferralRecord, ErrCode>> {
  const {
    logger,
    store: { writer },
  } = context;
  const TAG = [...MTAG, 'updateScheduleReferralAction'];

  try {
    logger.info(context, TAG, 'Updating schedule referral action.', {
      referralId,
      action,
    });

    const pool = await writer();

    //
    // Zapatos schema needs to be updated, ie: migration to add referral_action column.
    //
    // const result = await db.update('telenutrition.schedule_referral', {
    //   referral_action: [JSON.stringify(action), referralId]
    // }, {
    //  referral_id: referralId,
    //  referral_status: currentStatus,
    //}).run(pool)
    //

    const result = await pool.query(
      `
      UPDATE telenutrition.schedule_referral
      SET referral_action =
        CASE
          -- If referral_action is NULL, create a new jsonb object which is an array with the action
          WHEN referral_action IS NULL THEN to_jsonb(ARRAY[$1::jsonb])

          -- If referral_action is a single value (not an array), convert it into an array and append the new action
          WHEN jsonb_typeof(referral_action) != 'array' THEN jsonb_build_array(referral_action) || $1::jsonb

          -- If referral_action is already a jsonb object which contains an array, append the new action
          ELSE referral_action || $1::jsonb
        END
      WHERE referral_id = $2
      RETURNING *
    `,
      [JSON.stringify(action), referralId],
    );

    const { rows } = result;

    if (rows.length !== 1) {
      logger.error(context, TAG, 'Failed to update referral.', {
        referral_id: referralId,
        rows,
      });

      return err(ErrCode.STATE_VIOLATION);
    }

    return ok(mapScheduleReferralRecord(rows[0]));
  } catch (e) {
    logger.exception(context, TAG, e);

    return err(ErrCode.EXCEPTION);
  }
}

export async function updateScheduleReferralActionToCompleted(
  context: IContext,
  referralId: number,
): Promise<Result<ScheduleReferralRecord, ErrCode>> {
  const {
    logger,
    store: { writer },
  } = context;
  const TAG = [...MTAG, 'updateScheduleReferralActionToCompleted'];

  try {
    logger.info(context, TAG, `Updating schedule referral action status to 'completed'.`, {
      referralId,
    });

    const pool = await writer();

    const result = await pool.query(
      `
      UPDATE telenutrition.schedule_referral
      SET referral_action = (
          SELECT jsonb_agg(
              CASE 
                  WHEN action->>'status' = 'requested' 
                  THEN jsonb_set(action, '{status}', '"completed"')
                  ELSE action
              END
          )
          FROM jsonb_array_elements(referral_action) AS action
      )
      WHERE referral_id = $1
      AND (
          SELECT COUNT(*) 
          FROM jsonb_array_elements(referral_action) AS action
          WHERE action->>'status' = 'requested'
      ) = 1
      RETURNING *
    `,
      [referralId],
    );

    const { rows } = result;

    if (rows.length !== 1) {
      logger.error(context, TAG, 'Failed to update referral action status.', {
        referral_id: referralId,
        rows,
      });

      return err(ErrCode.STATE_VIOLATION);
    }

    return ok(mapScheduleReferralRecord(rows[0]));
  } catch (e) {
    logger.exception(context, TAG, e);

    return err(ErrCode.EXCEPTION);
  }
}

function sourcesToArray(sources?: string[] | string): string[] {
  if (!sources) {
    return [];
  }

  return Array.isArray(sources) ? sources : [sources];
}

export interface GetNewInvalidReferralsOptions {
  sources?: string[] | string;
}

export async function getNewInvalidReferrals(
  context: IContext,
  options: GetNewInvalidReferralsOptions,
): Promise<Result<ScheduleReferralRecord[], ErrCode>> {
  const {
    logger,
    store: { reader },
  } = context;
  const TAG = [...MTAG, 'getNewInvalidReferrals'];

  const sources = sourcesToArray(options.sources).map((source) => `'${source}'`);
  const sourcesCond = sources.length > 0 ? `AND SR.referral_source IN (${sources.join(',')})` : '';

  const query = `
SELECT
  *
FROM
  telenutrition.schedule_referral AS SR
WHERE
  SR.referral_status = 'requested'
  AND (
      SR.referral_external_id IS NULL
    OR
      SR.patient_external_id IS NULL
  )
  ${sourcesCond}
;`;

  try {
    logger.debug(context, TAG, 'query', {
      query,
      options,
    });

    const pool = await reader();
    const { rows } = await pool.query(query);

    return ok(rows.map((row) => mapScheduleReferralRecord(row)));
  } catch (e) {
    logger.exception(context, TAG, e);

    return err(ErrCode.EXCEPTION);
  }
}

export interface GetNewAcceptedReferralsOptions {
  sources?: string[] | string;
}

export interface NewAcceptedReferralRecord extends ScheduleReferralRecord {
  isDuplicate?: boolean;
}

/**
 * Get referrals which should transition from 'requested' to 'accepted'
 *
 * @param context
 * @param options
 * @returns
 */
export async function getNewAcceptedReferrals(
  context: IContext,
  options: GetNewAcceptedReferralsOptions,
): Promise<Result<NewAcceptedReferralRecord[], ErrCode>> {
  const {
    logger,
    store: { reader },
  } = context;
  const TAG = [...MTAG, 'getNewAcceptedReferrals'];

  const sources = sourcesToArray(options.sources).map((source) => `'${source}'`);
  const sourcesCond = sources.length > 0 ? `AND SR.referral_source IN (${sources.join(',')})` : '';

  try {
    const pool = await reader();

    const query = `
WITH active_referrals AS (
  SELECT
    *,
    ROW_NUMBER() OVER (PARTITION BY patient_external_id ORDER BY created_at ASC) as sequence
  FROM telenutrition.schedule_referral
  WHERE
    referral_status <> 'declined'
)
SELECT
  *,
  AR.sequence > 1 AS is_duplicate
FROM telenutrition.schedule_referral SR
LEFT JOIN active_referrals AR ON AR.referral_id = SR.referral_id
WHERE
  SR.patient_external_id IS NOT NULL
  AND SR.referral_external_id IS NOT NULL
  AND SR.referral_status = 'requested'
  ${sourcesCond}
`;

    logger.debug(context, TAG, 'query', {
      query,
      options,
    });

    const { rows } = await pool.query(query);

    return ok(
      rows.map((row) => {
        const mapped = mapScheduleReferralRecord(row);

        return {
          ...mapped,
          isDuplicate: row.is_duplicate,
        };
      }),
    );
  } catch (e) {
    logger.exception(context, TAG, e);

    return err(ErrCode.EXCEPTION);
  }
}

export interface GetNewInProgressReferralsOptions {
  sources?: string[] | string;
}

export interface NewInProgressReferral {
  referralId: number;
  referralSource: string;
  referralStatus: ReferralStatus;
  referralExternalId: string;
  patientExternalId: string;
  accountId: number;
}

export async function getNewInProgressReferrals(
  context: IContext,
  options?: GetNewInProgressReferralsOptions,
): Promise<Result<NewInProgressReferral[], ErrCode>> {
  const {
    logger,
    store: { reader },
  } = context;
  const TAG = [...MTAG, 'getNewAcceptedReferrals'];
  options = options ?? {};

  try {
    const pool = await reader();

    const sources = sourcesToArray(options.sources).map((source) => `'${source}'`);
    const sourcesCond = sources.length > 0 ? `AND SR.referral_source IN (${sources.join(',')})` : '';

    const query = `
SELECT
  SR.referral_id,
  SR.referral_status,
  SR.referral_source,
  SR.referral_external_id,
  SR.patient_external_id,
  SR.account_id
FROM telenutrition.schedule_referral SR
LEFT JOIN telenutrition.iam_identity II ON SR.identity_id=II.identity_id
LEFT JOIN telenutrition.schedule_patient SP ON SP.identity_id=II.identity_id
LEFT JOIN telenutrition.schedule_appointment SA ON SA.patient_id=SP.patient_id
WHERE
  SR.referral_status='accepted'
  AND SA.appointment_id IS NOT NULL
  ${sourcesCond}
`;

    const { rows } = await pool.query(query);

    return ok(
      rows.map((row) => ({
        referralId: row.referral_id,
        referralSource: row.referral_source,
        referralStatus: row.referral_status,
        referralExternalId: row.referral_external_id,
        patientExternalId: row.patient_external_id,
        accountId: row.account_id,
      })),
    );
  } catch (e) {
    logger.exception(context, TAG, e);

    return err(ErrCode.EXCEPTION);
  }
}

export interface GetNewCompletedReferralsOptions {
  sources?: string[] | string;
}

export interface NewCompletedReferral {
  referralId: number;
  referralSource?: string;
  referralStatus: ReferralStatus;
  referralExternalId: string;
  patientExternalId: string;
  appointmentDate: Date;
  accountId: number;
}

export async function getNewCompletedReferrals(
  context: IContext,
  options?: GetNewCompletedReferralsOptions,
): Promise<Result<NewCompletedReferral[], ErrCode>> {
  const {
    logger,
    store: { reader },
  } = context;
  const TAG = [...MTAG, 'getNewCompletedReferrals'];
  options = options ?? {};

  try {
    const pool = await reader();

    const sources = sourcesToArray(options.sources).map((source) => `'${source}'`);
    const sourcesCond = sources.length > 0 ? `AND SR.referral_source IN (${sources.join(',')})` : '';

    const query = `
SELECT
  SR.referral_id,
  SR.referral_source,
  SR.referral_status,
  SR.referral_external_id,
  SR.patient_external_id,
  SA.date as appointment_date,
  SR.account_id as account_id
FROM telenutrition.schedule_referral SR
LEFT JOIN telenutrition.iam_identity II ON SR.identity_id=II.identity_id
LEFT JOIN telenutrition.schedule_patient SP ON SP.identity_id=II.identity_id
LEFT JOIN telenutrition.schedule_appointment SA ON SA.patient_id=SP.patient_id
WHERE
  SR.referral_status='in-progress'
  AND SA.appointment_id IS NOT NULL
  AND SA.status IN ('3', '4')
  ${sourcesCond}
`;

    const { rows } = await pool.query(query);

    return ok(
      rows.map((row) => ({
        referralId: row.referral_id,
        referralSource: row.referral_source,
        referralStatus: row.referral_status,
        referralExternalId: row.referral_external_id,
        patientExternalId: row.patient_external_id,
        appointmentDate: DateTime.fromFormat(row.appointment_date, 'MM/dd/yyyy').toJSDate(),
        accountId: row.account_id,
      })),
    );
  } catch (e) {
    logger.exception(context, TAG, e);

    return err(ErrCode.EXCEPTION);
  }
}

export async function getOutboundReferralCount(
  context: IContext,
  accountId: number,
  days: number,
): Promise<Result<number, ErrCode>> {
  const {
    logger,
    store: { reader },
  } = context;
  const TAG = [...MTAG, 'getOutboundReferralCount'];

  try {
    const pool = await reader();

    const query = `
    SELECT COUNT(*)
    FROM
        telenutrition.schedule_referral SR
    WHERE
        EXISTS (
            SELECT
                1
            FROM
                jsonb_array_elements(SR.referral_action) AS referral_action_item
            WHERE
                referral_action_item ->> 'action_type' = 'food_referral'
                AND (referral_action_item ->> 'action_date')::timestamp > NOW() - (${days} * INTERVAL '1 day')
        )
    AND account_id = ${accountId};
    `;

    const { rows } = await pool.query(query);

    if (rows.length !== 1) {
      logger.error(context, TAG, 'Error getting outbound referral count.', {
        rows,
      });

      return err(ErrCode.INVALID_DATA);
    }

    return ok(parseInt(rows[0]?.count));
  } catch (e) {
    logger.exception(context, TAG, e);

    return err(ErrCode.EXCEPTION);
  }
}

export interface GetActionableReferralsOptions {
  sources?: string[] | string;
  requireNewQuestionnaire?: boolean;
}

export interface ActionableReferral {
  referralId: number;
  referralSource?: string;
  identityId: number;
  referralStatus: ReferralStatus;
  referralExternalId: string;
  patientExternalId: string;
  questionnaireId: number;
  accountId: number;
}

/**
 * Get 'completed' referrals for which an 'action' may need to be taken. An 'action' may involve
 * sending an outbound referral for a "medically tailored meal", for example.
 *
 * @param context
 * @param options
 */
export async function getActionableReferrals(
  context: IContext,
  options?: GetActionableReferralsOptions,
): Promise<Result<ActionableReferral[], ErrCode>> {
  const {
    logger,
    store: { reader },
  } = context;
  const TAG = [...MTAG, 'getActionableReferrals'];
  options = options ?? {};

  try {
    const pool = await reader();

    const sources = sourcesToArray(options.sources).map((source) => `'${source}'`);
    const sourcesCond = sources.length > 0 ? `AND SR.referral_source IN (${sources.join(',')})` : '';

    const whereIsActionable = options?.requireNewQuestionnaire
      ? `
      AND NOT EXISTS (
          -- Ensure there hasn't been a referral action already taken
          SELECT
              1
          FROM
              jsonb_array_elements(SR.referral_action) AS referral_action_item
          WHERE
              (referral_action_item ->> 'action_type') IN ('food_referral', 'food_reauthorization', 'decline')
      )
      AND EXISTS (
          -- Ensure there is at least one questionnaire newer than the referral creation date
          SELECT
              1
          FROM
              telenutrition.clinical_encounter_screening_questionnaire SQ
              INNER JOIN telenutrition.schedule_patient SP ON SQ.patient_id = SP.patient_id
          WHERE
              SP.identity_id = SR.identity_id
              AND SQ.created_at >= SR.created_at
      )
    `
      : `
      AND (
        referral_action IS NULL
        OR (
            (( SELECT referral_action_item FROM jsonb_array_elements(SR.referral_action) AS referral_action_item 
              ORDER BY referral_action_item ->> 'action_date' DESC
              LIMIT 1) ->> 'action_type' = 'error')
            AND
            (( SELECT referral_action_item FROM jsonb_array_elements(SR.referral_action) AS referral_action_item
              ORDER BY referral_action_item ->> 'action_date' DESC
              LIMIT 1) ->> 'action_reason' IN ('missing_questionnaire', 'invalid_decision_frequency', 'invalid_decision_frequency_grocery_box')
            )
        )
      )
    `;

    const query = `
      WITH actionable_referrals AS (
        SELECT
          referral_id
        FROM telenutrition.schedule_referral SR
        WHERE
          referral_status = 'completed'
          ${whereIsActionable}
      ),
      newest_questionnaires AS (
        SELECT
          SQ.questionnaire_id,
          SQ.patient_id,
          SQ.created_at,
          ROW_NUMBER() OVER (PARTITION BY SQ.patient_id ORDER BY SQ.created_at DESC) AS rn
        FROM telenutrition.clinical_encounter_screening_questionnaire SQ
      )
      SELECT
        SR.referral_id,
        SR.referral_source,
        SR.identity_id,
        SR.referral_status,
        SR.referral_external_id,
        SR.patient_external_id,
              NQ.questionnaire_id,
        SR.account_id
      FROM telenutrition.schedule_referral SR
        LEFT JOIN telenutrition.iam_identity II ON SR.identity_id=II.identity_id
        LEFT JOIN telenutrition.schedule_patient SP ON SP.identity_id=II.identity_id
        LEFT JOIN newest_questionnaires NQ ON NQ.patient_id=SP.patient_id AND NQ.rn = 1
      WHERE
        SR.referral_status='completed'
        AND SR.referral_id IN (SELECT referral_id FROM actionable_referrals)
        ${sourcesCond}
        ORDER BY SR.referral_id ASC
    `;

    const { rows } = await pool.query(query);

    return ok(
      rows.map((row) => ({
        referralId: row.referral_id,
        referralSource: row.referral_source,
        identityId: row.identity_id,
        referralStatus: row.referral_status,
        referralExternalId: row.referral_external_id,
        patientExternalId: row.patient_external_id,
        questionnaireId: row.questionnaire_id,
        accountId: row.account_id,
      })),
    );
  } catch (e) {
    logger.exception(context, TAG, e);

    return err(ErrCode.EXCEPTION);
  }
}

export interface ReferralConfig {
  source: string;

  /**
   * This flag enables us to disable processing for a source.
   */
  processEnabled: boolean;

  /**
   * In certain cases (like caloptima) a custom flow is required. If this is set
   * to true we will not process it in the generic flow, but instead allow the
   * custom flow to handle it.
   *
   * We have this as a separate flag so that we can still use the processEnabled
   * flag to disable processing for a source when needed.
   */
  customFlow: boolean;

  /**
   * If TRUE the referral will be marked as invalid if the user does not have
   * eligibility information in the system (unless there is a grace period)
   */
  eligibilityRequired: boolean;

  /**
   * If eligibility_required is true but a grace period is provided we won't
   * mark referral without user eligibility as invalid until the grace period
   * has passed in the case there is a delay from the source in providing us
   * eligibility information.
   */
  eligibilityGracePeriodInSeconds: number;

  /**
   * This is a JSONB as individual callback configurations will be different
   * shapes depending on the source
   */
  callback_config: db.JSONValue;
}

function mapReferralConfig(record: zs.common.referral_config.JSONSelectable): ReferralConfig {
  var config = record.callback_config ?? {};

  return {
    source: record.source,
    processEnabled: record.process_enabled,
    customFlow: record.custom_flow,
    eligibilityRequired: record.eligibility_required,
    eligibilityGracePeriodInSeconds: record.eligibility_grace_period_in_seconds,
    callback_config: config,
  };
}

async function getReferralConfigFromQuery(
  context: IContext,
  query: string,
): Promise<Result<Record<string, ReferralConfig>, ErrCode>> {
  const {
    logger,
    store: { reader },
  } = context;
  const TAG = [...MTAG, 'getReferralConfigFromQuery'];

  try {
    const pool = await reader();
    const { rows } = await pool.query(query);

    const out: Record<string, ReferralConfig> = {};

    rows.forEach((row) => {
      out[row.source] = mapReferralConfig(row);
    });

    return ok(out);
  } catch (e) {
    logger.exception(context, TAG, e);

    return err(ErrCode.EXCEPTION);
  }
}

interface getReferralConfigsOptions {
  sources?: string[] | string;
  withProcessEnabled?: boolean;
  withCustomFlow?: boolean;
}

/**
 * Get the referral configs
 * @param context
 * @param options
 * @returns
 */
export async function getReferralConfigs(
  context: IContext,
  options: getReferralConfigsOptions = {},
): Promise<Result<Record<string, ReferralConfig>, ErrCode>> {
  const { logger } = context;
  const TAG = [...MTAG, 'getReferralConfigs'];

  const conditions: string[] = [];

  const sources = sourcesToArray(options.sources);
  if(sources.length > 0) {
    conditions.push(`rf.referral_source IN (${sources.map((s) => `'${s}'`).join(',')})`);
  }

  if (options.withProcessEnabled === true) {
    conditions.push('rf.process_enabled = TRUE');
  } else if (options.withProcessEnabled === false) {
    conditions.push('rf.process_enabled = FALSE');
  }

  if (options.withCustomFlow === true) {
    conditions.push('rf.custom_flow = TRUE');
  } else if (options.withCustomFlow === false) {
    conditions.push('rf.custom_flow = FALSE');
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const query = `
    SELECT
      rf.source,
      rf.process_enabled,
      rf.custom_flow,
      rf.eligibility_required,
      rf.eligibility_grace_period_in_seconds,
      rf.callback_config
    FROM common.referral_config AS rf
    ${whereClause}
  `;

  const results = await getReferralConfigFromQuery(context, query);

  if (results.isErr()) {
    logger.error(context, TAG, 'Failed to get referral configs', {
      error: results.error,
      options,
    });
  } else {
    logger.info(context, TAG, `retreived ${results.value.size} referral configs`, {
      receivedSources: Array.from(Object.keys(results.value)),
      options
    });
  }

  return results;
}

export default {
  createScheduleReferral,
  getScheduleReferral,
  getScheduleReferralByExternalId,
  updateScheduleReferralStatus,
  updateScheduleReferralAction,
  getNewAcceptedReferrals,
  getNewInProgressReferrals,
  getNewCompletedReferrals,
  getOutboundReferralCount,
  getActionableReferrals,
  getReferralConfigs,
};
