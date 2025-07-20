/**
 * Perform ETL on Aetna ABHIL data.
 */
import { err, ok, Result } from "neverthrow"

import { IContext } from '@mono/common/lib/context'
import { ErrCode } from "@mono/common/lib/error"
import { AccountIds } from '@mono/common/lib/account/service'
import { selectEligibilityMemberByPolicyId } from '@mono/common/lib/eligibility/store'
import { 
  ReferralStatus,
  Sources as ReferralSources,
  ReferralInboundRecord, 
  createInboundReferral,
  selectInboundReferral,
  updateInboundReferral,
  updateInboundReferralStatus,
  ReferralInboundPartialRecord,
} from '@mono/common/lib/referral/service'

import { 
  NormalizedReferralInboundRecord,
  ReferralImportResult,
  RecordLoader,
  ValidationErrorReason, 
  importInboundReferrals,
  validateNormalizedReferralRecord
} from '../../service'
import { csvRecordTransformFactory } from "../csv-mapper"
import { CSV_MAPPING_CONFIG } from "./csv-map-settings"

const SOURCE = ReferralSources.AetnaABHIL
const MTAG = [ 'ops', 'referrals', 'sources', SOURCE ]

enum LoadRecordStatus {
  'LOADED' = 'loaded',
  'SKIPPED' = 'skipped'
}

enum LoadSkippedReason {
  AETNAABHIL_SERVICE_NOT_FOUND,
  AETNAABHIL_IN_ELIGIBLE,
  MISSING_REQUIRED_ELIGIBILITY_INFO,
}

type LoadRecordResult = {
  loadStatus: LoadRecordStatus,
  skippedReason?: LoadSkippedReason,
  normalizedRecord: NormalizedReferralInboundRecord,
  loadedRecord?: ReferralInboundRecord | ReferralInboundPartialRecord,
}

const _PAYER_ID = 23  // Aetna Better Health Illinois (ABHIL)

/**
 * Load a normalized referral record. 
 * 
 * If the referral record already exists, then update instead of creating. Existing records will only be updated
 * if their current status is 'requested' or 'declined'. If the currrent status is 'declined', then the record
 * can transition to 'requested' if it would no longer be rejected at this stage (ie: eligibility was previously
 * not found but now exists).
 * 
 * Note: This should probably be refactored into the service layer as generic code used for all data sources
 * that require eligibility data as a pre-requisite.
 * 
 * @param context 
 * @param record 
 * @returns 
 */
async function loadRecord(context: IContext, record: NormalizedReferralInboundRecord): Promise<Result<LoadRecordResult, ErrCode>> {
  const { logger, store: { writer } } = context
  const TAG = [ ...MTAG, 'loadRecord' ]

  try {
    logger.debug(context, TAG, 'Loading record.', record)

    let existingReferral: ReferralInboundPartialRecord | undefined 

    if (record.referralExternalId) {
      const selectResult = await selectInboundReferral(context, { referralExternalId: record.referralExternalId, accountId: AccountIds.AetnaABHIL})

      if (selectResult.isErr()) {
        if (selectResult.error !== ErrCode.NOT_FOUND) 
          logger.error(context, TAG, 'Error selecting existing referral.', {
            error: selectResult.error,
        })
      }
      else {
        existingReferral = selectResult.value
      }
    }

    const validationResult = validateNormalizedReferralRecord(context, record)

    if (validationResult.isErr()) {
      logger.error(context, TAG, 'Error validating record.', {
        record,
        error: validationResult.error,
      })

      return err(validationResult.error)
    }

    const validation = validationResult.value

    if (!validation.isValid && validation.validationErrors && validation.validationErrors.find(e => e.reason === ValidationErrorReason.MISSING_REQUIRED_ELIGIBILITY_INFO)) {
      //
      // Cannot lookup eligibility.
      //
      // The record should be persist if eligibility data cannot be looked up. Status is set to 'invalid'.
      //
      // Note, we may want to persist as invalid under any condition.
      //
      logger.info(context, TAG, `Required eligibility attributes are missing.`, record)

      let result: Result<ReferralInboundPartialRecord | ReferralInboundRecord, ErrCode>

      if (existingReferral) {
        result = await updateInboundReferral(context, existingReferral.referralInboundId, {
          referralStatus: ReferralStatus.INVALID,
          sourceData: record.sourceData,
        })
      }
      else {
        result = await createInboundReferral(context, {
          ...record,
          referralStatus: ReferralStatus.INVALID,
          payerId: _PAYER_ID,
        })
      }

      if (result.isErr()) {
        logger.error(context, TAG, 'Error creating / updating referral record.', {
          record,
        })
      }

      return ok({
        loadStatus: LoadRecordStatus.SKIPPED,
        skippedReason: LoadSkippedReason.MISSING_REQUIRED_ELIGIBILITY_INFO,
        normalizedRecord: record,
      })
    }

    const pgpool = await writer()
    const referralPolicyId = record.referralPolicyId ?? ''

    let eligibilityId: number | null = null
    let identityId: number | null = null

    const selectMemberResult = await selectEligibilityMemberByPolicyId(context, referralPolicyId, AccountIds.AetnaABHIL)

    if (selectMemberResult.isErr() && selectMemberResult.error === ErrCode.NOT_FOUND) {
      logger.info(context, TAG, 'Eligibility not found for member. Referral will be declined.', {
        record,
      })

      let result: Result<ReferralInboundPartialRecord | ReferralInboundRecord, ErrCode>

      if (existingReferral) {
        result = await updateInboundReferral(context, existingReferral.referralInboundId, {
          referralStatus: ReferralStatus.REQUESTED,
          referralExternalPatientId: record.referralExternalPatientId,
          sourceData: record.sourceData,
        })
      }
      else {
        result = await createInboundReferral(context, {
          ...record,
          referralStatus: ReferralStatus.REQUESTED,
          payerId: _PAYER_ID,
        })
      }

      if (result.isErr()) {
        logger.error(context, TAG, 'Error creating / updating referral.', {
          record,
        })

        return err(result.error)
      }

      const referral = result.value
      const updateResult = await updateInboundReferralStatus(context, referral.referralInboundId, ReferralStatus.DECLINED)

      if (updateResult.isErr()) {
        logger.error(context, TAG, 'Error updating referral status.', {
          record,
          new_status: ReferralStatus.DECLINED,
        })

        return err(updateResult.error)
      }
      return ok({
        loadStatus: LoadRecordStatus.LOADED,
        normalizedRecord: record,
        loadedRecord: referral,
      })
    }
    else if (selectMemberResult.isErr()) {
      logger.error(context, TAG, 'Error looking up eligibility.', record)

      return err(selectMemberResult.error)
    }
    else {
      const member = selectMemberResult.value

      eligibilityId = member.eligibilityId

      const identityResult = await pgpool.query(`SELECT identity_id FROM telenutrition.iam_identity WHERE eligible_id=$1;`, [eligibilityId])

      if (identityResult.rows.length !== 1) {
        logger.error(context, TAG, 'Error getting identity.', {
          record,
          member,
        })

        return err(ErrCode.SERVICE)
      }
      identityId = identityResult.rows[0].identity_id

      if (identityId === null) {
        logger.error(context, TAG, 'Invalid identity ID.', {
          query_result: identityResult.rows
        })

        return err(ErrCode.STATE_VIOLATION)
      }

      logger.debug(context, TAG, 'Identity.', {
        identity: identityResult.rows[0]
      })

      let result: Result<ReferralInboundPartialRecord | ReferralInboundRecord, ErrCode>

      if (existingReferral) {
        result = await updateInboundReferral(context, existingReferral.referralInboundId, {
          referralStatus: record.referralStatus,
          referralExternalPatientId: record.referralExternalPatientId,
          identityId,
          sourceData: record.sourceData,
        })
      }
      else {
        //
        // There should now be an eligibility / identity.
        // Insert a inbound referral record.
        //
        result = await createInboundReferral(context, {
          ...record,
          identityId,
          payerId: _PAYER_ID,
        })
      }

      if (result.isErr()) {
        logger.error(context, TAG, 'Error inserting referral.', record)

        return err(result.error)
      }
      return ok({
        loadStatus: LoadRecordStatus.LOADED,
        normalizedRecord: record,
        loadedRecord: result.value,
      })
    }
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

/**
 * Create a closure to make flow task input available.
 * 
 * @param input 
 * @returns 
 */
function recordLoaderFactory(input: object): RecordLoader {
  async function recordLoader(context: IContext, record: NormalizedReferralInboundRecord): Promise<Result<ReferralInboundRecord | ReferralInboundPartialRecord, ErrCode>> {
    const { logger } = context
    const TAG = [ ...MTAG, 'recordLoader' ]

    try {
      const result = await loadRecord(context, record)

      if (result.isErr()) {
        logger.error(context, TAG, 'Load error.', {
          record,
          error: result.error,
        })

        return err(result.error)
      }

      const loadResult = result.value

      if (loadResult.loadStatus === LoadRecordStatus.LOADED && loadResult.loadedRecord) {
        return ok(loadResult.loadedRecord)
      }
      else {
        return err(ErrCode.INVALID_DATA)
      }
    }
    catch (e) {
      return err(ErrCode.EXCEPTION)
    }
  }

  return recordLoader
}

/**
 * Ingest data from the "external data" S3 Bucket identify by the s3 Key 'srcKey'.
 * 
 * @param context 
 * @param srcKey 
 */
export async function doImport(
  context: IContext,
  srcBucket: string,
  srcKey: string,
  input: object
): Promise<Result<ReferralImportResult, ErrCode>> {
  const { logger } = context
  const TAG = [ ...MTAG, 'etl' ]

  if (!srcKey.startsWith('aetna-abhil/')) {
    logger.info(context, TAG, 'Non-Aetna ABHIL file, skipping', {
      srcBucket,
      srcKey,
    })

    return ok({
      s3Bucket: srcBucket,
      s3Key: srcKey,
    })
  }

  try {
    const result = await importInboundReferrals(
      context,
      srcBucket,
      srcKey,
      csvRecordTransformFactory({
        mappingConfig: CSV_MAPPING_CONFIG,
        handleDupes: true,
      }),
      recordLoaderFactory(input))

    if (result.isErr()) {
      logger.error(context, TAG, 'Error performing ETL.', {
        srcKey,
        error: result.error,
      })

      return err(result.error)
    }
    return ok(result.value)
  }
  catch (e) {
    logger.exception(context, TAG, e)
        
    return err(ErrCode.EXCEPTION)
  }
}

export { doImport as importInboundReferrals };

export default {
  importInboundReferrals: doImport,
}
