import { err, ok, Result } from 'neverthrow'
import * as Cursor from 'pg-cursor'
import { v4 as uuidv4 } from 'uuid';
import {format} from 'date-fns'
import * as csv from 'csv-stringify/sync'
import * as dateFns from 'date-fns'
import * as fs from 'fs'

import { ErrCode } from '@mono/common/lib//error'
import { IContext } from "@mono/common/lib/context"
import Logger from '@mono/common/lib/logger'
import {
  WAREHOUSE_SCHEMA_NAME as FOODAPP_SCHEMA_NAME, 
  WAREHOUSE_STAGING_SCHEMA_NAME as FOODAPP_STAGING_SCHEMA_NAME,
  STAGE_RAW_TABLE_SUFFIX
 } from '../warehouse/config'
import { PutObjectCommand } from '@aws-sdk/client-s3'

const MTAG = Logger.tag()

const SCHEMA_NAME = 'marketing'
const TAKEN_FFQ_TABLE_NAME = 'customerio_taken_ffq'
const SQ_EXPENSIVE_FOOD_TABLE_NAME = 'customerio_sq_expensive_food'
const EVENTS_TABLE_NAME = 'customerio_events'
const USER_ATTRIBUTES_TABLE_NAME = 'customerio_user_attributes'

const TRANSFORM_BATCH_SIZE = 7500

/**
 * Create temporary taken_ffq table.
 */
async function createTakenFfqTable(context: IContext, pool) {
  const TAG = [...MTAG, 'createTakenFfqTable']
  const { logger } = context
  const query=
`
DROP TABLE IF EXISTS ${SCHEMA_NAME}.${TAKEN_FFQ_TABLE_NAME};

CREATE TABLE ${SCHEMA_NAME}.${TAKEN_FFQ_TABLE_NAME} (
  user_id VARCHAR,
  diet_response_time TIMESTAMP WITHOUT TIME ZONE,
  num_responses BIGINT
);

BEGIN TRANSACTION;

TRUNCATE ${SCHEMA_NAME}.${TAKEN_FFQ_TABLE_NAME};

INSERT INTO ${SCHEMA_NAME}.${TAKEN_FFQ_TABLE_NAME}
  SELECT
    user_id::VARCHAR,
    MAX(response_time) AS diet_response_time,
    COUNT(DISTINCT question) AS num_responses
FROM ${FOODAPP_SCHEMA_NAME}.survey_response
WHERE survey IN (
  'long-ffq', 
  'complete-diet', 
  'nutrition-essential-exercise', 
  'nutrition-essential-fat', 
  'nutrition-essential-grain', 
  'nutrition-essential-intro', 
  'nutrition-essential-protein', 
  'nutrition-essential-sugar', 
  'nutrition-essential-vegetable', 
  'complete-nutriquiz'
)
GROUP BY user_id;

END TRANSACTION;
`
  logger.info(context, TAG, `Creating table - ${TAKEN_FFQ_TABLE_NAME}`, { table: TAKEN_FFQ_TABLE_NAME})
  await pool.query(query)
  logger.info(context, TAG, `Created table - ${TAKEN_FFQ_TABLE_NAME}`, { table: TAKEN_FFQ_TABLE_NAME})
}

/**
 * Create temporary sq_expensive_food (survey question expensive food) table.
 */
async function createSqExpensiveFoodTable(context: IContext, pool) {
  const TAG = [...MTAG, `createSqExpensiveFoodTable`]
  const { logger } = context
  const query =
`
DROP TABLE IF EXISTS ${SCHEMA_NAME}.${SQ_EXPENSIVE_FOOD_TABLE_NAME};

CREATE TABLE ${SCHEMA_NAME}.${SQ_EXPENSIVE_FOOD_TABLE_NAME} (
  user_id VARCHAR,
  response VARCHAR,
  response_time TIMESTAMP WITHOUT TIME ZONE
);

BEGIN TRANSACTION;

TRUNCATE ${SCHEMA_NAME}.${SQ_EXPENSIVE_FOOD_TABLE_NAME};

INSERT INTO ${SCHEMA_NAME}.${SQ_EXPENSIVE_FOOD_TABLE_NAME}
SELECT 
  sr.user_id as user_id, 
  RTRIM(LTRIM(sr.response, '["'), '"]') as response, 
  sr.response_time as response_time
FROM ${FOODAPP_SCHEMA_NAME}.survey_response AS sr 
INNER JOIN (
  SELECT
    user_id, 
    max(response_time) as response_time 
  FROM ${FOODAPP_SCHEMA_NAME}.survey_response 
  WHERE question = 'expensive_food' 
  GROUP BY user_id
) AS sr_summary 
ON
  sr.user_id = sr_summary.user_id AND
  sr.question = 'expensive_food' AND
  sr.response_time = sr_summary.response_time
;

END TRANSACTION
`
  logger.info(context, TAG, `Creating expensive food table - ${SQ_EXPENSIVE_FOOD_TABLE_NAME}`, { table: SQ_EXPENSIVE_FOOD_TABLE_NAME, query, })
  await pool.query(query)
  logger.info(context, TAG, `Created expensive food table - ${SQ_EXPENSIVE_FOOD_TABLE_NAME}`, { table: SQ_EXPENSIVE_FOOD_TABLE_NAME, query })
}

/**
 * Create temporary events table which aggregates data from event_user.
 */
async function createEventsTable(context: IContext, pool) {
  const TAG = [...MTAG, 'createEventsTable']
  const { logger } = context
  const query = 
`
DROP TABLE IF EXISTS ${SCHEMA_NAME}.${EVENTS_TABLE_NAME};

CREATE TABLE ${SCHEMA_NAME}.${EVENTS_TABLE_NAME} (
  user_id VARCHAR,
  last_active TIMESTAMP WITHOUT TIME ZONE,
  used_android TIMESTAMP WITHOUT TIME ZONE,
  used_ios TIMESTAMP WITHOUT TIME ZONE,
  used_web TIMESTAMP WITHOUT TIME ZONE,
  used_orderwell TIMESTAMP WITHOUT TIME ZONE,
  last_pageview_home TIMESTAMP WITHOUT TIME ZONE,
  last_pageview_tn TIMESTAMP WITHOUT TIME ZONE,
  last_pageview_nq TIMESTAMP WITHOUT TIME ZONE
);

BEGIN TRANSACTION;

TRUNCATE ${SCHEMA_NAME}.${EVENTS_TABLE_NAME};

INSERT INTO ${SCHEMA_NAME}.${EVENTS_TABLE_NAME}
WITH platform_events AS (
  SELECT
    user_id,
    max(event_timestamp_pst) AS last_active_date,
    client_platform,
    app_name
  FROM event_user
  WHERE user_id != '(null)'
  GROUP BY user_id, client_platform, app_name
),
all_platforms AS (
  SELECT
    distinct user_id,
    case when client_platform = 'android' then last_active_date else NULL end as used_android,
    case when client_platform = 'ios' then last_active_date else NULL end as used_ios,
    case when client_platform = 'web' then last_active_date else NULL end as used_web,
    case when app_name = 'orderwell' then last_active_date else NULL end as used_orderwell
  FROM platform_events
),
max_all_platforms AS (
  SELECT
    user_id,
    max(used_web) as used_web,
    max(used_android) as used_android,
    max(used_ios) as used_ios,
    max(used_orderwell) as used_orderwell
  FROM all_platforms
  GROUP BY user_id
),
last_active AS (
  SELECT
    user_id,
    max(last_active_date) as last_active
  FROM platform_events
  GROUP BY user_id
),
pageview_events AS (
  SELECT 
    ev_user.user_id as user_id,
    MAX(ev_user.event_timestamp_pst) as last_pageview,
    ev_uiv.screen_name
  FROM event_ui_view AS ev_uiv 
  INNER JOIN event_user AS ev_user ON ev_uiv.event_id = ev_user.event_id 
  WHERE ev_uiv.action_type = 'view' AND ev_uiv.screen_name IN ('home', 'telenutrition', 'survey') AND ((screen_name != 'survey') OR (screen_name = 'survey' AND screen_id = 'complete-nutriquiz'))
  GROUP BY ev_user.user_id, ev_uiv.screen_name
),
all_pageview_events AS (
  SELECT
    user_id,
    case when screen_name = 'home' then last_pageview else NULL end as last_pageview_home,
    case when screen_name = 'telenutrition' then last_pageview else NULL end as last_pageview_tn,
    case when screen_name = 'survey' then last_pageview else NULL end as last_pageview_nq
  FROM pageview_events
),
max_pageview_events AS (
  SELECT
    user_id,
    max(last_pageview_home) as last_pageview_home,
    max(last_pageview_tn) as last_pageview_tn,
    max(last_pageview_nq) as last_pageview_nq
  FROM all_pageview_events
  GROUP BY user_id
)
SELECT
  last_active.user_id,
  last_active.last_active,
  max_all_platforms.used_android,
	max_all_platforms.used_ios,
	max_all_platforms.used_web,
	max_all_platforms.used_orderwell,
  max_pageview_events.last_pageview_home,
  max_pageview_events.last_pageview_tn,
  max_pageview_events.last_pageview_nq
FROM max_all_platforms, max_pageview_events, last_active
WHERE max_all_platforms.user_id = last_active.user_id AND max_pageview_events.user_id = last_active.user_id;

END TRANSACTION;
`
  logger.info(context, TAG, `Creating events table - ${EVENTS_TABLE_NAME}`, { table_name: EVENTS_TABLE_NAME, query, })
  await pool.query(query)
  logger.info(context, TAG, `Created events table - ${EVENTS_TABLE_NAME}`, { table_name: EVENTS_TABLE_NAME, query, })
}

/**
 * Extract all relevant columns into a temporary table.
 * Columns are:
 *  - id
 *  - email (email)
 *  - firstname (firstname)
 *  - lastname (lastname)
 *  - organization_id
 *  - suborganization_id
 *  - reg_date
 *  - taken_ffq
 *  - diet_response_time
 *  - used_android
 *  - used_ios
 *  - list_nutrition
 *  - list_marketing
 *  - list_surveys
 *  - unsubscribed
 */
async function createUserAttributesTable(context: IContext, pool): Promise<number> {
  const TAG = [...MTAG, 'createEventsTable']
  const { logger } = context
  const query=`
BEGIN TRANSACTION;

DROP TABLE IF EXISTS ${SCHEMA_NAME}.${USER_ATTRIBUTES_TABLE_NAME};

CREATE TABLE ${SCHEMA_NAME}.${USER_ATTRIBUTES_TABLE_NAME} (
  id VARCHAR,
  organization_id SMALLINT,
  suborganization_id VARCHAR,
  email VARCHAR(1024),
  firstname VARCHAR(1024),
  lastname VARCHAR(1024),
  reg_date TIMESTAMP WITHOUT TIME ZONE,
  member_id VARCHAR,
  member_id_2  VARCHAR,
  phone VARCHAR(20),
  taken_ffq BOOLEAN,
  diet_response_time TIMESTAMP WITHOUT TIME ZONE,
  sq_expensive_food_respose VARCHAR(256),
  sq_expensive_food_response_time TIMESTAMP WITHOUT TIME ZONE,
  used_android TIMESTAMP WITHOUT TIME ZONE,
  used_ios TIMESTAMP WITHOUT TIME ZONE,
  last_pageview_home TIMESTAMP WITHOUT TIME ZONE,
  last_pageview_tn TIMESTAMP WITHOUT TIME ZONE,
  last_pageview_nq TIMESTAMP WITHOUT TIME ZONE,
  list_nutrition BOOLEAN,
  list_marketing BOOLEAN,
  list_surveys BOOLEAN,
  unsubscribed BOOLEAN
);

INSERT INTO ${SCHEMA_NAME}.${USER_ATTRIBUTES_TABLE_NAME}
SELECT
  CASE WHEN go_users.ta_identity_id IS NOT NULL THEN CONCAT('id:',go_users.ta_identity_id) ELSE go_users.id::varchar END AS id,
  go_users.organization_id,
  go_users.suborganization_id,
  TRIM(go_users.email),
  go_users.firstname,
  go_users.lastname,
  go_users.create_date AS reg_date,
  go_users.member_id,
  go_users.member_id_2,
  go_user_infos.mobile_phone AS phone,
  COALESCE(${SCHEMA_NAME}.${TAKEN_FFQ_TABLE_NAME}.num_responses, 0) >= 5 AS taken_ffq,
  ${SCHEMA_NAME}.${TAKEN_FFQ_TABLE_NAME}.diet_response_time,
  ${SCHEMA_NAME}.${SQ_EXPENSIVE_FOOD_TABLE_NAME}.response AS sq_expensive_food_response,
  ${SCHEMA_NAME}.${SQ_EXPENSIVE_FOOD_TABLE_NAME}.response_time AS sq_expensive_food_response_time,
  date_trunc('second',${SCHEMA_NAME}.${EVENTS_TABLE_NAME}.used_android),
  date_trunc('second',${SCHEMA_NAME}.${EVENTS_TABLE_NAME}.used_ios),
  date_trunc('second',${SCHEMA_NAME}.${EVENTS_TABLE_NAME}.last_pageview_home),
  date_trunc('second',${SCHEMA_NAME}.${EVENTS_TABLE_NAME}.last_pageview_tn),
  date_trunc('second',${SCHEMA_NAME}.${EVENTS_TABLE_NAME}.last_pageview_nq),
  CASE WHEN n_subs.active = 1 OR n_subs.active IS NULL THEN TRUE ELSE FALSE END as list_nutrition,
  CASE WHEN m_subs.active = 1 OR m_subs.active IS NULL THEN TRUE ELSE FALSE END as list_marketing,
  CASE WHEN s_subs.active = 1 OR s_subs.active IS NULL THEN TRUE ELSE FALSE END as list_surveys,
  CASE WHEN all_subs.active = 0 THEN TRUE ELSE FALSE END as unsubscribed
FROM
  ${FOODAPP_STAGING_SCHEMA_NAME}.go_users${STAGE_RAW_TABLE_SUFFIX} as go_users
  LEFT OUTER JOIN ${FOODAPP_SCHEMA_NAME}.go_user_infos as go_user_infos ON go_users.id = go_user_infos.user_id
  LEFT OUTER JOIN ${SCHEMA_NAME}.${TAKEN_FFQ_TABLE_NAME} ON go_users.id = ${SCHEMA_NAME}.${TAKEN_FFQ_TABLE_NAME}.user_id
  LEFT OUTER JOIN ${SCHEMA_NAME}.${SQ_EXPENSIVE_FOOD_TABLE_NAME} ON go_users.id = ${SCHEMA_NAME}.${SQ_EXPENSIVE_FOOD_TABLE_NAME}.user_id
  LEFT OUTER JOIN ${SCHEMA_NAME}.${EVENTS_TABLE_NAME} ON go_users.id = ${SCHEMA_NAME}.${EVENTS_TABLE_NAME}.user_id
  LEFT OUTER JOIN (
    SELECT user_id, active
    FROM ${FOODAPP_SCHEMA_NAME}.user_subscriptions as s1
    WHERE
      subscription_name = 'LIST_NUTRITION' AND
      (
        create_date = (
          select MAX(s2.create_date)
          FROM ${FOODAPP_SCHEMA_NAME}.user_subscriptions AS s2
          WHERE s1.user_id = s2.user_id AND s2.subscription_name = 'LIST_NUTRITION'
        ) OR
        create_date IS NULL
      )
  ) as n_subs
  ON go_users.id = n_subs.user_id
  LEFT OUTER JOIN (
    SELECT user_id, active
    FROM ${FOODAPP_SCHEMA_NAME}.user_subscriptions as s1
    WHERE
      subscription_name = 'LIST_MARKETING' AND
      (
        create_date = (
          select MAX(s2.create_date)
          FROM ${FOODAPP_SCHEMA_NAME}.user_subscriptions AS s2
          WHERE s1.user_id = s2.user_id AND s2.subscription_name = 'LIST_MARKETING'
        ) OR
        create_date IS NULL
      )
  ) as m_subs
  ON go_users.id = m_subs.user_id
  LEFT OUTER JOIN (
    SELECT user_id, active
    FROM ${FOODAPP_SCHEMA_NAME}.user_subscriptions as s1
    WHERE
      subscription_name = 'LIST_SURVEYS' AND
      (
        create_date = (
          select MAX(s2.create_date)
          FROM ${FOODAPP_SCHEMA_NAME}.user_subscriptions AS s2
          WHERE s1.user_id = s2.user_id AND s2.subscription_name = 'LIST_SURVEYS'
        ) OR
        create_date IS NULL
      )
  ) as s_subs
  ON go_users.id = s_subs.user_id
  LEFT OUTER JOIN (
    SELECT user_id, active
    FROM ${FOODAPP_SCHEMA_NAME}.user_subscriptions as s1
    WHERE
      subscription_name = '*' AND
      (
        create_date = (
          select MAX(s2.create_date)
          FROM ${FOODAPP_SCHEMA_NAME}.user_subscriptions AS s2
          WHERE s1.user_id = s2.user_id
        ) OR
        create_date IS NULL
      )
  ) as all_subs
  ON go_users.id = all_subs.user_id
  WHERE go_users.active = 1
;

update ${SCHEMA_NAME}.${USER_ATTRIBUTES_TABLE_NAME}
  SET 
    list_nutrition = False,
    list_marketing = False,
    list_surveys = False
  WHERE unsubscribed = True
;

update ${SCHEMA_NAME}.${USER_ATTRIBUTES_TABLE_NAME}
  SET 
    unsubscribed = True
  WHERE
    list_nutrition = False AND
    list_marketing = False AND
    list_surveys = False
;

END TRANSACTION;
`

  logger.info(context, TAG, `Creating table - ${USER_ATTRIBUTES_TABLE_NAME}`, { table_name: USER_ATTRIBUTES_TABLE_NAME, query, })
  await pool.query(query)
  logger.info(context, TAG, `Created table - ${USER_ATTRIBUTES_TABLE_NAME}`, { table_name: USER_ATTRIBUTES_TABLE_NAME, query, })

  const {rows} = await pool.query(`select count(*) as count from ${SCHEMA_NAME}.${USER_ATTRIBUTES_TABLE_NAME};`)

  return rows[0].count
}

/**
 * @typedef {Object} ExtractResult - extract result object.
 */
export interface ExtractResult {
  user_count: number,
}

/**
 * Extract relevanat user attributes into a temp. table.
 * 
 * @param context - context
 * 
 * @returns {ExtractResult}
 */
async function extract(context: IContext): Promise<Result<ExtractResult, ErrCode>> {
  const TAG = [...MTAG, 'extract']
  const { logger, redshift } = context

  const pool = await redshift()

  try {

    await pool.query(`CREATE SCHEMA IF NOT EXISTS ${SCHEMA_NAME};`)

    await createTakenFfqTable(context, pool)
    await createSqExpensiveFoodTable(context, pool)
    await createEventsTable(context, pool)

    const user_count = await createUserAttributesTable(context, pool)

    return ok({ user_count, })
  }
  catch (e) {
    logger.error(context, TAG, `Exception, e - ${e}`, { stack: e.stack })
    return err(ErrCode.EXCEPTION)
  }
}

/**
 * @typedef {Object} TransformResult - transform result object.
 */
export interface TransformResult {
  user_count: number,
  batch_count: number,
  s3_bucket: string,
  s3_prefix: string,
}

/**
 * Transform user attributes S.T. they are ready for load to Customer.io.
 * User records are grouped into batches.
 * 
 * @param context - context
 * @param bucket - s3 bucket transformed batches should be written to.
 * 
 * @returns {TransformResult}
 */
async function transform(context: IContext, bucket: string): Promise<Result<TransformResult, ErrCode>> {
  const TAG = [...MTAG, 'transform']
  const { aws: { s3Client }, logger, redshift } = context

  const pool = await redshift()

  logger.info(context, TAG, 'Starting transform')

  const columns = [
    'id',
    'organization_id',
    'suborganization_id',
    'email',
    'firstname',
    'lastname',
    'phone',
    'reg_date',
    'member_id',
    'member_id_2',
    'taken_ffq',
    'diet_response_time',
    'sq_expensive_food_respose',
    'sq_expensive_food_response_time',
    'used_android',
    'used_ios',
    'last_pageview_home',
    'last_pageview_tn',
    'last_pageview_nq',
    'list_nutrition',
    'list_marketing',
    'list_surveys',
    'unsubscribed'
  ]
  let client

  try {
    //
    // See: https://github.com/brianc/node-postgres/issues/2782
    // Explicity get a client and use it on each iteration.
    //
    client = await pool.connect()

    const date = format(new Date(), `yyyy/MM/dd`)
    const s3KeyPrefix = `etl/${date}/${uuidv4()}`

    const query = `SELECT * from ${SCHEMA_NAME}.customerio_user_attributes`

    const cursor = client.query(new Cursor(query))

    let rows: object[] = await cursor.read(TRANSFORM_BATCH_SIZE)
    let userCount = 0
    let batchCount = 0
    let rowCount = 0
    const DELAY_BETWEEN_BATCHES = 60 * 1000 // 1 minute
    //@ts-ignore
    const DELAY = () => new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES))

    const batches: any[] = []

    while (rows.length > 0) {
      batchCount = batchCount + 1
      logger.info(context, TAG, 'fetched rows', { batch: batchCount, rows: rows.length })

      const csvRows: Object[] = [];

      for (let row of rows) {
        rowCount = rowCount + 1

        const csvRow = {}

        for (let column of columns) {
          const value = row[column]
          if (value instanceof Date) {
            //
            // Seconds since the epoch...
            //
            csvRow[column] = dateFns.getUnixTime(value)
          }
          else {
            csvRow[column] = value
          }
        }

        if (typeof csvRow['email'] === 'string' && csvRow['email'] !== '') {
          csvRows.push(csvRow)
        }
      }

      if (csvRows.length) {
        userCount = userCount + csvRows.length

        const csvString = csv.stringify(csvRows, {
          header: true,
          record_delimiter: '\n',
          columns,
          cast: {
            boolean: (value: any, context) => {
              const column = context.column as string;
              const toBooleanColumns = [
                'used_android',
                'used_ios',
                'taken_ffq',
                'list_nutrition',
                'list_marketing',
                'list_surveys',
                'unsubscribed'
              ];
    
              if (toBooleanColumns.includes(column)) {
                return { value: (value ? 'True' : 'False'), quote: false }
              }
              return value
            }
          }
        })

        const file = `${batchCount}.csv`

        const batch = {batchCount, rowCount, batchSize: csvRows.length, file}

        batches.push(batch)

        logger.info(context, TAG, 'Saving transformed batch.', batch)

        fs.writeFileSync(`/tmp/${file}`, csvString)

        logger.info(context, TAG, 'Saved transformed batch.', batch)
      }
      else {
        logger.info(context, TAG, 'Skipping batch with no transformed rows', { row_count: rows.length })
      }

      rows = await cursor.read(TRANSFORM_BATCH_SIZE)
    }

    try {
      client.release()
      await client.end()
      await pool.end()
    }
    catch (e) {
      logger.error(context, TAG, 'Error cleaning up client and pool.', e)
    }

    for (const batch of batches) {
      const { batchCount, batchSize, rowCount, file } = batch
      const key = `${s3KeyPrefix}/${file}`

      logger.info(context, TAG, 'Writing transformed batch.', batch)

      const csvData = fs.readFileSync(`/tmp/${file}`)

      const s3PutCommand = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: csvData
      })

      await s3Client.send(s3PutCommand);

      logger.info(context, TAG, 'Wrote transformed batch.', { bucket, key, })

      //
      // Wait 1 minute to prevent event expiration after 6 hours.
      // This will be more than enough to feed 5 concurrent lambdas.
      //
      await DELAY()
    }

    return ok({
      user_count: userCount,
      batch_count: batchCount,
      s3_bucket: bucket,
      s3_prefix: s3KeyPrefix
    })
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

/**
 * @typedef {Object} LoadResult - load result.
 */
export interface LoadResult {
  bucket: string,
  key: string,
  batch_size: number,
  batch_count_success: number,
}

/**
 * Load a batch to S3.
 * 
 * @param context - context
 * 
 * @returns {LoadResult}
 */
async function load(context: IContext, bucket: string, key: string): Promise<Result<LoadResult, ErrCode>> {
  return ok({
    bucket,
    key,
    batch_size: 0,
    batch_count_success: 0,    
  })
}

export default {
  extract,
  transform,
  load,
}