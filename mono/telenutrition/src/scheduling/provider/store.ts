import { IContext } from "@mono/common/src/context";
import { Result, err, ok } from "neverthrow";
import { ErrCode } from "@mono/common/lib/error";
import * as db from "zapatos/db";
import * as zs from "zapatos/schema";
import { Logger } from "@mono/common";
import { ProviderPerformanceMetrics } from "./types";
import * as _ from 'lodash';
import { DailyUnitsBilled, GetProviderPastPatientsParams, ProviderRecord, ProviderRecordShort, ProviderTaskRecord } from '../provider/shared';

const shortFields: (keyof ProviderRecordShort)[] = ['providerId', 'name', 'photo', 'initials', 'languages']

export function mapProviderRecordShort(record: zs.telenutrition.schedule_provider.JSONSelectable): ProviderRecordShort {
  const provider = mapProviderRecord(record)
  return _.pick(provider, shortFields)
}

export function mapProviderRecord(record: zs.telenutrition.schedule_provider.JSONSelectable): ProviderRecord {
  return {
    providerId: record.provider_id,
    firstName: record.first_name,
    lastName: record.last_name,
    name: `${record.first_name} ${record.last_name}, RD`,
    photo: `https://d1hm90tax3m3th.cloudfront.net/telenutrition/scheduling/providers/${record.provider_id}.jpg`,
    oktaId: record.okta_id ?? undefined,
    timezone: record.timezone ?? undefined,
    languages: record.languages ?? undefined,
    initials: `${record.first_name.slice(0, 1)}${record.last_name.slice(0, 1)}`,
    email: record.email ?? undefined,
    status: record.status,
    pediatrics: record.pediatrics,
    homeEmail: record.home_email ?? undefined,
    homePhone: record.home_phone ?? undefined,
    homeZipcode: record.home_zipcode ?? undefined,
    certifications: record.certifications ?? [],
    capacityProviderGroup: record.capacity_provider_group ?? undefined,
    specialtyIds: record.specialty_ids ?? [],
    employmentStatus: record.employment_status ?? undefined,
    npi: record.npi ?? undefined,
    credentialingCommitteeStatus: record.credentialing_committee_status ?? undefined,
    minPatientAge: record.min_patient_age,
    bio: record.bio ?? undefined,
  }
}

type ProviderTaskDbRecord = zs.telenutrition.provider_task.JSONSelectable;

export function mapProviderTask(record: ProviderTaskDbRecord): ProviderTaskRecord {
  return {
    taskId: record.task_id,
    providerId: record.provider_id,
    name: record.name,
    priority: record.priority,
    status: record.status,
    updatedAt: record.updated_at,
    note: record.note ?? undefined,
    dueDate: record.due_date ?? undefined,
    createdAt: record.created_at,
  }
}
type ProviderLicenseDbRecord = zs.telenutrition.provider_license.JSONSelectable

export type ProviderLicenseRecord = {
  licenseId: number;
  source: string;
  medallionId?: string;
  providerId?: number | null;
  status?: string; // active | pending | inactive
  state: string;
  issueDate?: string;
  expirationDate?: string;
  licenseNumber?: string;
  certificateType?: string;
  candidProvider_credentialing_span_id?: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
  verificationStatus?: string; // needs_attention | manually_verified | automatically_verified
};

export function mapProviderLicenseRecord(record: ProviderLicenseDbRecord): ProviderLicenseRecord {
  return {
    licenseId: record.license_id,
    source: record.source,
    medallionId: record.medallion_id ?? undefined,
    providerId: record.provider_id,
    status: record.status ?? undefined,
    state: record.state,
    issueDate: record.issue_date ?? undefined,
    expirationDate: record.expiration_date ?? undefined,
    licenseNumber: record.license_number ?? undefined,
    certificateType: record.certificate_type ?? undefined,
    candidProvider_credentialing_span_id: record.candid_provider_credentialing_span_id ?? undefined,
    createdAt: record.created_at,
    createdBy: record.created_by,
    updatedAt: record.updated_at ?? undefined,
    updatedBy: record.updated_by ?? undefined,
    verificationStatus: record.verification_status ?? undefined,
  }
}

type ProviderLicenseApplicationDbRecord = zs.telenutrition.provider_license_application.JSONSelectable

export interface ProviderLicenseApplicationRecord {
  licenseApplicationId: number;
  providerId: number;
  state: string;
  trackingNumber?: string;
  trackingMeta?: db.JSONValue;
  status?: string;
  submittedDate: string;
  attestedBy?: string;
  attestedAt?: Date;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
}

export function mapProviderLicenseApplicationRecord(record: ProviderLicenseApplicationDbRecord): ProviderLicenseApplicationRecord {
  return {
    licenseApplicationId: record.license_application_id,
    providerId: record.provider_id,
    state: record.state,
    trackingNumber: record.tracking_number ?? undefined,
    trackingMeta: record.tracking_meta,
    status: record.status ?? undefined,
    submittedDate: record.submitted_date,
    attestedBy: record.attested_by ?? undefined,
    attestedAt: record.attested_at ? new Date(record.attested_at) : undefined,
    createdAt: new Date(record.created_at),
    createdBy: record.created_by,
    updatedAt: new Date(record.updated_at),
    updatedBy: record.updated_by,
  }
}

const MTAG = Logger.tag();

export interface FetchProviderByNameParams {
  firstName: string;
  lastName: string;
}

async function fetchProviderByName(
  context: IContext,
  params: FetchProviderByNameParams,
): Promise<Result<ProviderRecord, ErrCode>> {
  const {
    logger,
    store: { reader },
  } = context;

  const TAG = [...MTAG, 'fetchProviderByName']

  try {
    const pool = await reader();
    const provider = await db
      .selectOne(
        "telenutrition.schedule_provider",
        db.sql`lower(first_name) = lower(${db.param(params.firstName)}) AND lower(last_name) = lower(${db.param(params.lastName)})`
      )
      .run(pool);

    if (provider === undefined) {
      logger.error(context, TAG, 'could not find provider', { params })
      return err(ErrCode.NOT_FOUND);
    }

    return ok(mapProviderRecord(provider));
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

export interface FetchProviderByOptions {
  where: zs.telenutrition.schedule_provider.Whereable
}

async function fetchProviderBy(
  context: IContext,
  options: FetchProviderByOptions,
): Promise<Result<ProviderRecord, ErrCode>> {
  const {
    logger,
    store: { reader },
  } = context;

  const TAG = [...MTAG, 'fetchProviderBy']

  try {
    const pool = await reader();
    const provider = await db
      .selectOne("telenutrition.schedule_provider", options.where)
      .run(pool);

    if (provider === undefined) {
      logger.error(context, TAG, '', { options })
      return err(ErrCode.NOT_FOUND);
    }

    return ok(mapProviderRecord(provider));
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

async function updateProviderOktaId(
  context: IContext,
  providerId: number,
  oktaId: string
): Promise<Result<boolean, ErrCode>> {
  const {
    logger,
    store: { writer },
  } = context;

  const TAG = [...MTAG, 'updateProviderOktaId']

  try {
    const pool = await writer();
    const updateable: zs.telenutrition.schedule_provider.Updatable = {
      okta_id: oktaId,
    };
    await db
      .update("telenutrition.schedule_provider", updateable, {
        provider_id: providerId,
      })
      .run(pool);
    return ok(true);
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

export type ProviderUpdatable = Partial<Pick<zs.telenutrition.schedule_provider.Updatable, 'okta_id' | 'email' | 'specialty_ids' | 'languages' | 'min_patient_age' | 'timezone' | 'bio'>>

/**
 * Update provider. 
 * 
 * @param context 
 * @param providerId 
 * @param updateable 
 * @returns true -> success, false -> if nothing to updated.
 */
async function updateProvider(
  context: IContext,
  providerId: number,
  updatable: ProviderUpdatable,
): Promise<Result<boolean, ErrCode>> {
  const {
    logger,
    store: { writer },
  } = context;

  const TAG = [...MTAG, 'updateProvider']

  try {
    if (_.isEmpty(updatable)) {
      return ok(false)
    }

    const pool = await writer();
    await db
      .update("telenutrition.schedule_provider", updatable, {
        provider_id: providerId,
      })
      .run(pool);
    return ok(true);
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

interface ProviderMetricDbResult {
  business_day_count: number;
  total_billed: number;
  units_billed_per_business_day: number;
  encounter_stats_summary: {
    total_complete_visit_units_billed: number;
    total_complete_visit_count: number;
    total_initial_visit_count: number;
    total_follow_up_visit_count: number;
    total_complete_initial_visit_count: number;
    total_complete_follow_up_visit_count: number;
  };
}

interface DailyUnitsBilledDbResult {
  appointment_date: string; 
  units_billed: number 
}

export async function getDailyUnitsBilled(
  context: IContext,
  startDate: string,
  endDate: string,
  timezone: string,
  providerId: number,
): Promise<Result<DailyUnitsBilled[], ErrCode>> {
  const TAG = [...MTAG, 'getDailyUnitsBilled'];

  const {
    logger,
    store: { reader },
  } = context;
  try {
    const rpool = await reader();

    const dailyUnitsBilled = await db.sql<
      zs.telenutrition.clinical_encounter.SQL
      | zs.telenutrition.schedule_appointment.SQL,
      DailyUnitsBilledDbResult[]>`
      SELECT 
        (SA.${'start_timestamp'} AT TIME ZONE ${db.param(timezone)})::DATE::TEXT AS appointment_date,
        SUM(COALESCE(CE.${'units_billed'}, 0)) AS units_billed
      FROM ${'telenutrition.clinical_encounter'} CE 
      LEFT JOIN ${'telenutrition.schedule_appointment'} SA ON SA.${'appointment_id'} = CE.${'appointment_id'} 
      WHERE 
        CE.${'provider_id'} = ${db.param(providerId)} 
        AND (SA.${'start_timestamp'} AT TIME ZONE ${db.param(timezone)})::DATE
          BETWEEN (${db.param(startDate)})::DATE AND (${db.param(endDate)})::DATE
        AND SA.${'status'} IN ('3', '4')
      GROUP BY appointment_date
      ORDER BY appointment_date;
    `.run(rpool);

    return ok(dailyUnitsBilled?.map(dub => ({appointmentDate: dub.appointment_date, unitsBilled: +dub.units_billed})));
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

export async function getProviderMetricsInDateRange(
  context: IContext,
  startDate: string,
  endDate: string,
  timezone: string,
  providerId: number,
): Promise<Result<ProviderPerformanceMetrics, ErrCode>> {
  const TAG = [...MTAG, 'getProviderMetricsInDateRange'];

  const {
    logger,
    store: { reader },
  } = context;
  try {
    const rpool = await reader();

    const providerMetrics = await db.sql<
    zs.telenutrition.clinical_encounter.SQL
    | zs.telenutrition.schedule_appointment.SQL
    | zs.common.company_holiday.SQL
    | zs.telenutrition.schedule_appointment_type.SQL,
    ProviderMetricDbResult>`
      WITH 
        initial_patients_from_30_to_90_days_ago AS (
            SELECT SA.${'patient_id'}
            FROM ${'telenutrition.schedule_appointment'} SA
            LEFT JOIN ${'telenutrition.schedule_appointment_type'} SAT ON SAT.${'appointment_type_id'} = SA.${'appointment_type_id'} 
            WHERE 
              SA.${'provider_id'} = ${db.param(providerId)} 
              AND SAT.${'is_initial'} = TRUE
              AND SA.${'status'} IN ('3', '4')
              AND (SA.${'start_timestamp'} AT TIME ZONE ${db.param(timezone)})::DATE
                BETWEEN NOW() - INTERVAL '90 days' AND NOW() - INTERVAL '30 days'
        ),
        returning_patients_from_30_to_90_days_ago AS (
            SELECT DISTINCT SA.${'patient_id'}
            FROM ${'telenutrition.schedule_appointment'} SA
            LEFT JOIN ${'telenutrition.schedule_appointment_type'} SAT ON SAT.${'appointment_type_id'} = SA.${'appointment_type_id'} 
            INNER JOIN initial_patients_from_30_to_90_days_ago IP ON SA.${'patient_id'} = IP.${'patient_id'}
            WHERE 
              SA.${'provider_id'} = ${db.param(providerId)} 
              AND SAT.${'is_initial'} = FALSE
              AND SA.${'status'} IN ('3', '4')
              AND (SA.${'start_timestamp'} AT TIME ZONE ${db.param(timezone)})::DATE
                BETWEEN NOW() - INTERVAL '90 days' AND NOW() - INTERVAL '30 days'
        ),
        provider_encounters AS (
          SELECT 
            (SA.${'start_timestamp'} AT TIME ZONE ${db.param(timezone)})::DATE::TEXT AS appointment_date,
            COALESCE(CE.${'units_billed'}, 0) AS units_billed,
            SA.${'status'} IN ('3', '4') AS is_complete_visit
          FROM ${'telenutrition.clinical_encounter'} CE 
          LEFT JOIN ${'telenutrition.schedule_appointment'} SA ON SA.${'appointment_id'} = CE.${'appointment_id'} 
          LEFT JOIN ${'telenutrition.schedule_appointment_type'} SAT ON SAT.${'appointment_type_id'} = SA.${'appointment_type_id'} 
          WHERE 
            CE.${'provider_id'} = ${db.param(providerId)} 
            AND (SA.${'start_timestamp'} AT TIME ZONE ${db.param(timezone)})::DATE
              BETWEEN (${db.param(startDate)})::DATE AND (${db.param(endDate)})::DATE
        ),
        total_units_billed AS (
          SELECT SUM(units_billed) AS amount FROM provider_encounters
          WHERE is_complete_visit IS TRUE
        ),
        total_business_days AS (
          SELECT COUNT(day) AS count
          FROM generate_series(${db.param(startDate)}::DATE, ${db.param(endDate)}::DATE, '1 day') AS day
          LEFT JOIN ${'common.company_holiday'} CH ON CH.${'calendar_date'} = day 
          WHERE EXTRACT(DOW FROM day) BETWEEN 1 AND 5 AND CH.${'holiday_id'} IS NULL
        )
        SELECT 
        ( 
          SELECT amount FROM total_units_billed 
        ) AS total_billed,
        (
          ROUND(
            (( SELECT amount FROM total_units_billed )::float / ( SELECT count FROM total_business_days ))::numeric, 1
          )
        ) AS units_billed_per_business_day,
        (
          SELECT jsonb_build_object(
            'total_complete_visit_units_billed', 
              SUM(units_billed) FILTER (WHERE is_complete_visit IS TRUE),
            'total_complete_visit_count', 
              COUNT(1) FILTER (WHERE is_complete_visit IS TRUE)
          ) FROM provider_encounters
        ) AS encounter_stats_summary,
        (SELECT COUNT(patient_id) FROM initial_patients_from_30_to_90_days_ago) AS initial_patients_count,
        (SELECT COUNT(patient_id) FROM returning_patients_from_30_to_90_days_ago) AS returning_patients_count;
    `.run(rpool);

    const providerMetricsResult = providerMetrics[0];

    const totalUnitsBilled = Number(providerMetricsResult.total_billed);
    const unitsBilledPerBusinessDay = Number(providerMetricsResult.units_billed_per_business_day);

    const encounter_stats_summary = providerMetricsResult.encounter_stats_summary;
    
    const totalCompleteVisitUnitsBilled = Number(encounter_stats_summary.total_complete_visit_units_billed);
    const totalCompleteVisitCount = Number(encounter_stats_summary.total_complete_visit_count);
    const unitsBilledPerCompletedVisits = totalCompleteVisitCount == 0 ? null : totalCompleteVisitUnitsBilled / totalCompleteVisitCount;

    const returningPatients30To90DaysAgo = Number(providerMetricsResult.returning_patients_count);
    const initialPatients30To90DaysAgo = Number(providerMetricsResult.initial_patients_count);
    const patientPersistenceRate = initialPatients30To90DaysAgo < 5 ? null : returningPatients30To90DaysAgo / initialPatients30To90DaysAgo;

    return ok({
      totalUnitsBilled: totalUnitsBilled,
      unitsBilledPerBusinessDay: unitsBilledPerBusinessDay,
      unitsBilledPerCompletedVisits: unitsBilledPerCompletedVisits,
      patientPersistenceRate: patientPersistenceRate
    });
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

type ProviderPatientsResult = { patients: (zs.telenutrition.schedule_patient.JSONSelectable &
  zs.telenutrition.iam_identity.JSONSelectable & {
    last_session: string;
    next_session: string;
  })[], totalPatientCount: number };

export async function getProviderPatientsV2(context: IContext, params: GetProviderPastPatientsParams, providerId: number): 
  Promise<Result<ProviderPatientsResult, ErrCode>> {
  const TAG = [...MTAG, 'getProviderPatientsV2'];
  const {
    logger,
    store: { reader },
  } = context;
  const { patientIdNameQuery, paymentMethodTypeIds, daysSinceLastSession, limit, offset } = params

  try {
    const rpool = await reader();

    const patientId = Number(patientIdNameQuery);
    const normalizedQuery = patientIdNameQuery
      ? patientIdNameQuery
          .toLowerCase()
          .replace(/[^a-z, ]/g, '')
          .replace(/\s+/g, ' ')
          .trim()
      : '';

    const sortBy =
      {
        patientName: 'full_name',
        lastSession: 'PP.last_session',
        nextSession: 'PP.next_session',
      }[params.sortBy] || 'PP.last_session';
    const sortOrder = params.sortOrder?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const providerPatientsSql = await db.sql<
      | zs.telenutrition.schedule_appointment.SQL
      | zs.telenutrition.schedule_patient.SQL
      | zs.telenutrition.iam_identity.SQL
      | zs.telenutrition.schedule_patient_payment_method.SQL
      | zs.telenutrition.patient_summary.SQL,
      (zs.telenutrition.schedule_patient.JSONSelectable &
        zs.telenutrition.iam_identity.JSONSelectable & {
          last_session: string;
          next_session: string;
          total_patient_count: number;
        })[]
    >`
      WITH filtered_provider_patients AS (
        SELECT 
          DISTINCT SP.${'patient_id'},
          timezone(SP.${'timezone'}, PrevAppt.${'start_timestamp'})::DATE AS last_session,
          timezone(SP.${'timezone'}, NextAppt.${'start_timestamp'})::DATE AS next_session
        FROM ${'telenutrition.schedule_appointment'} SA
        INNER JOIN ${'telenutrition.schedule_patient'} SP ON SP.${'patient_id'} = SA.${'patient_id'}
        INNER JOIN ${'telenutrition.iam_identity'} II ON II.${'identity_id'} = SP.${'identity_id'}
        LEFT JOIN ${'telenutrition.patient_summary'} PS ON PS.${'patient_id'} = SP.${'patient_id'}
        LEFT JOIN ${'telenutrition.schedule_appointment'} NextAppt ON NextAppt.${'appointment_id'} = PS.${'next_appointment_id'}
        LEFT JOIN ${'telenutrition.schedule_appointment'} PrevAppt ON PrevAppt.${'appointment_id'} = PS.${'previous_appointment_id'}
        WHERE 
          SA.${'patient_id'} IS NOT NULL AND SA.${'provider_id'} = ${db.param(providerId)}
          ${
            isNaN(patientId)
              ? db.sql<zs.telenutrition.iam_identity.SQL>`AND II.${'norm_comma_name'} LIKE ${db.param(`${normalizedQuery}%`)}`
              : db.sql<zs.telenutrition.schedule_patient.SQL>`AND SP.${'patient_id'} = ${db.param(patientId)}`
          }
          ${
            daysSinceLastSession
              ? db.sql<zs.telenutrition.schedule_patient.SQL | zs.telenutrition.schedule_appointment.SQL>`
                AND PrevAppt.${'start_timestamp'} IS NOT NULL
                AND (CURRENT_DATE - timezone(SP.${'timezone'}, PrevAppt.${'start_timestamp'})::DATE) <= ${db.param(daysSinceLastSession)}`
              : db.sql``
          }
          ${
            paymentMethodTypeIds
              ? db.sql<zs.telenutrition.schedule_patient_payment_method.SQL>`
              AND EXISTS (
                SELECT 1
                FROM ${'telenutrition.schedule_patient_payment_method'} SPPM
                WHERE SPPM.${'patient_id'} = SP.patient_id
                  AND SPPM.${'visible'} = TRUE
                  AND SPPM.${'payment_method_type_id'} = ANY(${db.param(paymentMethodTypeIds)})
              )`
              : db.sql``
          }
      )
      SELECT 
        SP.${'patient_id'},
        SP.${'department_id'},
        SP.${'identity_id'},
        SP.${'state'},
        SP.${'address'},
        SP.${'address2'},
        SP.${'city'},
        SP.${'sex'},
        SP.${'phone'},
        SP.${'email'},
        SP.${'timezone'},
        II.${'first_name'},
        II.${'last_name'},
        II.${'first_name'} || ' ' || II.${'last_name'} AS full_name,
        TO_CHAR(II.${'birthday'}, 'YYYY-MM-DD') AS birthday,
        II.${'zip_code'},
        PP.last_session,
        PP.next_session,
        (SELECT COUNT(*) FROM filtered_provider_patients) AS total_patient_count
      FROM ${'telenutrition.schedule_patient'} SP
      INNER JOIN filtered_provider_patients PP ON SP.${'patient_id'} = PP.patient_id
      INNER JOIN ${'telenutrition.iam_identity'} II ON II.${'identity_id'} = SP.${'identity_id'}
      ORDER BY ${db.raw(`${sortBy} ${sortOrder}`)}
      LIMIT ${db.param(limit, 'int4')} OFFSET ${db.param(offset, 'int4')};
    `;
    const patients = await providerPatientsSql.run(rpool);
    const totalPatientCount = patients.length > 0 ? patients[0].total_patient_count : 0;

    return ok({patients, totalPatientCount});
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

export default {
  fetchProviderByName,
  fetchProviderBy,
  updateProviderOktaId,
  updateProvider,
  getProviderMetricsInDateRange,
  getDailyUnitsBilled,
  getProviderPatientsV2,
};
