import { DateTime } from "luxon"
import { err, ok, Result } from "neverthrow"

import { ErrCode } from '@mono/common/lib/error'
import { AccountIds } from "@mono/common/lib/account/service"
import {
  NormalizedReferralInboundRecord,
  ReferralSources,
  referralToEligibilityRecord,
  validateNormalizedReferralRecord,
  ValidationErrorReason
} from "../../service"
import {
  createInboundReferral,
  ReferralInboundPartialRecord,
  ReferralInboundRecord,
  ReferralStatus,
  selectInboundReferral,
} from "@mono/common/lib/referral/service"
import {
  createEligibilityMember,
  EligibilityMemberRecord,
  selectEligibilityMemberByPolicyId,
  updateEligibilityMember
} from "@mono/common/lib/eligibility/store"
import { IContext } from "@mono/common/lib/context"
import { CSVTransformOutput } from "../csv-mapper"
import { updateScheduleReferral } from "@mono/common/lib/referral/store"

const SOURCE = ReferralSources.SantaClara
const MTAG = [ 'ops', 'referrals', 'sources', SOURCE, 'record-loader' ]

const _PAYER_ID = 36

enum LoadRecordStatus {
  'LOADED' = 'loaded',
  'SKIPPED' = 'skipped'
}

enum LoadSkippedReason {
  UNKNOWN = 'unknown',
  DUPLICATE = 'duplicate',
}

type LoadRecordResult = {
  loadStatus: LoadRecordStatus,
  skippedReason?: LoadSkippedReason,
  normalizedRecord: NormalizedReferralInboundRecord,
  loadedRecord?: ReferralInboundRecord | ReferralInboundPartialRecord,
}

function parseDateFromSourceData(
  record: NormalizedReferralInboundRecord,
  field: string
): Result<Date, ErrCode> {
  if (!record.sourceData) {
    return err(ErrCode.INVALID_DATA)
  }

  const dateString = record.sourceData[field]
  const out = DateTime.fromFormat(dateString, 'MM/dd/yyyy')

  if (out) {
    return err(ErrCode.INVALID_DATA)
  }

  return ok(out.toJSDate())
}

async function getOrCreateEligibility(
  context: IContext,
  record: NormalizedReferralInboundRecord
): Promise<Result<EligibilityMemberRecord, ErrCode>> {
  const { logger } = context
  const TAG = [ ...MTAG, 'getOrCreateEligibility' ]

  if (!record.referralPolicyId) {
    return err(ErrCode.INVALID_DATA)
  }

  const eligStartDate = parseDateFromSourceData(record, 'AuthorizationStartDate')
  const eligEndDate = parseDateFromSourceData(record, 'AuthorizationEndDate')

  const selectMemberResult = await selectEligibilityMemberByPolicyId(
    context,
    record.referralPolicyId,
    AccountIds.SantaClara)

  if (selectMemberResult.isErr()) {
    if (selectMemberResult.error !== ErrCode.NOT_FOUND) {
      logger.error(context, TAG, 'Error retreiving member eligibilty from db.', {
        error: selectMemberResult.error,
        record,
      })

      return err(selectMemberResult.error)
    }

    const referralToEligibilityResult = referralToEligibilityRecord(context, record)

    if (referralToEligibilityResult.isErr()) {
      logger.error(context, TAG, 'Error converting referral to eligibility.', record)

      return err(referralToEligibilityResult.error)
    }

    const eligibilityRecord = referralToEligibilityResult.value
    if (eligStartDate.isOk()) {
      eligibilityRecord.eligibilityStartDate = eligStartDate.value
    }
    if (eligEndDate.isOk()) {
      eligibilityRecord.eligibilityEndDate = eligEndDate.value
    }

    return await createEligibilityMember(context, eligibilityRecord)
  } else {
    var updateRecord: boolean = false
    const eligibilityRecord = selectMemberResult.value

    if (eligStartDate.isOk() ) {
      if (eligibilityRecord.eligibilityStartDate?.getTime() !== eligStartDate.value.getTime()) {
        eligibilityRecord.eligibilityStartDate = eligStartDate.value
        updateRecord = true
      }
    }
    if (eligEndDate.isOk()) {
      if (eligibilityRecord.eligibilityEndDate?.getTime() !== eligEndDate.value.getTime()) {
        eligibilityRecord.eligibilityEndDate = eligEndDate.value
        updateRecord = true
      }
    }

    if (updateRecord) {
      const updateResult = await updateEligibilityMember(context, eligibilityRecord)

      if (updateResult.isErr()) {
        logger.error(context, TAG, 'Error updating eligibility.', {
          record,
          error: updateResult.error,
        })

        return err(updateResult.error)
      }
    }

    return ok(eligibilityRecord)
  }
}

async function createIdentity(
  context: IContext,
  eligibilityId: number,
  accountId: number,
  firstName: string,
  lastName: string,
  dateOfBirth?: Date,
  zipCode?: string
): Promise<Result<number, ErrCode>> {
  const { logger, store: { writer } } = context
  const TAG = [ ...MTAG, 'createIdentity' ]

  try {
    const pgpool = await writer()

    const identityResult = await pgpool.query(`
        INSERT INTO telenutrition.iam_identity
          (eligible_id, account_id, first_name, last_name, birthday, zip_code)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING identity_id;
      `,
      [
        eligibilityId,
        AccountIds.SantaClara,
        firstName,
        lastName,
        DateTime.fromJSDate(dateOfBirth).toISODate(),
        zipCode
      ]
    )

    if (identityResult.rows.length !== 1) {
      logger.error(context, TAG, 'Error inserting identity.', {
        eligibilityId,
        accountId,
        firstName,
        lastName,
        dateOfBirth,
        zipCode,
      })

      return err(ErrCode.SERVICE)
    }

    const identityId = identityResult.rows[0].identity_id

    logger.info(context, TAG, `created identity: identity_id: ${identityId}`)

    return ok(identityId)
  } catch (e) {
    logger.error(context, TAG, 'Error creating identity.', {
      eligibilityId,
      accountId,
      firstName,
      lastName,
      dateOfBirth,
      zipCode,
      error: e,
    })

    return err(ErrCode.EXCEPTION)
  }
}

async function getOrCreateIdentity(
  context: IContext,
  eligibilityId: number,
  accountId: number,
  firstName: string,
  lastName: string,
  dateOfBirth?: Date,
  zipCode?: string,
): Promise<Result<number, ErrCode>> {
  const { logger, store: { writer } } = context
  const TAG = [ ...MTAG, 'getOrCreateIdentity' ]

  try {
    const pgpool = await writer()

    const getIdentityResult = await pgpool.query(
      `SELECT identity_id FROM telenutrition.iam_identity WHERE eligible_id=$1;`,
      [eligibilityId]
    )

    if (getIdentityResult.rows.length === 1) {
      return ok(getIdentityResult.rows[0].identity_id)
    }

    return await createIdentity(
      context,
      eligibilityId,
      accountId,
      firstName,
      lastName,
      dateOfBirth,
      zipCode)
  } catch (e) {
    logger.error(context, TAG, 'Error getting identity.', {
      eligibilityId,
      accountId,
      firstName,
      lastName,
      dateOfBirth,
      zipCode,
      error: e,
    })

    return err(ErrCode.EXCEPTION)
  }
}

type GetOrCreateReferralInfo = {
  created: boolean,
  referral: ReferralInboundRecord | ReferralInboundPartialRecord,
}

async function getOrCreateReferralRecord(
  context,
  record
): Promise<Result<GetOrCreateReferralInfo, ErrCode>> {
  const { logger } = context
  const TAG = [ ...MTAG, 'createReferralRecord' ]

  try {
    if (record.referralExternalId) {
      const existingReferralResult = await selectInboundReferral(
        context,
        {
          referralExternalId: record.referralExternalId,
          accountId: AccountIds.SantaClara,
        },
        { missingNotAnError: true },
      )

      if (existingReferralResult.isErr()) {
        if (existingReferralResult.error !== ErrCode.NOT_FOUND) {
          return err(existingReferralResult.error)
        }
      } else if (existingReferralResult.value) {
        return ok({
          created: false,
          referral: existingReferralResult.value,
        })
      }
    }

    let referralStatus = record.referralStatus ?? ReferralStatus.REQUESTED
    let errors = (record as CSVTransformOutput).errors ?? []

    if (!record.referralExternalId || errors.length > 0) {
      referralStatus = ReferralStatus.INVALID
    }

    const createResult = await createInboundReferral(context, {
      ...record,
      referralStatus,
      payerId: _PAYER_ID,
    })

    if (createResult.isErr()) {
      return err(createResult.error)
    }

    return ok({
      created: true,
      referral: createResult.value,
    })
  } catch (e) {
    return err(ErrCode.EXCEPTION)
  }
}

async function loadRecord(
  context: IContext,
  record: NormalizedReferralInboundRecord
): Promise<Result<LoadRecordResult, ErrCode>> {
  const { logger } = context
  const TAG = [ ...MTAG, 'loadRecord' ]

  try {
    logger.debug(context, TAG, 'Loading record.', record)

    const getOrCreateResult = await getOrCreateReferralRecord(context, record)
    if (getOrCreateResult.isErr()) {
      return err(getOrCreateResult.error)
    }

    const {created, referral } = getOrCreateResult.value
    // If we created the value as invalid, we can skip the rest of the processing.
    // If it was previously marked as invalid allow processing to continue in case
    // there was a processing error.
    if (created && referral.referralStatus === ReferralStatus.INVALID) {
      return ok({
        loadStatus: LoadRecordStatus.SKIPPED,
        skippedReason: LoadSkippedReason.UNKNOWN,
        normalizedRecord: record,
      })
    }

    if (!record.referralExternalId) {
      // This acts as an assert for code below, we should never reach this as
      // the `createReferralRecord` function should have caught this already.
      return err(ErrCode.INVALID_DATA)
    }

    const getEligibilityResult = await getOrCreateEligibility(context, record)
    if (getEligibilityResult.isErr()) {
      logger.error(context, TAG, 'Error getting or creating eligibility.', {
        record,
        error: getEligibilityResult.error,
      })

      return err(getEligibilityResult.error)
    }

    const eligibility = getEligibilityResult.value

    let identityId: number
    if (referral.identityId) {
      identityId = referral.identityId
    } else {
      const identityResult = await getOrCreateIdentity(
        context,
        eligibility.eligibilityId,
        AccountIds.SantaClara,
        record.referralFirstName,
        record.referralLastName,
        record.referralDob,
        record.referralZipcode
      )

      if (identityResult.isErr()) {
        logger.error(context, TAG, 'Error getting or creating identity.', {
          record,
          error: identityResult.error,
        })

        return err(identityResult.error)
      }

      identityId = identityResult.value
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

    let endReferralStatus = ReferralStatus.REQUESTED
    if (!validation.isValid) {
      // We just created the eligibility, so if that was the error assume network issue and ignore
      const errors = (validation.validationErrors ?? []).filter(function(e) {
        e.reason !== ValidationErrorReason.MISSING_REQUIRED_ELIGIBILITY_INFO}
      )

      if (errors.length > 0) {
        logger.warn(context, TAG, 'invalid referral',
          {
            referralExternalId: record.referralExternalId,
            errors: errors,
        })

        endReferralStatus = ReferralStatus.INVALID
      }
    }

    if (referral.referralStatus !== endReferralStatus || referral.identityId !== identityId) {
      const updateResult = await updateScheduleReferral(
        context,
        referral.referralInboundId,
        {
          identityId: identityId,
          referralStatus: endReferralStatus,
        }
      )

      if (updateResult.isErr()) {
        logger.error(context, TAG, "failed to update referral status", {
          error: updateResult.error,
          inputRecord: record,
          referralInboundId: referral.referralInboundId,
        })

        return err(updateResult.error)
      }

      referral.referralStatus = endReferralStatus
    }

    return ok({
      loadStatus: LoadRecordStatus.LOADED,
      normalizedRecord: record,
      loadedRecord: referral,
    })
  } catch (e) {
    return err(ErrCode.EXCEPTION)
  }
}

export async function recordLoader(
  context: IContext,
  record: NormalizedReferralInboundRecord
): Promise<Result<ReferralInboundRecord | ReferralInboundPartialRecord, ErrCode>> {
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

export default {
  recordLoader,
}
