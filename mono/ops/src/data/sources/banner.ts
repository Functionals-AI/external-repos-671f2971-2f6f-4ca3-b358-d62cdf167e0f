import { Readable } from 'node:stream'
import { err, ok, Result } from 'neverthrow'
import { DateTime, Settings as DateTimeSettings } from 'luxon'
const QueryStream = require('pg-query-stream')
import { parse } from 'csv-parse'
import { transform } from 'stream-transform'
import stringify = require('csv-stringify')
import { v4 as uuidv4 } from 'uuid'

import { IContext } from '@mono/common/lib/context'
import { ErrCode } from '@mono/common/lib//error'
import {
  IConfig as IDomainConfig,
  IOpsDataInbound,
  IOpsDataInboundOnly,
  IOpsDataInboundOutbound,
  IOpsDataS3Dest,
  OpsDataDestS3BucketType,
  OpsDataDestType } from '../../config'
import { createReadStream as createS3ReadStream } from '../s3'
import { decryptStream } from '../pgp'
import { getDestinations, upload, UploadResult } from '../upload'

const MTAG = [ 'ops', 'data', 'banner']

const INBOUND_SCHEMA = 'inbound_stage'

const INBOUND_ELIGIBILITY_TABLE_NAME_PREFIX = 'bannerhealth_member_eligibility_'
const INBOUND_DEMOGRAPHICS_TABLE_NAME_PREFIX = 'bannerhealth_member_demographic_'

interface LoadToRedshiftResult {
  inboundEligibilityTableName: string,
  inboundDemographicsTableName: string,
  fileDate: string,
}

interface S3Uploads {
  eligibility1: UploadResult,
  eligibility2: UploadResult,
  demographics1: UploadResult,
  demographics2: UploadResult,
}

/**
 * Load raw data to Redshift into eligibility and demographic tables in the 'inbound_stage' schema.
 * 
 * @param context 
 * @param date 
 * @param s3Uploads 
 * @returns 
 */
export async function loadToRedshift(context: IContext, date: Date, s3Uploads: S3Uploads): Promise<Result<LoadToRedshiftResult, ErrCode>> {
  const { config, logger, redshift } = context
  const TAG = [ ...MTAG, 'loadToRedshift' ]

  try {
    //
    // Create table queries for raw eligibility / demographics
    //

    //
    // Deduce the date portion of the file in order to include it in the output.
    //
    const key = s3Uploads.eligibility1.destKey
    const match = key.match(/^(.*)\/([^\/]+)_([\d]{2})-([\D]+)-([\d]{4})\..*\.pgp$/)
    let fileDate: string

    if (match && match.length === 6) {
      fileDate = DateTime.fromFormat(`${3}-${4}-${5}`, 'dd-LLL-yyyy').toFormat('yyyyMMdd')
    }
    else {
      fileDate = DateTime.fromJSDate(date, { zone: 'utc' }).toFormat('yyyyMMdd')
    }

    const inboundEligibilityTableName = `${INBOUND_ELIGIBILITY_TABLE_NAME_PREFIX}${fileDate}`
    const createInboundEligibilityTableQuery = `CREATE TABLE IF NOT EXISTS "inbound_stage"."${inboundEligibilityTableName}" (
      "personid" integer,
      "planid" integer,
      "payername" character varying,
      "memberid" character varying,
      "medicare_id" character varying,
      "effectivedate" character varying,
      "terminationdate" character varying,
      "ratecode" character varying
    );
`
    const inboundDemographicsTableName = `${INBOUND_DEMOGRAPHICS_TABLE_NAME_PREFIX}${fileDate}`
    const createInboundDemographicsTableQuery = `CREATE TABLE IF NOT EXISTS "inbound_stage"."${inboundDemographicsTableName}" (
      "personid" integer,
      "lastname" character varying,
      "firstname" character varying,
      "middlename" character varying,
      "birthdate" character varying,
      "gendercode" character varying,
      "streetaddress1" character varying,
      "streetaddress2" character varying,
      "city" character varying,
      "state" character varying,
      "county" character varying,
      "postalcode" character varying,
      "deathdate" character varying,
      "primaryphonenumber" character varying,
      "member_race" character varying,
      "member_language" character varying
    );
`

    const pool = await redshift()

    const redshiftCopyRole = config.ops_cdk.data?.redshiftS3CopyRoleArn

    if (!redshiftCopyRole) {
      logger.error(context, TAG, 'Redshift copy role not found.')

      return err(ErrCode.INVALID_CONFIG)
    }

    logger.info(context, TAG, 'Loadint staging tables.', {
      inbound_eligibility_table: inboundEligibilityTableName,
      inbound_demographics_table: inboundDemographicsTableName,
    })

    //
    // Note on transactions and isolation levels. Redshift supports one and only one isolation level which is Serializable.
    // If a potential conflict is detected, Redshift will throw. To avoid this, obtain an exclusive lock,
    // but create the table outside of the transaction, so it will always exist inside the transaction
    // S.T. it can be locked.
    //
    // Also, DO NOT truncate the table in the transaction, as the transcation will be automatically commited.
    // If this happends two concurrent transactions could actually duplicate data in the table.
    // Delete instead in the transaction in the context of the lock.
    //
    await pool.query(`
-- Eligibility data:
${createInboundEligibilityTableQuery}
BEGIN;
-- Table must exist. Lock it to proceed.
LOCK TABLE "inbound_stage"."${inboundEligibilityTableName}";
-- Truncate commits, use delete instead.
DELETE "inbound_stage"."${inboundEligibilityTableName}";
-- Perform copies:
COPY "inbound_stage".${inboundEligibilityTableName} FROM
  's3://${s3Uploads.eligibility1.destBucket}/${s3Uploads.eligibility1.destKey}'
  credentials 'aws_iam_role=${redshiftCopyRole}'
  DELIMITER AS '|' csv QUOTE AS '"' NULL AS 'NULL' IGNOREHEADER 1;
COPY "inbound_stage".${inboundEligibilityTableName} FROM
  's3://${s3Uploads.eligibility2.destBucket}/${s3Uploads.eligibility2.destKey}'
  credentials 'aws_iam_role=${redshiftCopyRole}'
  DELIMITER AS '|' csv QUOTE AS '"' NULL AS 'NULL' IGNOREHEADER 1;
-- Commit, and finish with eligibility.
END;
-- Demographic data:
${createInboundDemographicsTableQuery}
BEGIN;
-- Table must exist. Lock it to proceed.
LOCK TABLE "inbound_stage"."${inboundDemographicsTableName}";
-- Truncate commits, use delete instead.
DELETE "inbound_stage"."${inboundDemographicsTableName}";
COPY "inbound_stage".${inboundDemographicsTableName} 
  (
    "personid",
    "lastname",
    "firstname",
    "middlename",
    "birthdate",
    "gendercode",
    "streetaddress1",
    "streetaddress2",
    "city",
    "state",
    "county",
    "postalcode",
    "deathdate",
    "primaryphonenumber",
    "member_race",
    "member_language"
  )
FROM
  's3://${s3Uploads.demographics1.destBucket}/${s3Uploads.demographics1.destKey}'
  credentials 'aws_iam_role=${redshiftCopyRole}'
  DELIMITER AS '|' csv QUOTE AS '"' NULL AS 'NULL' IGNOREHEADER 1;
COPY "inbound_stage".${inboundDemographicsTableName} 
  (
    "personid",
    "lastname",
    "firstname",
    "middlename",
    "birthdate",
    "gendercode",
    "streetaddress1",
    "streetaddress2",
    "city",
    "state",
    "county",
    "postalcode",
    "deathdate",
    "primaryphonenumber",
    "member_race",
    "member_language"
  )
FROM
  's3://${s3Uploads.demographics2.destBucket}/${s3Uploads.demographics2.destKey}'
  credentials 'aws_iam_role=${redshiftCopyRole}'
  DELIMITER AS '|' csv QUOTE AS '"' NULL AS 'NULL' IGNOREHEADER 1;
END;
`)
    
    return ok({
      inboundEligibilityTableName,
      inboundDemographicsTableName,
      fileDate,
    })
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

const ELIGIBILITY_SCHEMA = 'eligibility'
const ELIGIBILITY_TABLE_NAME_PREFIX = 'bannerhealth_eligibility_'
type EligibilitiesTableName = string

/**
 * Generate eligibility data via query in redshift. Results are in a 'banner eligibility' table
 * in the 'eligibility' schema.
 * 
 * @param context 
 * @param date 
 * @param inboundEligibilityTableName 
 * @param inboundDemographicsTableName 
 * @returns 
 */
export async function generateEligibilities(context: IContext, date: Date, inboundEligibilityTableName: string, inboundDemographicsTableName: string, fileDate: string): Promise<Result<EligibilitiesTableName, ErrCode>> {
  const { logger, redshift } = context
  const TAG = [ ...MTAG, 'generateEligibilities' ]

  try {
    const pool = await redshift()

    const eligibilityTableName = `${ELIGIBILITY_TABLE_NAME_PREFIX}${fileDate}_${uuidv4().replace(/\-.*$/, '')}`
    const eligibilityQuery = `
BEGIN;
LOCK TABLE ${INBOUND_SCHEMA}.${inboundEligibilityTableName};
LOCK TABLE ${INBOUND_SCHEMA}.${inboundDemographicsTableName};
CREATE TABLE ${ELIGIBILITY_SCHEMA}.${eligibilityTableName} AS 
WITH 
  eligibile_members as (
    select * FROM (
      select 
        *,
        rank() OVER ( 
          PARTITION BY personid 
          ORDER BY 
            CASE effectivedate 
            when '' then DATE('0000-01-01') 
            else DATE(effectivedate) 
            END 
          DESC 
      ) as rank
      from ${INBOUND_SCHEMA}.${inboundEligibilityTableName}
      ORDER BY rank DESC 
    )
    WHERE rank = 1 OR effectivedate = ''
  )
select 
  D.lastname AS LASTNAME,
  D.firstname AS FIRSTNAME,
  D.middlename AS MIDDLENAME,
  D.birthdate AS BIRTHDATE,
  D.gendercode AS GENDERCODE,
  D.streetaddress1 AS STREETADDRESS1,
  D.streetaddress2 AS STREETADDRESS2,
  D.city AS CITY,
  D.state AS STATE,
  D.county AS COUNTY,
  D.postalcode AS POSTALCODE,
  D.deathdate AS DEATHDATE,
  D.primaryphonenumber AS PRIMARYPHONENUMBER,
  D.member_race AS MEMBER_RACE,
  E.planid AS PLANID,
  E.payername AS PAYERNAME,
  E.memberid AS MEMBERID,
  E.effectivedate AS EFFECTIVEDATE,
  E.terminationdate AS TERMINATIONDATE,
  E.ratecode AS RATECODE
from ${INBOUND_SCHEMA}.${inboundDemographicsTableName} D 
INNER JOIN eligibile_members E ON E.personid = D.personid 
ORDER BY memberid 
;
END;
    `

    logger.debug(context, TAG, 'Creating eligibility table.', {
      table_name: eligibilityTableName,
      query: eligibilityQuery,
    })
    
    await pool.query(eligibilityQuery)

    return ok(eligibilityTableName)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

const ELIGIBILITY_HEADER = 'LASTNAME|FIRSTNAME|MIDDLENAME|BIRTHDATE|GENDERCODE|STREETADDRESS1|STREETADDRESS2|CITY|STATE|COUNTY|POSTALCODE|DEATHDATE|PRIMARYPHONENUMBER|MEMBER_RACE|PLANID|PAYERNAME|MEMBERID|EFFECTIVEDATE|TERMINATIONDATE|RATECODE'

interface UploadEligibilityResult {
  eligibilityTableName: string,
  uploadResults: UploadResult[]
}

async function uploadEligibilitiesToS3(context: IContext, eligibilityTableName: string, opsData): Promise<Result<UploadEligibilityResult, ErrCode>> {
  const { logger, redshift } = context
  const TAG = [ ...MTAG, 'uploadEligibilitiesToS3' ]

  try {
    const pool = await redshift()
    const client = await pool.connect()

    const query = new QueryStream(`SELECT * FROM ${ELIGIBILITY_SCHEMA}.${eligibilityTableName};`)
    const queryStream = client.query(query)

    queryStream.on('end', () => {
      client.release()
    })

    const stringifier = stringify({
      delimiter: '|',
      columns: ELIGIBILITY_HEADER.split('|').map(h => ({
        key: h.toLowerCase(),
        header: h.toUpperCase(),
      })),
      header: true,
      quote: false
    })  
    const csvStream = queryStream.pipe(stringifier)

    const filename = `${eligibilityTableName}.csv`
    const getDestinationsResult = getDestinations(context, filename, opsData)

    if (getDestinationsResult.isErr()) {
      logger.error(context, TAG, 'Error getting upload destinations.', {
        error: getDestinationsResult.error
      })

      return err(getDestinationsResult.error)
    }

    const dests = getDestinationsResult.value

    const uploadResult = await upload(context, filename, csvStream, dests)

    if (uploadResult.isErr()) {
      logger.error(context, TAG, 'Error uploading to s3.', {
        error: uploadResult.error
      })
  
      return err(uploadResult.error)
    }

    await pool.query(`DROP TABLE ${ELIGIBILITY_SCHEMA}.${eligibilityTableName};`)
  
    return ok({
      eligibilityTableName,
      uploadResults: uploadResult.value
    })

  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

const DATE_COLUMNS = [
  'BIRTHDATE',
  'EFFECTIVEDATE', 
  'TERMINATIONDATE'
]

const ELIGIBILITY_DELIMITER = '|'

/**
 * Transform eligibility data, ie: transforms date columns.
 * 
 * @param context 
 * @param data 
 * @returns 
 */
function transformEligibility(context: IContext, data: Readable): Result<Readable, ErrCode> {
  const { logger } = context
  const TAG = [ ...MTAG, 'transformEligibility' ]

  try {
    //
    // Set the cutoff year to the current for 2 digit years.
    //
    DateTimeSettings.twoDigitCutoffYear = DateTime.now().toFormat('yy')

    const transformer = transform(function(data) {
      if (data.info.error) {
        logger.info(context, TAG, 'Skipping record.', {
          record: data.record,
          info: data.info,
        })

        return null
      }

      const record = data.record

      for (const recordKey of Object.keys(record)) {
        if (DATE_COLUMNS.includes(recordKey) && typeof record[recordKey] === 'string' && record[recordKey].length) {
          //
          // Convert to yyyy-MM-dd, ie 01-Apr-99 -> 1999-03-01 (not 2099-03-01)
          //
          const dateTime = DateTime.fromFormat(record[recordKey], 'dd-MMM-yy')

          if (dateTime.invalid === null) {
            record[recordKey] = dateTime.toFormat('yyyy-MM-dd')
          }
          else {
            logger.info(context, TAG, 'Skipping record due to invalid date.', {
              column: recordKey,
              record,
            })
            return null
          }
        }
      }

      return record
    })

    const parser = parse({
      columns: true,
      delimiter: ELIGIBILITY_DELIMITER,
      info: true,
      relaxColumnCount: true
    })

    const stringifier = stringify({
      delimiter: ELIGIBILITY_DELIMITER,
      header: true,
    }) 

    return ok(data.pipe(parser).pipe(transformer).pipe(stringifier))
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}


/**
 * Valid header. Any header columns not included here, will be filtered / ignored.
 */
const DEMOGRAPHICS_HEADER = 'PERSONID|LASTNAME|FIRSTNAME|MIDDLENAME|BIRTHDATE|GENDERCODE|STREETADDRESS1|STREETADDRESS2|CITY|STATE|COUNTY|POSTALCODE|DEATHDATE|PRIMARYPHONENUMBER|MEMBER_RACE|MEMBER_LANGUAGE'
const DEMOGRAPHICS_DELIMITER = '|'

function transformDemographics(context: IContext, data: Readable): Result<Readable, ErrCode> {
  const { logger } = context
  const TAG = [ ...MTAG, 'transformDemographics' ]

  try {
    //
    // Set the cutoff year to the current for 2 digit years.
    //
    DateTimeSettings.twoDigitCutoffYear = DateTime.now().toFormat('yy')

    const transformer = transform(function(data) {
      if (data.info.error) {
        logger.info(context, TAG, 'Skipping record.', {
          record: data.record,
          info: data.info,
        })

        return null
      }

      const record = data.record
      const allowedKeys = DEMOGRAPHICS_HEADER.split(DEMOGRAPHICS_DELIMITER)

      for (const recordKey of Object.keys(record)) {
        if (!allowedKeys.includes(recordKey)) {
          delete record[recordKey]
        }
        else if (DATE_COLUMNS.includes(recordKey) && typeof record[recordKey] === 'string' && record[recordKey].length) {
          //
          // Convert to yyyy-MM-dd, ie 01-Apr-99 -> 1999-03-01 (not 2099-03-01)
          //
          const dateTime = DateTime.fromFormat(record[recordKey], 'dd-MMM-yy')

          if (dateTime.invalid === null) {
            record[recordKey] = dateTime.toFormat('yyyy-MM-dd')
          }
          else {
            logger.info(context, TAG, 'Skipping record due to invalid date.', {
              column: recordKey,
              record,
            })
            return null
          }
        }
      }

      return record
    })

    const parser = parse({
      columns: true,
      delimiter: DEMOGRAPHICS_DELIMITER,
      info: true,
      relaxColumnCount: true
    })

    const stringifier = stringify({
      delimiter: DEMOGRAPHICS_DELIMITER,
      header: true,
    }) 

    return ok(data.pipe(parser).pipe(transformer).pipe(stringifier))
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export interface IngestResult {
  srcS3Bucket: string,
  srcS3Keys: IngestSrcKeys,
  uploadResults: UploadResult[],
}

export interface IngestSrcKeys {
  eligibilitySrcKey1: string,
  eligibilitySrcKey2: string,
  demographicsSrcKey1: string,
  demographicsSrcKey2: string,
}

export async function ingest(context: IContext, date: Date, srcKeys: IngestSrcKeys): Promise<Result<IngestResult, ErrCode>> {
  const { logger, aws: { s3Client }, config } = context;
  const domainConfig = context.domainConfig as IDomainConfig
  const TAG = [ ...MTAG, 'ingest' ]
    
  try {
    if (!config.isProduction) {
      logger.error(context, TAG, 'Only supported in production.')
    
      return err(ErrCode.NOT_IMPLEMENTED)
    }
    
    const opsData = domainConfig?.ops?.data?.banner
    const srcBucket = config?.ops_cdk?.sftp?.sftpArchiveBucket?.name
    
    if (!opsData || !srcBucket) {
      logger.error(context, TAG, 'Ops data config NOT found!')
    
      return err(ErrCode.INVALID_CONFIG)
    } else if (!opsData.pgp) {
      logger.error(context, TAG, 'PGP config NOT found!')
    
      return err(ErrCode.INVALID_CONFIG)
    }

    //
    // Get the files
    //
    const s3ReadStreams: Record<string, Readable> = {}

    for (const srcKey of Object.keys(srcKeys)) {
      const s3ReadStreamResult = await createS3ReadStream(context, srcBucket, srcKeys[srcKey])

      if (s3ReadStreamResult.isErr()) {
        logger.error(context, TAG, 'Error creating s3 source stream.', {
          srcBucket,
          srcKey,
        })
  
        return err(s3ReadStreamResult.error)
      }
  
      s3ReadStreams[srcKey] = s3ReadStreamResult.value
    }

    //
    // Decrypt the files.
    //
    const decrypted = {}

    for (const [srcKey, s3ReadStream] of Object.entries(s3ReadStreams)) {
      const decryptStreamResult = await decryptStream(context, s3ReadStream, opsData.pgp)

      if (decryptStreamResult.isErr()) {
        logger.error(context, TAG, 'Error creating decrypt streawm.', {
          opsData,
        })
  
        return err(decryptStreamResult.error)
      }
  
      decrypted[srcKey] = decryptStreamResult.value
    }

    let iopsSource: IOpsDataInbound
    if (opsData.hasOwnProperty('inbound')) {
      const src = (opsData as IOpsDataInboundOutbound).inbound
      if (!src) {
        logger.error(context, TAG, 'Config did not define an inbound source.')

        return err(ErrCode.INVALID_CONFIG)
      }

      iopsSource = src
    } else {
      iopsSource = opsData as IOpsDataInboundOnly
    }

    //
    // Send the files to s3 using the 'external data' bucket.
    //
    const dests = Array.isArray(iopsSource.dest) ? iopsSource.dest : [ iopsSource.dest ]
    const decryptedDest = (dests as IOpsDataS3Dest[]).find(d => d.s3BucketType === OpsDataDestS3BucketType.EXTERNAL_DATA_BUCKET)
    const decryptedUploads: Record<string, UploadResult> = {}

    for (const srcKey of Object.keys(decrypted)) {
      const filename: string = (srcKeys[srcKey].split('/').pop() as string).replace(/\.pgp/, '')
      let toUpload
      let transform

      if ((srcKey === 'eligibilitySrcKey1' || srcKey === 'eligibilitySrcKey2')) {
        transform = transformEligibility
      }
      else {
        transform = transformDemographics
      }

      const transformResult = transform(context, decrypted[srcKey])

      if (transformResult.isErr()) {
        logger.error(context, TAG, 'Error transforming.', {
          srcKey,
          error: transformResult.error
        })

        return err(transformResult.error)
      }

      toUpload = transformResult.value

      const uploadResult = await upload(
        context, 
        filename, 
        toUpload,
        [ {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.EXTERNAL_DATA_BUCKET,
          prefix: decryptedDest?.prefix ?? 'banner/'
        } ]
      )

      if (uploadResult.isErr()) {
        logger.error(context, TAG, 'Error uploading to S3.', {
          srcKey,
          filename,
          error: uploadResult.error
        })

        return err(uploadResult.error)
      }

      decryptedUploads[srcKey] = uploadResult.value[0]

      logger.info(context, TAG, 'File decrypted and uploaded to S3.', {
        srcKey: srcKeys[srcKey],
        uploadResult: uploadResult.value
      })
    }

    //
    // Load files into Redshift Tables.
    //
    const loadToRedshiftResult = await loadToRedshift(context, date, {
      eligibility1: decryptedUploads.eligibilitySrcKey1,
      eligibility2: decryptedUploads.eligibilitySrcKey2,
      demographics1: decryptedUploads.demographicsSrcKey1,
      demographics2: decryptedUploads.demographicsSrcKey2,
    })

    if (loadToRedshiftResult.isErr()) {
      logger.error(context, TAG, 'Error loading data to Redshift.', {
        error: loadToRedshiftResult.error
      })

      return err(loadToRedshiftResult.error)
    }

    const { 
      inboundEligibilityTableName, 
      inboundDemographicsTableName,
      fileDate,
     } = loadToRedshiftResult.value

    logger.info(context, TAG, 'Loaded data to Redshift.', {
      inboundEligibilityTableName,
      inboundDemographicsTableName,
      fileDate,
    })

    //
    // Query the loaded tables tables to generate an e-file to import,
    // and persist that to the 'eligibility ready bucket'.
    //

    //
    // Generate the eligibilities S.T. they are in a Redshift table.
    //
    const generateEligibilitiesResult = await generateEligibilities(context, date, inboundEligibilityTableName, inboundDemographicsTableName, fileDate)

    if (generateEligibilitiesResult.isErr()) {
      logger.error(context, TAG, 'Error generating eligibility data in Redshift.', {
        error: generateEligibilitiesResult.error
      })

      return err(generateEligibilitiesResult.error)
    }

    const eligibilityTableName = generateEligibilitiesResult.value

    logger.info(context, TAG, 'Generated eligibilities in Redshift.', {
      schema: ELIGIBILITY_SCHEMA,
      table_name: eligibilityTableName,
    })

    const uploadResult = await uploadEligibilitiesToS3(context, eligibilityTableName, opsData)

    if (uploadResult.isErr()) {
      logger.error(context, TAG, 'Error uploading to S3.', {
        eligibilityTableName,
        error: uploadResult.error
      })

      return err(uploadResult.error)
    }

    const {
      uploadResults
    } = uploadResult.value

    return ok({
      srcS3Bucket: srcBucket,
      srcS3Keys: srcKeys,
      uploadResults,
    })
  }
  catch (e) {
    logger.exception(context, TAG, e)
  
    return err(ErrCode.EXCEPTION)
  }
}
    
export default {
  ingest,
}