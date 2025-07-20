import { err, ok, Result } from 'neverthrow'
import { ErrCode } from '@mono/common/lib/error'
import { IContext } from '@mono/common/lib/context'
import Store, { ScheduledSegment } from './store'
import * as _ from 'lodash'
import { z } from 'zod'
import { DateTime } from 'luxon'
import type { IdentifyPersonRequest, SegmentIdType } from '@mono/common/lib/integration/customerio/api'
import * as db from 'zapatos/db'
import '@mono/common/lib/zapatos/schema'
import * as zs from 'zapatos/schema'
import Api from '@mono/common/lib/integration/customerio/api'
import * as Cursor from 'pg-cursor'
import { PoolClient } from 'pg'
import { createCustomerIdentifer, CustomerRecord } from '@mono/common/lib/integration/customerio/service'
import { promiseMap } from '@mono/common/lib/promise'
import * as PhoneValidation from 'phone'
import { Logger } from '@mono/common'
import { createEnrollmentToken } from '../iam/enrollment'
import { shortenLink } from '@mono/common/lib/shortlink'


const MTAG = Logger.tag();


export enum SegmentRunStatusEnum {
  "STARTED" = 0,
  "COMPLETED" = 1,
  "FAILED" = 2,
}

export interface SegmentRecord {
  segmentId: number,
  name: string,
  description?: string,
  runInterval?: string,
  sql: string,
  count: number,
}

export type SegmentNewRecord = Omit<SegmentRecord, 'segmentId' | 'count'>

/**
 * Create manual segment in CIO using SQL query
 * @param context 
 * @param segment 
 * @returns 
 */
export async function createSegment(context: IContext, segment: SegmentNewRecord): Promise<Result<number, ErrCode>> {
  const { logger } = context
  const tag = [...MTAG, 'createSegment']

  try {
    if (/[^a-z0-9_\-]/i.test(segment.name)) {
      logger.error(context, tag, 'failed to create segment, invalidname', { name: segment.name })
      return err(ErrCode.INVALID_DATA)
    }


    // create segment in CIO
    const resultCreate = await Api.createSegment(context, { name: segment.name, description: segment.description })

    if (resultCreate.isErr()) {
      logger.error(context, tag, 'failed to create segment due to CIO api', { segment })
      return err(resultCreate.error)
    }

    const apiSegment = resultCreate.value

    const resultInsert = await Store.insertSegment(context, { ...segment, segmentId: apiSegment.id, count: 0 })

    if (resultInsert.isErr()) {
      logger.error(context, tag, 'created cio api segment, but failed to insert segment into database', { segment })
      return err(resultInsert.error)
    }

    const newSegment = resultInsert.value

    return ok(newSegment.segment_id)
  } catch (e) {
    logger.exception(context, tag, e)
    return err(ErrCode.EXCEPTION)
  }
}

export const CustomerWarehouseSchema = z.object({
  account_id: z.number().nullable(),
  member_id: z.string().nullable(),
  eligible_id: z.preprocess((arg) => parseInt(arg as string), z.number()).nullable(),
  user_id: z.number().nullable(),
  identity_id: z.number().nullable(),
  organization_id: z.number().nullable(),
  suborganization_id: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  zip_code: z.string().nullable(),
  state: z.string().nullable(),
  lang: z.string().nullable(),
  is_teleapp_user: z.boolean().optional(),
  is_teleapp_patient: z.boolean().optional(),
  last_appt_date: z.date().nullable().optional(),
  next_appt_date: z.date().nullable().optional(),
  account_enrollment_url: z.string().nullable(),
  programs: z.string().nullable(),
  last_provider_name: z.string().nullable(),
  date_of_birth: z.date().nullable().optional(),
  elevanceva_medical_plan: z.string().nullable().optional(),
  molinail_text_consent: z.string().nullable().optional(),
  caloptima_auth_to: z.date().nullable().optional(),
  careoregon_tier: z.string().nullable().optional(),
  careoregon_cco_name: z.string().nullable().optional(),
})

export type CustomerWarehouseRecord = z.infer<typeof CustomerWarehouseSchema>
export type CustomAttributes = Pick<CustomerRecord, 'enrollment_url'>

async function mapCustomerWarehouseRecord(context: IContext, record: CustomerWarehouseRecord): Promise<Result<CustomerRecord, ErrCode>> {
  const accountId = record.account_id === null ? null : record.account_id
  const eligibleId = record.eligible_id === null ? null : record.eligible_id|0
  const userId = record.user_id === null ? undefined : record.user_id|0
  const identityId = record.identity_id === null ? undefined : record.identity_id|0
  const email = record.email === null ? undefined : record.email.trim()
  const memberId = record.member_id === null ? undefined : record.member_id.trim()
  const firstName = record.first_name === null ? undefined : record.first_name.trim()
  const lastName = record.last_name === null ? undefined : record.last_name.trim()
  const zipCode = record.zip_code === null ? undefined : record.zip_code.trim()
  const state = record.state === null ? undefined : record.state.trim()
  const organizationId = record.organization_id === null ? undefined : record.organization_id
  const suborganizationId = record.suborganization_id === null ? undefined : record.suborganization_id
  const lang = record.lang === null ? undefined : record.lang.trim()
  const isTeleappUser = record.is_teleapp_user;
  const isTeleappPatient = record.is_teleapp_patient;
  const lastApptDate = record.last_appt_date ? record.last_appt_date.getTime()/1000 : undefined;
  const nextApptDate = record.next_appt_date ? record.next_appt_date.getTime()/1000 : undefined;
  const accountEnrollmentUrl = record.account_enrollment_url === null ? undefined : record.account_enrollment_url;
  const lastProviderName = record.last_provider_name === null ? undefined : record.last_provider_name.trim();
  const dateOfBirth = record.date_of_birth === null ? undefined : record.date_of_birth;
  const elevanceVAMedicalPlan = record.elevanceva_medical_plan === null ? undefined : record.elevanceva_medical_plan;
  const molinaILTextConsent = record.molinail_text_consent === null ? undefined : record.molinail_text_consent;
  const caloptimaAuthTo = record.caloptima_auth_to === null ? undefined : record.caloptima_auth_to;
  const careoregonTier = record.careoregon_tier === null ? undefined : record.careoregon_tier;
  const careoregonCcoName = record.careoregon_cco_name === null ? undefined : record.careoregon_cco_name;

  let phone = record.phone === null ? undefined : record.phone.trim()
  
  if (phone !== undefined) {
    if (phone.startsWith('+11') && phone.length === 13) {
      phone = phone.replace('+11', '+1');
    }
    const validation = PhoneValidation.phone(phone, {country: 'USA'})
    phone = validation.isValid ? validation.phoneNumber : undefined
  }

  const customerIdentiferResult = createCustomerIdentifer(context, {
    identityId: identityId ?? undefined,
    eligibleId: eligibleId ?? undefined,
  })
  if (customerIdentiferResult.isErr()) {
    return err(customerIdentiferResult.error)
  }
  const customerIdentifer = customerIdentiferResult.value

  let enrollmentUrl: string | undefined

  if (accountEnrollmentUrl !== undefined && accountId !== null) {
    const enrollmentTokenResult = await createEnrollmentToken(context, accountId, eligibleId ?? undefined)
    if (enrollmentTokenResult.isErr()) {
      return err(enrollmentTokenResult.error)
    }
    const enrollmentToken = enrollmentTokenResult.value
    const separator = accountEnrollmentUrl.includes('?') ? '&' : '?'
    enrollmentUrl = `${accountEnrollmentUrl}${separator}enrollment=${enrollmentToken}`
  }

  let programs: string[] = []

  if (record.programs !== null) {
    programs = record.programs.split('|')
  }

  return ok({
    id: customerIdentifer,
    ...(email && {email}),
    ...(phone && {phone}),
    ...(eligibleId && {eligible_id: eligibleId}),
    ...(memberId && {member_id: memberId}),
    ...(userId && {user_id: userId}),
    ...(identityId && {identity_id: identityId}),    
    ...(memberId && {member_id: memberId}),
    ...(firstName && {firstname: firstName}),
    ...(lastName && {lastname: lastName}),
    ...(zipCode && {zip_code: zipCode}),
    ...(state && {state}) ,
    ...(accountId && {account_id: accountId}),
    ...(organizationId && {organization_id: organizationId}),
    ...(suborganizationId && {suborganization_id: suborganizationId}),
    ...(lang && {lang}),
    ...(isTeleappUser !== undefined ? {is_teleapp_user: isTeleappUser} : {}),
    ...(isTeleappPatient !== undefined ? {is_teleapp_patient: isTeleappPatient} : {}),
    ...(lastApptDate && {last_appt_date: lastApptDate}),
    ...(nextApptDate && {next_appt_date: nextApptDate}),
    ...(enrollmentUrl && {enrollment_url: enrollmentUrl}),
    ...(lastProviderName && {last_provider_name: lastProviderName}),
    ...(dateOfBirth && {date_of_birth: dateOfBirth}),
    ...(elevanceVAMedicalPlan && {elevanceva_medical_plan: elevanceVAMedicalPlan}),
    ...(molinaILTextConsent && {molinail_text_consent: molinaILTextConsent}),
    ...(caloptimaAuthTo && {caloptima_auth_to: caloptimaAuthTo}),
    ...(careoregonTier && {careoregon_tier: careoregonTier}),
    ...(careoregonCcoName && {careoregon_cco_name: careoregonCcoName}),
    programs,
  })
}

export interface SyncCustomersWithSqlOptions {
  custom?: (context: IContext, customer: CustomerRecord) => Promise<Result<CustomAttributes, ErrCode>>,
}

export async function syncCustomersWithSql(context: IContext, sql: string, options: SyncCustomersWithSqlOptions = {}): Promise<Result<number, ErrCode>> {
  const { logger, redshift } = context
  const tag = [...MTAG, 'syncCustomersWithSql']

  try {
    // create new sync run record
    const rspool = await redshift()
    const { rows } = await rspool.query<CustomerWarehouseRecord>(sql)

    if (rows.length === 0) {
      logger.error(context, tag, 'no records found from redshift query', { sql })
      return err(ErrCode.NOT_FOUND)
    }

    for (let row of rows) {
      const result = CustomerWarehouseSchema.safeParse(row)

      if (!result.success) {
        logger.error(context, tag, 'failed to parse warehouse record', { row, error: result.error })
        return err(ErrCode.INVALID_DATA)
      }
    }

    const results = await promiseMap<void, ErrCode>(rows.map(row => {
      return async () => {
        const resultCustomer = await mapCustomerWarehouseRecord(context, row)

        if (resultCustomer.isErr()) {
          logger.error(context, tag, 'failed to map from warehouse record to customerio record')
          return err(resultCustomer.error)
        }

        let customer = resultCustomer.value

        // allow other services to add custom attributes to customer record
        if (options.custom !== undefined) {
          const result = await options.custom(context, customer)

          if (result.isErr()) {
            logger.error(context, tag, 'failed to run custom function')
            return err(result.error)
          }

          customer = { ...customer, ...result.value }
        }

        const cioAttributes = _.omit(customer, 'id')

        // shorten enrollment url
        if (cioAttributes.enrollment_url !== undefined) {
          const result = await shortenLink(context, cioAttributes.enrollment_url, {expires: {year: 1}, length: 16 })
          if (result.isOk()) {
            cioAttributes.enrollment_url = result.value.url
          } else {
            logger.error(context, tag, 'failed to shorten enrollment url', { url: cioAttributes.enrollment_url, options: {expires: {year: 1}, length: 16 }, error: result.error })
          }
        }

        const result = await Api.addOrUpdateCustomer(context, customer.id, {
          id: customer.id,
        }, cioAttributes)


        if (result.isErr()) {
          logger.error(context, tag, 'failed to sync customer', { row })
          return err(result.error)
        }
        return ok(undefined)
      }
    }), { concurrency: 10 })

    return ok(results.length)
  } catch (e) {
    logger.exception(context, tag, e)
    return err(ErrCode.EXCEPTION)
  }
}


interface SyncCustomersOptions {
  limit?: number,
}

interface SyncCustomersReport {
  queryRowCount: number,
  cioErrorCount: number,
  insertedCount: number,
  updatedCount: number,
  syncedCount: number,
}

export enum CustomerSyncStatusEnum {
  "STARTED" = 0,
  "COMPLETED" = 1,
  "FAILED" = 2,
}

export async function syncCustomers(context: IContext, options?: SyncCustomersOptions): Promise<Result<SyncCustomersReport, ErrCode>> {
  const { logger, redshift, store } = context
  const tag = [...MTAG, 'syncCustomers']

  let client: PoolClient | null = null;
  let cursor: any | null = null;

  try {
    const syncStart = DateTime.now();
    logger.debug(context, tag, 'start of cio customer sync', { syncStart, options })

    const storePool = await store.writer();
    const redshiftPool = await redshift()
    client = await redshiftPool.connect()

    const customerSync = await db.insert('marketing.cio_customer_sync', {
      status: CustomerSyncStatusEnum.STARTED,
    }).run(storePool);

    const query = buildSyncCustomerQuery(context, options)
    cursor = client.query(new Cursor(query))

    let queryRowCount = 0;
    let cioErrorCount = 0;
    let insertedCount = 0;
    let updatedCount = 0;
    let syncedCount = 0;
    while (true) {
      const syncTimeLimitReached = syncStart.plus({ minutes: 55 }) < DateTime.now();
      if (syncTimeLimitReached) {
        logger.warn(context, tag, 'sync time limit reached, stopping sync', { syncStart, syncedCount })
        break;
      }

      const batchSize = 250;
      const rows = await cursor.read(batchSize);
      if (rows.length === 0) {
        break;
      }

      const processBatchResult = await processSyncCustomersBatch(context, rows);
      if (processBatchResult.isErr()) {
        // On error, update the sync record
        await db.update('marketing.cio_customer_sync', {
          status: CustomerSyncStatusEnum.FAILED,
          stopped_at: DateTime.now().toJSDate(),
          result: { queryRowCount, cioErrorCount, insertedCount, updatedCount, syncedCount },
        }, { customer_sync_id: customerSync.customer_sync_id }).run(storePool);
        return err(ErrCode.SERVICE)
      }
      queryRowCount += processBatchResult.value.queryRowCount;
      cioErrorCount += processBatchResult.value.cioErrorCount;
      insertedCount += processBatchResult.value.insertedCount;
      updatedCount += processBatchResult.value.updatedCount;
      syncedCount += processBatchResult.value.syncedCount;
    }

    const report = { queryRowCount, cioErrorCount, insertedCount, updatedCount, syncedCount }

    // On success, update the sync record
    await db.update('marketing.cio_customer_sync', {
      status: CustomerSyncStatusEnum.COMPLETED,
      stopped_at: DateTime.now().toJSDate(),
      result: report,
    }, { customer_sync_id: customerSync.customer_sync_id }).run(storePool);

    logger.debug(context, tag, 'end of cio customer sync')
    return ok(report)
  } catch (e) {
    logger.exception(context, tag, e)
    return err(ErrCode.EXCEPTION)
  } finally {
    logger.debug(context, tag, 'cleaning up cursor and client.')
    if (cursor !== null) await cursor.close();
    if (client !== null) client.release();
  }
}

function buildSyncCustomerQuery(context: IContext, options?: SyncCustomersOptions): string {
  const { logger, config } = context
  const tag = [...MTAG, 'buildSyncCustomerQuery']

  let query = ''
  if (config.isProduction) {
    query = `
      WITH sched_ref as (
        select
          identity_id,
          source_data,
          ROW_NUMBER() over (partition by identity_id order by created_at desc) rn
        from fq_common_telenutrition.schedule_referral sr
        QUALIFY rn=1
      ),
      customers AS (
        SELECT
          ('id:' || ID.identity_id) AS id,
          ID.identity_id AS identity_id,
          ID.account_id,
          ID.first_name,
          ID.last_name,
          ID.zip_code,
          COALESCE(U.user_id, UPU.user_id) AS user_id,
          E.person_id AS member_id,
          E.id AS eligible_id,
          E.organization_id,
          E.suborganization_id,
          COALESCE(P.email, U.email, public.aes_decrypt_mysql(to_hex(cast(E.email_crypt as varbyte)), 'complicatedkeyforAESencryption', 'hex'), UPU.email) AS email,
          CASE 
            WHEN P.phone IS NOT NULL THEN CONCAT('+', regexp_replace(P.phone, '[^0-9]', ''))
            WHEN U.phone IS NOT NULL THEN regexp_replace(U.phone, '[^0-9]', '')
            WHEN E.mobile_phone IS NOT NULL THEN CONCAT('+1', regexp_replace(E.mobile_phone, '[^0-9]', ''))
            WHEN UPU.phone IS NOT NULL THEN regexp_replace(UPU.phone, '[^0-9]', '')
            ELSE NULL
          END AS phone,
          COALESCE(P.state, E.state) AS state,
          E.language AS lang,
          (U.identity_id IS NOT NULL) AS is_teleapp_user,
          (P.identity_id IS NOT NULL) AS is_teleapp_patient,
		      last_appt.last_appt_date,
          next_appt.next_appt_date,
          CASE
            WHEN A.account_id IS NOT NULL AND U.identity_id IS NULL AND P.identity_id IS NULL THEN NVL(A.enrollment_url, '${config.telenutrition.enrollment.default_url}')
            ELSE NULL
          END as account_enrollment_url,
          lsr.last_provider_name,
          coalesce(p.birthday, id.birthday) as date_of_birth,
          case when ID.account_id = 45 then
              coalesce(
                  JSON_EXTRACT_PATH_TEXT(E.raw_data, 'MEDICAL_PLAN', true),
                  JSON_EXTRACT_PATH_TEXT(SR.source_data, 'MEDICAL_PLAN', true)
              )
          end as elevanceva_medical_plan,
          case when ID.account_id = 79 then
              coalesce(
                  JSON_EXTRACT_PATH_TEXT(E.raw_data, 'text_consent', true),
                  JSON_EXTRACT_PATH_TEXT(SR.source_data, 'text_consent', true)
              )
          end as molinail_text_consent,
          case when ID.account_id = 61 then
              coalesce(
                  try_cast(JSON_EXTRACT_PATH_TEXT(E.raw_data, 'AUTH_TO', true) as date),
                  try_cast(JSON_EXTRACT_PATH_TEXT(SR.source_data, 'AUTH_TO', true) as date)
              )
          end as caloptima_auth_to,
          case when ID.account_id = 62 then
              coalesce(
                  JSON_EXTRACT_PATH_TEXT(E.raw_data, 'Tier', true),
                  JSON_EXTRACT_PATH_TEXT(SR.source_data, 'Tier', true)
              )
          end as careoregon_tier,
          case when ID.account_id = 62 then
              coalesce(
                  JSON_EXTRACT_PATH_TEXT(E.raw_data, 'ccoName', true),
                  JSON_EXTRACT_PATH_TEXT(SR.source_data, 'ccoName', true)
              )
          end as careoregon_cco_name
        FROM
          fq_common_telenutrition.iam_identity ID
          LEFT JOIN fq_teleapp_common.account A ON A.account_id = ID.account_id
          LEFT JOIN fq_common_telenutrition.iam_user U ON U.identity_id = ID.identity_id
          LEFT JOIN fq_common_telenutrition.schedule_patient P ON P.identity_id = ID.identity_id
          LEFT JOIN fq_common_telenutrition.schedule_user_patient UP ON UP.patient_id = P.patient_id
          LEFT JOIN fq_common_telenutrition.iam_user UPU ON UPU.user_id = UP.user_id
          LEFT JOIN fq_foodapp_tenants.go_users_eligible E ON ID.eligible_id = E.id
          left join sched_ref SR on SR.identity_id = ID.identity_id
          LEFT JOIN
              (
              SELECT patient_id, max(start_timestamp :: date) as last_appt_date
              FROM analytics.dim_appointment
              WHERE status_normalized = 'completed'
              GROUP BY patient_id
              ) last_appt
              ON P.patient_id = last_appt.patient_id
          LEFT JOIN
            (
            SELECT patient_id, max(start_timestamp :: date) as next_appt_date
            FROM analytics.dim_appointment
            WHERE status_normalized = 'booked'
            AND start_timestamp :: date >= current_date :: date
            GROUP BY patient_id
            ) next_appt
            ON P.patient_id = next_appt.patient_id
          LEFT JOIN
            (
            SELECT 
            sp.first_name || ' ' || sp.last_name as last_provider_name
            , patient_id
            , start_timestamp
            , row_number() over (partition by patient_id order by start_timestamp desc) as rownum
            FROM analytics.dim_appointment da
            JOIN fq_common_telenutrition.schedule_provider sp ON sp.provider_id = da.provider_id
            WHERE status_normalized = 'completed'
            ) lsr
            ON P.patient_id = lsr.patient_id and lsr.rownum = 1
            WHERE E.email_crypt not like 'aes_encrypt%'
      ),
      customers_with_programs AS (
      	SELECT
      	  C.identity_id,
          LISTAGG(DISTINCT PR.program_code, '|') WITHIN GROUP (ORDER BY PR.program_code) AS programs
      	FROM customers C
      	LEFT JOIN fq_teleapp_common.program_membership PRM ON PRM.identity_id = C.identity_id
      	LEFT JOIN fq_teleapp_common.program PR ON PR.program_id=PRM.program_id
      	WHERE
      		PRM.program_id IS NOT NULL
      	GROUP BY C.identity_id
      ),
      customers_with_hash AS (
        SELECT C.*,
        CP.programs, 
          md5(
                COALESCE(C.identity_id::TEXT, '') || ',' ||
                COALESCE(account_id::TEXT, '') || ',' ||
                COALESCE(first_name, '') || ',' ||
                COALESCE(last_name, '') || ',' ||
                COALESCE(user_id::TEXT, '') || ',' ||
                COALESCE(member_id::TEXT, '') || ',' ||
                COALESCE(eligible_id::TEXT, '') || ',' ||
                COALESCE(organization_id::TEXT, '') || ',' ||
                COALESCE(suborganization_id::TEXT, '') || ',' ||
                COALESCE(email::TEXT, '') || ',' ||
                COALESCE(phone, '') || ',' ||
                COALESCE(state, '') || ',' ||
                COALESCE(lang, '') || ',' ||
                COALESCE(is_teleapp_user::INT::TEXT, '') || ',' ||
                COALESCE(is_teleapp_patient::INT::TEXT, '') || ',' ||
                COALESCE(last_appt_date::TEXT, '') || ',' ||
                COALESCE(next_appt_date::TEXT, '') || ',' ||
                COALESCE(last_provider_name, '') || ',' ||
                COALESCE(zip_code, '') || ',' ||
                CASE
                  WHEN account_enrollment_url IS NOT NULL THEN account_enrollment_url || 'v2'
                  ELSE ''
                END || ',' || 
                COALESCE(programs, '') || ',' || 
                COALESCE(date_of_birth::TEXT, '') || ',' ||
                COALESCE(elevanceva_medical_plan, '') || ',' ||
                COALESCE(molinail_text_consent, '') || ',' ||
                COALESCE(caloptima_auth_to::TEXT, '') || ',' ||
                COALESCE(careoregon_tier, '') || ',' ||
                COALESCE(careoregon_cco_name, '')
            ) AS "hash" 
        FROM customers C
        LEFT JOIN customers_with_programs CP ON CP.identity_id=C.identity_id
      )
      SELECT C.* FROM customers_with_hash C
      LEFT JOIN fq_teleapp_marketing.cio_customer CC ON (C.id = CC.id AND C.hash = CC.hash)
      WHERE CC.id IS null
      ${options?.limit !== undefined ? `LIMIT ${options.limit}` : ''}
    `; 
  } else {
    query = `
      SELECT DISTINCT
        'id:' || random_id AS id,
        random_id AS identity_id,
        CASE WHEN MOD(random_id, 2) = 0 THEN MOD(random_id, 5) ELSE NULL END AS account_id,
        'First' AS first_name,
        'Last' AS last_name,
        '94133' AS zip_code,
        CASE WHEN MOD(random_id, 3) = 0 THEN random_id ELSE NULL END AS user_id,
        random_id::TEXT AS member_id,
        random_id::TEXT AS eligible_id,
        MOD(random_id, 6) organization_id,
        MOD(random_id, 7)::TEXT AS suborganization_id,
        'testemail' || random_id || '@domain.com' AS email,
        CASE WHEN MOD(random_id, 2) = 0 THEN '+14155555555' ELSE NULL END AS phone,
        'CA' AS state,
        'en' AS lang,
        random_id % 2 = 0 AS is_teleapp_user,
        random_id % 3 = 0 AS is_teleapp_patient,
        '2023-04-02'::DATE AS last_appt_date,
        '2024-07-14'::DATE AS next_appt_date,
        NULL AS account_enrollment_url,
        NULL AS programs,
        MD5('test') AS hash,
        'Last Provider Name' AS last_provider_name,
        null as date_of_birth,
        null as elevanceva_medical_plan,
        null as molinail_text_consent,
        null as caloptima_auth_to,
        null as careoregon_tier,
        null as careoregon_cco_name
      FROM (SELECT FLOOR(RANDOM() * 1000000) + 5000000 AS random_id FROM (SELECT generate_series(1, 10000) AS i) t)
      ${options?.limit !== undefined ? `LIMIT ${options.limit}` : 'LIMIT 1'}
    `
  }

  logger.debug(context, tag, 'built customer sync query', { query })
  return query;
}

const BatchCustomerWarehouseSchema = z.array(
  CustomerWarehouseSchema.extend({
    id: z.string(),
    hash: z.string(),
  })
)

export async function processSyncCustomersBatch(context: IContext, rows: unknown[]): Promise<Result<SyncCustomersReport, ErrCode>> {
  const { logger, store } = context
  const tag = [...MTAG, 'processSyncCustomersBatch']

  try {
    const pool = await store.writer()
    logger.debug(context, tag, 'start of batch', { rowCount: rows.length })

    const parseResult = BatchCustomerWarehouseSchema.safeParse(rows)
    if (!parseResult.success) {
      logger.error(context, tag, 'failed to parse customer warehouse record', { error: parseResult.error })
      return err(ErrCode.INVALID_DATA)
    }
    const parsedRows = parseResult.data

    const identifyPersonRequests: IdentifyPersonRequest[] = []
    const rowsToUpsert: zs.marketing.cio_customer.Insertable[] = []
    for (const row of parsedRows) {
      const resultCustomer = await mapCustomerWarehouseRecord(context, row)
      if (resultCustomer.isErr()) {
        logger.error(context, tag, 'failed to map from warehouse record to customerio record')
        return err(resultCustomer.error)
      }
      let customer = resultCustomer.value
      if (customer.id !== row.id) {
        logger.error(context, tag, 'query did not return the same id as mapCustomerRecord', { rowId: row.id, customerId: customer.id })
        return err(ErrCode.SERVICE)
      }

      const { id, ...attributes } = customer

      // shorten enrollment url
      if (attributes.enrollment_url !== undefined) {
        const result = await shortenLink(context, attributes.enrollment_url, {expires: {year: 1}, length: 16 })
        if (result.isOk()) {
          attributes.enrollment_url = result.value.url
        } else {
          logger.error(context, tag, 'failed to shorten enrollment url', { url: attributes.enrollment_url, options: {expires: {year: 1}, length: 16 }, error: result.error })
        }
      }

      identifyPersonRequests.push({
        type: 'person',
        identifiers: { id },
        action: 'identify',
        attributes,
      })

      rowsToUpsert.push({
        id,
        hash: row.hash,
      })
    }

    if (identifyPersonRequests.length !== rowsToUpsert.length) {
      logger.error(context, tag, 'failed sync validation. aborting sync.')
      return err(ErrCode.SERVICE)
    }

    const cioResult = await Api.batch(context, { batch: identifyPersonRequests });
    if (cioResult.isErr()) {
      return err(ErrCode.SERVICE)
    }
    const cioErrors = cioResult.value.errors;

    let insertedCount = 0;
    let updatedCount = 0;
    let syncedCount = 0;
    if (cioErrors.length === 0) {
      const upsertResult = await db.upsert('marketing.cio_customer', rowsToUpsert, 'id').run(pool)
      for (const row of upsertResult) {
        if (row.$action === 'INSERT') insertedCount++;
        else if (row.$action === 'UPDATE') updatedCount++;
        syncedCount++;
      }
    } else {
      logger.error(context, tag, 'cio returned errors for identify customer batch', cioErrors)
    }

    const report = {
      queryRowCount: rows.length,
      cioErrorCount: cioErrors.length,
      insertedCount,
      updatedCount,
      syncedCount
    }
    logger.debug(context, tag, 'end of batch', report)
    return ok(report)
  } catch (e) {
    logger.exception(context, tag, e)
    return err(ErrCode.EXCEPTION)
  }
}


export async function syncSegment(context: IContext, segmentId: number): Promise<Result<number, ErrCode>> {
  const { logger, redshift, store } = context
  const tag = [...MTAG, 'syncSegment']

  try {
    const pgpool = await store.writer()
    logger.debug(context, tag, 'Starting to sync segment', { segmentId })

    // Fetch the segment
    const segment = await db.selectOne('marketing.cio_segment', { segment_id: segmentId }, {
      lateral: {
        last_run: db.selectOne('marketing.cio_segment_run', { segment_run_id: db.parent('segment_run_id') })
      }
    }).run(pgpool)
    if (segment === undefined) {
      logger.error(context, tag, 'Could not fetch segment', { segmentId })
      return err(ErrCode.NOT_FOUND)
    }

    // Check that the segment isn't already running
    if (segment.last_run?.status === SegmentRunStatusEnum.STARTED && DateTime.fromISO(segment.last_run.started_at, { zone: 'utc' }) > DateTime.now().minus({ hours: 1 })) {
      logger.error(context, tag, 'A run for this segment has already been started within the last hour.', { segmentId })
      return err(ErrCode.STATE_VIOLATION)
    }

    // Create a new run and link the segment to it
    const updates = await db.serializable(pgpool, async txn => {
      const run = await db.insert('marketing.cio_segment_run', {
        segment_id: segment.segment_id,
        status: SegmentRunStatusEnum.STARTED
      }).run(txn)

      const updated = db.update('marketing.cio_segment', {
        segment_run_id: run.segment_run_id
      }, {
        segment_id: segment.segment_id
      }).run(txn)

      return { segment: updated, run }
    })

    // Run the sql query
    const rspool = await redshift()
    const { rows } = await rspool.query<{ identity_id?: number | null, eligible_id?: number | null }>(segment.sql)
    if (rows.length === 0) {
      logger.error(context, tag, 'no records found from sql query', { sql: segment.sql })
      return err(ErrCode.NOT_FOUND)
    }

    // Send to Customer.io in chunks
    const chunks = _.chunk(rows, 1000)
    for (let rows of chunks) {
      const groups = rows.reduce((acc, row) => {
        const { id, email, cio_id } = acc

        const result = createCustomerIdentifer(context, {
          identityId: row.identity_id ?? undefined,
          eligibleId: row.eligible_id ?? undefined,
        })

        if (result.isErr()) {
          logger.error(context, tag, 'failed to sync segment, missing id type for row', { row })
          return err(ErrCode.STATE_VIOLATION)
        }
        id.push(result.value)

        return acc
      }, { id: [], email: [], cio_id: [] } as Record<SegmentIdType, string[]>)

      for (let [idType, ids] of Object.entries(groups)) {
        const result = await Api.addSegmentMembers(context, segmentId, ids as string[], idType as SegmentIdType)

        if (result.isErr()) {
          // On failure, update the run
          logger.error(context, tag, 'failed to add members to cio segment with api call', { idType, segmentId, ids })
          await db.update('marketing.cio_segment_run', {
            status: SegmentRunStatusEnum.FAILED,
            stopped_at: DateTime.now().toJSDate(),
            result: JSON.stringify({ count: rows.length })
          }, { segment_run_id: updates.run.segment_run_id }).run(pgpool)
          return err(result.error)
        }
      }
    }

    // On success, update the run
    await db.update('marketing.cio_segment_run', {
      status: SegmentRunStatusEnum.COMPLETED,
      stopped_at: DateTime.now().toJSDate(),
      result: JSON.stringify({ count: rows.length })
    }, { segment_run_id: updates.run.segment_run_id }).run(pgpool)

    logger.debug(context, tag, 'Finished syncing segment', { segmentId, count: rows.length })
    return ok(rows.length)
  } catch (e) {
    logger.exception(context, tag, e)
    return err(ErrCode.EXCEPTION)
  }
}


export type SegmentSyncReport = ({
  status: 'completed'
  count: number,
  segment: ScheduledSegment,
} | {
  status: 'failed',
  segment: ScheduledSegment,
})

async function syncScheduledSegments(context: IContext): Promise<Result<SegmentSyncReport[], ErrCode>> {
  const tag = [...MTAG, 'syncScheduledSegments'];
  const { logger } = context;

  try {
    const selectScheduledSegmentsToSyncResult = await Store.selectScheduledSegmentsToSync(context)
    if (selectScheduledSegmentsToSyncResult.isErr()) {
      logger.error(context, tag, 'Error getting segments to sync')
      return err(ErrCode.SERVICE)
    }
    const segmentsToSync = selectScheduledSegmentsToSyncResult.value

    const segmentSyncReport: SegmentSyncReport[] = []
    for (const segment of segmentsToSync) {
      const syncSegmentResult = await syncSegment(context, segment.segmentId)
      if (syncSegmentResult.isOk()) {
        segmentSyncReport.push({
          status: 'completed',
          count: syncSegmentResult.value,
          segment,
        })
      } else {
        segmentSyncReport.push({
          status: 'failed',
          segment,
        })
      }
    }

    return ok(segmentSyncReport);
  } catch (e) {
    logger.exception(context, tag, e);
    return err(ErrCode.EXCEPTION);
  }
}


export default {
  syncCustomers,
  createSegment,
  syncSegment,
  syncScheduledSegments,
}