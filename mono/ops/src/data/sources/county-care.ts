import { Readable } from 'node:stream'
import { err, ok, Result } from "neverthrow";
import { Parse } from 'unzipper'
import { parse } from 'csv-parse'
import stringify = require('csv-stringify')

import { IContext } from '@mono/common/lib/context'
import { ErrCode } from "@mono/common/lib/error";
import { IConfig as IDomainConfig } from '../../config'
import { createReadStream as createS3ReadStream } from '../s3'
import { decryptStream } from '../pgp'
import { getDestinations, upload, UploadResult } from '../upload'
import { IngestResult } from '../ingest'

const MTAG = [ 'ops', 'data', 'county-care' ]

/**
 * The various file prefixes.
 */
enum FilePrefixes {
  ELIGIBILITY = 'COUNTYCARE_ELIGIBILITY_',
  MED = 'COUNTYCARE_MED_',
  PROVIDER = 'COUNTYCARE_PROVIDER_',
  RX = 'COUNTYCARE_RX_',
  ELIGIBILITY_CONTROL = 'COUNTYCARE_ELIG_CONTROL_',
  MED_CONTROL = 'COUNTYCARE_MED_CONTROL_',
  PROVIDER_CONTROL = 'COUNTYCARE_PROVIDER_CONTROL_',
  RX_CONTROL = 'COUNTYCARE_RX_CONTROL_'
}

const ELIGIBILITY_HEADER = 'Member ID|Member Last Name|Member First Name|Member DOB|Subscriber ID |Relationship Code|Member SSN|Gender Identity|Permanent Address 1|Permanent Address 2|Permanent City|Permanent State|Permanent Zip|Primary Phone|Email|PCP ID|PCP Name|Member Grouping #1|Member Grouping #2|Member Grouping #3|Member Grouping #4|Member Grouping #5|Additional Member Attribute #1|Additional Member Attribute #2|Additional Member Attribute #3|Additional Member Attribute #4|Additional Member Attribute #5|Effective Date|Termination Date|Member LOB|Member Benefit Plan ID |Employer Group ID|Member County|Primary Language|Guardian Name|Copay Level|Member Race|Medical Eligibility|Pharmacy Eligibility|Rider 1 Placeholder |Rider 2 Placeholder|Rider 3 Placeholder|Rider 4 Placeholder|Rider 5 Placeholder|Death Date|Age|Premium ? Behavioral Health|Business Unit ID|CME Assigned|Coverage Code|Eligible Days|Premium ? Dental|Vision Eligibility|Enrolled  in CM|Group GID|Initial Screening Completed|Is Waiver|Premium ? Medical|Member GID|Network ID|Person Code|Real Member Effective Date|Real Member Termination Date|Region Code|SNC Indicator|Service Coordinator ID|Service Location ID|Subscriber GID|TPI|Premium ? Vision|Waiver ID|LTC Member|LTC NPI|Rate Cell (P-Code)|Pull_file_paid|is_fhnmem|is_aetnamem|certification_date|Supergroup|Expected Delivery Date|Rate Cell Description|Pregnant|Resolution|Resolution Date|New Enrollee Indicator|Swim Lane Indicator|CCHP Risk Level|CCHP Risk Level Update Date|CCHP Risk Level Source|Mail Address 1|Mail Address 2|Mail City|Mail State|Mail Zip|First Month of Pregnancy|Last Month of Pregnancy|Provider NPI|Provider TIN|Waiver 1|Waiver 2|Waiver 3|Waiver 4|Waiver 5|Waiver 6|Auto Indicator|A/B Indicator|Living Arrangement Code|Secondary Phone|Primary Phone SMS Indicator|Secondary Phone SMS Indicator|Primary Written Language|Non-Primary Written Language|Non-Primary Spoken Language|Member Ethnicity|Assigned Sex|Preferred Pronouns|Sexual Orientation|Physical Address1|Physical Address2|Physical City|Physical State|Physical Zip|Facility Name'

function transformEligibility(data: Readable): Readable {
  const parser = parse({ delimiter: '|', quote: false })
  const stringifier = stringify({
    delimiter: '|',
    columns: ELIGIBILITY_HEADER.split('|'),
    header: true,
    quote: false
  })  

  return data.pipe(parser).pipe(stringifier)
}

export async function ingest(context: IContext, srcKey: string): Promise<Result<IngestResult, ErrCode>> {
  const { logger, aws: { s3Client }, config } = context;
  const domainConfig = context.domainConfig as IDomainConfig
  const TAG = [ ...MTAG, 'ingest' ]

  try {
    if (!config.isProduction) {
      logger.error(context, TAG, 'Only supported in production.')

      return err(ErrCode.NOT_IMPLEMENTED)
    }

    const opsData = domainConfig?.ops?.data?.countycare
    const srcBucket = config?.ops_cdk?.sftp?.sftpArchiveBucket?.name

    if (!opsData || !opsData.pgp || !srcBucket) {
      logger.error(context, TAG, 'Ops data config NOT found!')

      return err(ErrCode.INVALID_CONFIG)
    }

    const s3ReadStreamResult = await createS3ReadStream(context, srcBucket, srcKey)

    if (s3ReadStreamResult.isErr()) {
      logger.error(context, TAG, 'Error create s3 source stream.', {
        opsData,
      })

      return err(s3ReadStreamResult.error)
    }

    const s3ReadStream = s3ReadStreamResult.value

    const decryptStreamResult = await decryptStream(context, s3ReadStream, opsData.pgp)

    if (decryptStreamResult.isErr()) {
      logger.error(context, TAG, 'Error creating decrypt streawm.', {
        opsData,
      })

      return err(decryptStreamResult.error)
    }

    const decryptedStream = decryptStreamResult.value

    logger.info(context, TAG, 'Piping decrypted data...')

    const zip = decryptedStream.pipe(Parse({ forceStream: true}))

    const uploads: UploadResult[] = []

    for await (const entry of zip) {
      logger.info(context, TAG, 'Processing entry.', {
        path: entry.path
      })
      const filename = entry.path.split('/').pop()
      const result = getDestinations(context, filename, opsData)

      if (result.isOk()) {
        if (result.value.length) {
          const dests = result.value

          logger.info(context, TAG, 'Entry selected.', {
            dests,
          })

          const toUpload = entry.path.startsWith(FilePrefixes.ELIGIBILITY) ? transformEligibility(entry) : entry

          const uploadResult = await upload(context, filename, toUpload, dests)

          if (uploadResult.isOk()) {
            uploads.push(...uploadResult.value)
          }
          else {
            logger.error(context, TAG, 'Error uploading entry.', {
              path: entry.path
            })
          }
        } else {
          logger.info(context, TAG, 'Skipping file entry.', {
            path: entry.path
          })
          entry.autodrain()
        }
      }
      else {
        logger.error(context, TAG, 'Error selecting destination', {
          path: entry.path
        })

        entry.autodrain()
      }
    }

    logger.info(context, TAG, 'Processed entries.', uploads)
    
    return ok({
      srcS3Bucket: srcBucket,
      srcS3Key: srcKey,
      uploadResults: uploads,
    })
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

const INBOUND_SCHEMA = 'inbound_stage'
const INBOUND_PROVIDER_TABLE_NAME_PREFIX = 'countycare_provider_'

const TARGET_SCHEMA = 'claims'
const TARGET_TABLE_NAME = 'countycare_provider'

const PROVIDER_COLUMNS = [
  'Provider_ID',
  'Provider_Last_Name',
  'Line_of_Business',
  'Provider_Effective_Date',
  'Provider_Termination_Date',
  'Provider_Type',
  'Provider_Specialty_Code',
  'Provider_Specialty_Description',
  'Provider_Address_1',
  'Provider_Address_2',
  'Provider_City',
  'Provider_State',
  'Provider_Zip',
  'Provider_County',
  'Service_Area',
  'Provider_Phone',
  'Practice_ID_1',
  'Practice_Name_1',
  'Primary',
  'Provider_Grouping_1',
  'Provider_Grouping_2',
  'Provider_Grouping_3',
  'Provider_Grouping_4',
  'Provider_Grouping_5',
  'Additional_Provider_Attribute_1',
  'Additional_Provider_Attribute_2',
  'Additional_Provider_Attribute_3',
  'Additional_Provider_Attribute_4',
  'Additional_Provider_Attribute_5',
  'PCP_Indicator',
  'Provider_NPI_1',
  'Provider_NPI_2',
  'Provider_TIN',
  'Provider_DEA',
  'Taxonomy_Code',
  'Provider_First_Name',
  'Service_Location_ID',
  'Business_Unit_ID',
  'Acceptance_Code',
  'Ages_Seen',
  'Business_Address1',
  'Business_Address2',
  'Business_City',
  'Business_Fax',
  'Business_GID',
  'Business_State',
  'Business_Zip',
  'Ethnicity',
  'Gender',
  'Gender_Restrict',
  'Handicap',
  'Network_Indicator',
  'License',
  'License_Exp_Date',
  'License_State',
  'Location_GID',
  'Practice_ID_2',
  'Practice_Name_2',
  'Provider_GID',
  'Service_Fax'
]

export interface LoadProvidersResult {
  ingested: IngestResult,
  provider: {
    filename: string,
    count: number
  }
}

export async function loadProviders(context: IContext, ingested: IngestResult): Promise<Result<LoadProvidersResult, ErrCode>> {
  const { logger, config, redshift } = context;
  const domainConfig = context.domainConfig as IDomainConfig
  const TAG = [ ...MTAG, 'loadProviders' ]

  try {
    if (!config.isProduction) {
      logger.error(context, TAG, 'Only supported in production.')

      return err(ErrCode.NOT_IMPLEMENTED)
    }

    //
    // Find the provider file 'ingest result' which will indicate where the file was uploaded to S3.
    //
    const ingestedFile = ingested.uploadResults.find(upload => upload.filename.match(/^COUNTYCARE_PROVIDER_.*\.txt$/) !== null)

    if (ingestedFile) {
      const pool = await redshift()

      const redshiftCopyRole = config.ops_cdk.data?.redshiftS3CopyRoleArn
  
      if (!redshiftCopyRole) {
        logger.error(context, TAG, 'Redshift copy role not found.')
  
        return err(ErrCode.INVALID_CONFIG)
      }
  
      //
      // Create an SQL query which does 2 things:
      //  - copy from S3 to the inbound_stage schema.
      //  - copy from the inbound_stage table which is specific to the raw file to a table in the 'claims'
      //    schema after truncation.
      //
      const {
        filename,
        destBucket: s3Bucket,
        destKey: s3Key 
      } = ingestedFile
      const fileDateTime = filename.replace(/^COUNTYCARE_PROVIDER_/, '').replace(/\.txt$/, '')
      const inboundProviderTableName = `${INBOUND_PROVIDER_TABLE_NAME_PREFIX}${fileDateTime}`
      const createTableColumns = PROVIDER_COLUMNS.map(c => `"${c}" varchar`).join(', ')
                  
      const query = `
        -- #1
        BEGIN;

        -- #2
        DROP TABLE if exists "inbound_stage"."${inboundProviderTableName}";

        -- #3
        CREATE TABLE "${INBOUND_SCHEMA}"."${inboundProviderTableName}" (
          ${createTableColumns}
        );

        -- #4
        COPY "${INBOUND_SCHEMA}"."${inboundProviderTableName}" 
          FROM 's3://${s3Bucket}/${s3Key}'
          credentials 'aws_iam_role=${redshiftCopyRole}'
          DELIMITER AS '|' csv QUOTE AS '"' NULL AS 'NULL' IGNOREHEADER 1 ACCEPTINVCHARS;

        -- #5
        create table IF NOT EXISTS "${TARGET_SCHEMA}"."${TARGET_TABLE_NAME}" ( like "${INBOUND_SCHEMA}"."${inboundProviderTableName}" );

        -- #6
        truncate table "${TARGET_SCHEMA}"."${TARGET_TABLE_NAME}";

        -- #7
        insert into "${TARGET_SCHEMA}"."${TARGET_TABLE_NAME}" select * from "${INBOUND_SCHEMA}"."${inboundProviderTableName}";

        -- #5
        COMMIT;
`

      logger.debug(context, TAG, 'Executing query.', { query, })

      const result = await pool.query(query)
      const results = Array.isArray(result) ? result : [result]

      logger.debug(context, TAG, 'Query result.', results)

      return ok({
        ingested,
        provider: {
          filename,
          count: results[3].length
        }
      })
    }
    else {
      logger.error(context, TAG, 'Provider file is missing.', ingested)

      return err(ErrCode.NOT_FOUND)
    }
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export default {
  ingest,
  loadProviders
}
