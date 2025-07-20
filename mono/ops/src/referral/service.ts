import { PassThrough, Readable, Writable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { errorMonitor } from 'node:events'
import { Result, err, ok } from 'neverthrow'
import { phone } from 'phone'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { parse } from 'csv-parse'
import { transform } from 'stream-transform'
import stringify = require('csv-stringify')

import { ErrCode } from '@mono/common/lib/error'
import { IContext } from '@mono/common/lib/context'
import { dateToDate, dateToISOTimestamp } from "@mono/common/lib/data/normalize"
import { EligibilityMemberGender, EligibilityMemberNewRecord } from '@mono/common/lib/eligibility/store'
import { ReferralGender, ReferralInboundRecord, ReferralInboundNewRecord, ReferralInboundPartialRecord, Sources as ReferralSources } from '@mono/common/lib/referral/service'
import { CreateReferralLeadsResult as LoadNewLeadsResult, createReferralLeads } from '../callcenter/service'

export { Sources as ReferralSources } from '@mono/common/lib/referral/service'

const MTAG = [ 'ops', 'referrals', 'service' ]

export type SourceReferralRecord = Record<string, string>

/**
 * Normalized inbound referral record.
 */
export type NormalizedReferralInboundRecord = Omit<ReferralInboundNewRecord, 'identityId'> & {
  isEligible?: boolean
}

export const enum ValidationErrorReason {
  MISSING_REQUIRED_ATTRIBUTE = "MissingAttribute",
  INCOMPLETE_IDENTITY = "IncompleteIdentity",
  MISSING_CONTACT_INFO = "MissingContactInfo",
  MISSING_REQUIRED_ELIGIBILITY_INFO = 'MissingRequiredEligibilityInfo'
}

export const enum ValidationWarningReason {
  MISSING_EXTERNAL_ID = 'MissingExternalId',
  INVALID_PHONE = 'InvalidPhone',
}
  
export interface ValidationError {
  reason: ValidationErrorReason,
  attributes?: string[],
}

export interface ValidationWarning {
  reason: ValidationWarningReason,
  attributes?: string[],
}
  
export interface ValidateFoodsmartNormalReferralRecordResult {
  isValid: boolean,
  record: NormalizedReferralInboundRecord,
  validationErrors?: ValidationError[],
  validationWarnings?: ValidationWarning[],
}

const _REQUIRED_SOURCE_ELIGIBILITY_ATTRIBUTES = {
  [ReferralSources.CalOptima]: [
    'referralPolicyId'
  ],
  [ReferralSources.AetnaABHIL]: [
    'referralPolicyId'
  ],
  [ReferralSources.SantaClara]: [
    'referralPolicyId'
  ],
}

const _SOURCE_ORG_IDS = {
  [ReferralSources.CalOptima]: 204,
  [ReferralSources.AetnaABHIL]: 202,
  [ReferralSources.SantaClara]: 209,
}

function referralToEligibilityGender(gender: ReferralGender): EligibilityMemberGender {
  if (gender === ReferralGender.MALE) {
    return EligibilityMemberGender.MALE
  }
  else {
    return EligibilityMemberGender.FEMALE
  }
}

export function referralToEligibilityRecord(context: IContext, referral: NormalizedReferralInboundRecord): Result<EligibilityMemberNewRecord, ErrCode> {
  const { logger } = context
  const TAG = [ ...MTAG, 'referralToEligibilityRecord' ]

  try {
    const policyId = referral.referralPolicyId

    if (!policyId) {
      logger.error(context, TAG, 'Policy ID is required.', referral)

      return err(ErrCode.INVALID_DATA)
    }

    const {
      referralPhone,
      referralPhoneMobile,
      referralPhoneHome,
      referralPhoneWork,
    } = referral

    const mobilePhone = referralPhoneMobile || referralPhoneHome || referralPhoneWork || referralPhone

    const address = referral.referralAddress1 && referral.referralAddress2 ? `${referral.referralAddress1} ${referral.referralAddress2}` : (referral.referralAddress1 || referral.referralAddress2)

    return ok({
      accountId: referral.accountId,
      organizationId: _SOURCE_ORG_IDS[referral.referralSource],
      firstName: referral.referralFirstName,
      lastName: referral.referralLastName,
      dob: referral.referralDob,
      ...(referral.referralLang && { lang: referral.referralLang }),
      ...(referral.referralGender && { gender: referralToEligibilityGender(referral.referralGender) }),
      ...(mobilePhone && { phoneMobile: mobilePhone }),
      ...(referral.referralEmail && { email: referral.referralEmail }),
      ...(address && { addressLine1: address }),
      ...(referral.referralCity && { city: referral.referralCity }),
      ...(referral.referralState && { state: referral.referralState }),
      ...(referral.referralZipcode && { zipcode: referral.referralZipcode }),
      policyId,
      ...(referral.referralRelationshipToMember && { isDependent: true }),
      ...(referral.referralDate && { eligibilityStartDate: referral.referralDate }),
      ...(referral.sourceData && { sourceData: referral.sourceData })
    })
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

/**
 * Validate a normalized record. Criteria for successful validation are:
 * 
 *  - includes identity attributes.
 *  - other: TBD
 * 
 * @param context 
 * @param record 
 * @returns 
 */
export function validateNormalizedReferralRecord(context: IContext, record: NormalizedReferralInboundRecord): Result<ValidateFoodsmartNormalReferralRecordResult, ErrCode> {
  const { logger } = context
  const TAG = [ ...MTAG, 'validateNormalReferralRecord' ]
  
  try {
    const result: ValidateFoodsmartNormalReferralRecordResult = {
      isValid: true,
      record,
      validationErrors: [],
      validationWarnings: [],
    }

    if (!record.referralExternalId) {
      logger.warn(context, TAG, 'Missing external ID.', record)

      result.validationWarnings?.push({
        reason: ValidationWarningReason.MISSING_EXTERNAL_ID
      })
    }

    const phoneKeys = [
      'referrerPhone',
      'referralPhone',
      'referralPhoneMobile',
      'referralPhoneWork',
      'referralPhoneHome'
    ]
  
    for (const phoneKey of phoneKeys) {
      if (record[phoneKey]) {
        const validation = phone(record[phoneKey], { country: 'USA' })
  
        if (!validation.isValid) {
          logger.warn(context, TAG, `Phone is not valid.`, {
            phoneKey,
            phone: record[phoneKey]
          })

          result.validationWarnings?.push({
            reason: ValidationWarningReason.INVALID_PHONE,
            attributes: [ phoneKey ]
          })
        }
      }
    }
  
    if (!record.referralFirstName || 
        !record.referralLastName ||
        !record.referralDob ||
        !record.referralZipcode
    ) {
      logger.error(context, TAG, 'Required identity fields not present.', record)
  
      result.isValid = false,
      result.validationErrors?.push({
        reason: ValidationErrorReason.INCOMPLETE_IDENTITY,
        attributes: [
          ...(record.referralFirstName ? [] : ['referralFirstName']),
          ...(record.referralLastName ? [] : ['referralFirstName']),
          ...(record.referralDob ? [] : ['referralDob']),
          ...(record.referralZipcode ? [] : ['referralZipcode']),
        ]
      })
    }

    if (
      !record.referralPhone &&
      !record.referralPhoneMobile && 
      !record.referralPhoneWork &&
      !record.referralPhoneHome &&
      !record.referralEmail
    ) {
      logger.error(context, TAG, 'Contact info. is missing.', record)

      result.isValid = false
      result.validationErrors?.push({
        reason: ValidationErrorReason.MISSING_CONTACT_INFO,
      })
    }

    if (!_REQUIRED_SOURCE_ELIGIBILITY_ATTRIBUTES[record.referralSource].reduce(
      (hasAll, currentValue) => (hasAll ? Object.keys(record).includes(currentValue) : hasAll),
      true,
    )) {
      logger.error(context, TAG, 'Required eligibility attribute is missing.', {
        record,
        required: _REQUIRED_SOURCE_ELIGIBILITY_ATTRIBUTES
      })

      result.isValid = false
      result.validationErrors?.push({
        reason: ValidationErrorReason.MISSING_REQUIRED_ELIGIBILITY_INFO,
        attributes: _REQUIRED_SOURCE_ELIGIBILITY_ATTRIBUTES[record.referralSource]
      })
    }

    return ok(result)
  }
  catch (e) {
    logger.exception(context, TAG, e)
  
    return err(ErrCode.EXCEPTION)
  }
}

/**
 * Stream which loads each record into the DB.
 * 
 * @param context 
 * @returns 
 */
function createLoadStream(context: IContext, loader: RecordLoader): Writable {
  const { logger } = context

  return new Writable({
    objectMode: true,
    write: function(chunk, encoding, callback) {
      const TAG = [ ...MTAG, 'createLoadStream', 'write' ]

      loader(context, chunk).catch(error => {
        logger.error(context, TAG, 'Error loading.', {
          chunk,
          error,
        })
      }).finally(() => callback())
    }
  })
}

interface CreateUploadResult {
  sourceKey: string,
  uploadS3Bucket: string,
  uploadS3Key: string,
  upload: Upload,
}

function createUpload(context: IContext, sourceKey: string, stream: Readable): Result<CreateUploadResult, ErrCode> {
  const { aws: {s3Client }, config, logger } = context
  const TAG = [ ...MTAG, 'createUpload' ]

  try {
    const uploadS3Bucket = config.ops_cdk.data?.destBuckets.commonData.name
    const uploadS3Key = `referrals/${sourceKey}`

    if (!uploadS3Bucket) {
      logger.error(context, TAG, 'Common data s3 bucket is required.')

      return err(ErrCode.INVALID_CONFIG)
    }

    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: uploadS3Bucket,
        Key: uploadS3Key,
        Body: stream
      },
      partSize: 1024 * 1024 * 50,
      leavePartsOnError: false,
    })

    Upload.prototype.on.call(upload, errorMonitor, (error) => {
      logger.error(context, TAG, 'Error on upload.', {
        sourceKey,
        uploadS3Bucket,
        uploadS3Key,
        error,
      })
    })

    upload.on('httpUploadProgress', (progress) => {
      logger.info(context, TAG, 'Upload progress.', {
        progress,
      })  
    })
    return ok({
      sourceKey,
      uploadS3Bucket,
      uploadS3Key,
      upload,
    })
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}


export interface ReferralImportResult {
  s3Bucket: string,
  s3Key: string,
}  

export type ImportFunction = (context: IContext, s3Bucket: string, s3Key: string, input: object) => Promise<Result<ReferralImportResult, ErrCode>>

/**
 * A record transformation function which must return a normalized Foodsmart referral record.
 * Note, NULL can be returned if the record should be skipped.
 */
export type RecordTransformer = (context: IContext, record: SourceReferralRecord) => Result<Partial<NormalizedReferralInboundRecord> | null, ErrCode>

export type RecordLoader = (context: IContext, record: NormalizedReferralInboundRecord) => Promise<Result<ReferralInboundRecord | ReferralInboundPartialRecord, ErrCode>>

interface ImportInboundReferrals {
  csvDelimiter?: string,
}

export async function importInboundReferrals(
  context: IContext,
  s3Bucket: string,
  s3Key: string,
  transformer: RecordTransformer,
  loader: RecordLoader,
  options?: ImportInboundReferrals
): Promise<Result<ReferralImportResult, ErrCode>> {
  const { logger, aws: { s3Client } } = context
  const TAG = [ ...MTAG, 'importInboundReferral' ]

  try {
    const command = new GetObjectCommand({
      Bucket: s3Bucket,
      Key: s3Key,
    })

    const item = await s3Client.send(command);
      
    if (item.Body === undefined || !(item.Body instanceof Readable)) {
      logger.error(context, TAG, `no response from s3`)
  
      return err(ErrCode.SERVICE)
    }

    const stream = item.Body

    const parser = parse({
      columns: true, // Use first row as column names
      relaxColumnCount: false,
      info: true,
      bom: true, // Remove the BOM from the first column name
      delimiter: options?.csvDelimiter, // default is ','
    })

    const transformStream = transform(function(data) {
      const { info } = data
      const TAG = [ ...MTAG, 'etl', 'transform' ]

      if (!info.error) {
        const record = data.record

        const result = transformer(context, record)

        if (result.isErr()) {
          logger.error(context, TAG, 'Transformation error.', {
            info,
            record,
            error: result.error,
          })

          return null
        }

        const transformed = result.value

        if (!transformed) {
          logger.info(context, TAG, 'Skipping record.', {
            info,
            record,
          })

          return null
        }
        else {
          logger.debug(context, TAG, 'Transformed record.', transformed)
        }

        return transformed
      }
      logger.error(context, TAG, 'Error parsing record.', info)

      return null
    })

    const transformed = stream.pipe(parser).pipe(transformStream)
    const loadStream = createLoadStream(context, loader)
    const loaded = pipeline(transformed, new PassThrough({ objectMode: true }), loadStream)

    const dateKeys = [
      'referralDob',
      'referralDate'
    ]

    const stringifier = stringify({
      delimiter: ',',
      header: true,
      cast: {
        date: function(value, parseContext) {
          if (dateKeys.includes(String(parseContext.column))) {
            return dateToDate(value)
          }
          else {
            return dateToISOTimestamp(value)
          }
        }
      }
    })

    const toUpload = transformed.pipe(new PassThrough({ objectMode: true })).pipe(stringifier)

    const createUploadResult = createUpload(context, s3Key, toUpload)

    if (createUploadResult.isErr()) {
      logger.error(context, TAG, 'Error creating upload stream.')

      return err(createUploadResult.error)
    }

    const { upload, uploadS3Bucket, uploadS3Key } = createUploadResult.value

    logger.debug(context, TAG, 'Transform stream.', {
      paused: transformed.isPaused()
    })

    if (transformed.isPaused()) {
      transformed.resume()
    }

    await Promise.all([
      loaded, 
      upload.done()
    ])

    logger.debug(context, TAG, 'ETL completed.')

    return ok({
      s3Bucket,
      s3Key,
      uploadS3Key,
      uploadS3Bucket,
    })
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

/**
 * Load newly accepted referrals to leads. Specifically, to the "callcenter.leads" schema / table
 * in Postgres.
 */
export async function loadNewLeads(context: IContext, source: ReferralSources): Promise<Result<LoadNewLeadsResult, ErrCode>> {
  const { logger } = context
  const TAG = [ ...MTAG, 'loadNewLeads' ]
  
  try {
    if (source !== ReferralSources.CalOptima) {
      logger.error(context, TAG, 'Referral source is not supported.', {
        source,
      })

      return err(ErrCode.NOT_IMPLEMENTED)
    }

    //
    // Map parameters as new referral sources are supported.
    //
    const callingListId = 'caloptima_referral_launch'
    const accountId = 61

    const createResult = await createReferralLeads(context, callingListId, accountId)

    if (createResult.isErr()) {
      logger.error(context, TAG, 'Error creating referral leads.', { 
        error: createResult.error,
      })

      return err(ErrCode.SERVICE)
    } else {
      logger.info(context, TAG, 'Created referral leads.', {
        result: createResult.value,
      })
    }

    return ok(createResult.value)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export default {
  importInboundReferrals,
  loadNewLeads,
}
