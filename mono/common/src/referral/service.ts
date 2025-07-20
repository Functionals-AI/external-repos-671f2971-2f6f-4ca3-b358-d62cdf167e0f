import { Result, err, ok } from 'neverthrow'

import { IContext } from '../context'
import { ErrCode } from '../error'
import { RequireAtLeastOne } from '../typescript'
import { AccountIds } from '../account/service'
import {
  ReferralGender,
  ReferralRelationshipToMember,
  ReferralService,
  ReferralStatus,
  ScheduleReferralRecord,
  Sources,
  createScheduleReferral,
  getActionableReferrals,
  getScheduleReferral,
  getScheduleReferralByExternalId,
  updateScheduleReferral,
  getNewAcceptedReferrals,
  getNewInProgressReferrals,
  getNewCompletedReferrals,
  updateScheduleReferralStatus,
} from './store'
import CalOptima from '../integration/cal-optima-connect'
import { CaloptimaConnectContext } from '../integration/cal-optima-connect/browser'
import { UpdateReferralStatusOptions, ReferralStatus as CalOptimaReferralStatus } from '../integration/cal-optima-connect/referral'
import { performReferralActions } from './sources/caloptima'

export type SourceReferralContext = CaloptimaConnectContext | undefined
export type SourceReferralOptions = UpdateReferralStatusOptions | undefined

export { ReferralGender, ReferralService, ReferralStatus, Sources } from './store'

import * as db from 'zapatos/db'
import * as zs from 'zapatos/schema'

const MTAG = ['common', 'referral', 'service']

export function isCaloptimaConnectContext(context: IContext, sourceContext: SourceReferralContext): sourceContext is CaloptimaConnectContext {
  return (sourceContext as CaloptimaConnectContext).browser !== undefined &&
    (sourceContext as CaloptimaConnectContext).page !== undefined
}


/**
 * Referral Options which should be reused accross invokations for a source integration.
 * 
 * @param context 
 * @param source 
 * @returns 
 */
async function createSourceReferralContext(context: IContext, source: Sources): Promise<Result<SourceReferralContext, ErrCode>> {
  const { logger } = context
  const TAG = [...MTAG, 'createSourceReferralContext']

  try {
    if (source === Sources.CalOptima) {
      //
      // If Cal Optima, create a context S.T. a new browser / page and auth. is not performed for each referral.
      //
      const result = await CalOptima.Browser.createCaloptimaConnectContext(context)

      if (result.isErr()) {
        logger.error(context, TAG, 'Caloptima Connect Context is required.', {
          error: result.error
        })

        return err(result.error)
      }

      return ok(result.value)
    }
    return ok(undefined)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

/**
 * Referral Options which should be reused accross invokations for a source integration.
 * 
 * @param context 
 * @param source 
 * @returns 
 */
async function destroySourceReferralContext(context: IContext, source: Sources, sourceContext: SourceReferralContext): Promise<Result<void, ErrCode>> {
  const { logger } = context
  const TAG = [...MTAG, 'createSourceReferralOptions']

  try {
    if (source === Sources.CalOptima && isCaloptimaConnectContext(context, sourceContext)) {
      //
      // If Cal Optima, create a context S.T. a new browser / page and auth. is not performed for each referral.
      //
      const result = await CalOptima.Browser.destroyCaloptimaConnectContext(context, sourceContext)

      if (result.isErr()) {
        logger.error(context, TAG, 'Caloptima Connect Context is required.', {
          error: result.error
        })

        return err(result.error)
      }
    }
    return ok(undefined)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export interface ReferralInboundRecord extends Omit<ReferralInboundNewRecord, 'referralSource' | 'referralService' | 'referralStatus' | 'referralRelationshipToMember'> {
  referralInboundId: number,
  referralSource: string,
  referralService: string,
  referralStatus: string,
  createdAt: Date,
  updatedAt: Date,
}

export interface ReferralInboundPartialRecord extends Omit<ReferralInboundRecord, 'referralSource' | 'referralFirstName' | 'referralLastName' | 'referralDob'> {
  referralSource?: Sources,
  referralFirstName?: string,
  referralLastName?: string,
  referralDob?: Date,
}

export interface ReferralInboundNewRecord {
  // Referral attributes.
  referralSource: string,
  referralService: ReferralService,
  referralStatus: ReferralStatus,
  referralDate: Date,
  referralExternalId?: string,
  referralExternalStatus?: string,
  referralExternalPatientId?: string,
  referralFirstName: string,
  referralLastName: string,
  referralDob: Date,
  referralLang?: string,
  referralGender?: ReferralGender,
  referralPhone?: string,
  referralPhoneMobile?: string,
  referralPhoneWork?: string,
  referralPhoneHome?: string,
  referralEmail?: string,
  referralAddress1?: string,
  referralAddress2?: string,
  referralCity?: string,
  referralState?: string,
  referralZipcode?: string,
  referralGroupId?: string,
  referralPolicyId?: string,
  referralRelationshipToMember?: ReferralRelationshipToMember,
  referralNotes?: string,
  // Referrer attributes
  referredBy?: string,
  referrerFirstName?: string,
  referrerLastName?: string,
  referrerEmail?: string,
  referrerPhone?: string,
  referrerOrganization?: string,
  referrerCredentials?: string,
  referrerProviderNpi?: number,
  // Internal attributes
  accountId: number,
  identityId?: number,
  icd10Codes?: string[],
  payerId?: number,
  sourceData: db.JSONValue,
}

function mapReferralInboundRecord(referral: ScheduleReferralRecord, identity: zs.telenutrition.iam_identity.JSONSelectable | undefined): ReferralInboundPartialRecord {
  return {
    referralInboundId: referral.referralId,
    referralService: ReferralService.HEALTH_ASSESSMENT,
    referralStatus: referral.referralStatus,
    referralFirstName: identity?.first_name ?? undefined,
    referralLastName: identity?.last_name ?? undefined,
    referralDob: identity?.birthday ? new Date(identity.birthday) : undefined,
    referralZipcode: identity?.zip_code ?? undefined,
    referredBy: referral.referredBy,
    referralDate: referral.referralDate,
    referralExternalId: referral.referralExternalId,
    referralExternalPatientId: referral.patientExternalId,
    accountId: referral.accountId,
    identityId: identity?.identity_id,
    payerId: referral.payerId,
    sourceData: referral.sourceData,
    createdAt: referral.createdAt,
    updatedAt: referral.updatedAt,
  }
}

const _VALID_INITIAL_REFERRAL_STATUSES = [
  ReferralStatus.REQUESTED,
  ReferralStatus.INVALID,
]

/**
 * Create a new "inbound referral". However, persist to "telenutrition.schedule_referral". 
 * May transition to "common.referral_inbound" in the future.
 * 
 * @param context 
 * @param record 
 * @returns 
 */
export async function createInboundReferral(context: IContext, record: ReferralInboundNewRecord): Promise<Result<ReferralInboundRecord, ErrCode>> {
  const { logger, store: { reader } } = context
  const TAG = [...MTAG, 'createInboundReferral']

  try {
    const pool = await reader()

    if (!_VALID_INITIAL_REFERRAL_STATUSES.includes(record.referralStatus)) {
      //
      // Status of new referrals must be requested or invalid.
      //
      logger.error(context, TAG, 'New referrals must have a status of requested.', record)

      return err(ErrCode.STATE_VIOLATION)
    }

    const result = await createScheduleReferral(context, {
      ...record,
      ...(record.referralExternalPatientId && { patientExternalId: record.referralExternalPatientId }),
    })

    if (result.isErr()) {
      logger.error(context, TAG, 'Error creating schedule referral.', {
        record,
        error: result.error,
      })

      return err(result.error)
    }

    const inserted = result.value

    let identity: zs.telenutrition.iam_identity.JSONSelectable | undefined

    if (inserted.identityId !== undefined) {
      identity = await db.selectOne('telenutrition.iam_identity', {
        identity_id: inserted.identityId
      }).run(pool)

      if (identity === undefined) {
        logger.error(context, TAG, 'Failed to retrieve identity.', {
          record,
          identity_id: inserted.identityId,
          inserted,
        })

        return (err(ErrCode.STATE_VIOLATION))
      }
    }

    return ok({
      referralInboundId: inserted.referralId,
      referralSource: record.referralSource,
      referralService: ReferralService.HEALTH_ASSESSMENT,
      referralStatus: inserted.referralStatus,
      referralFirstName: identity?.first_name ?? record.referralFirstName,
      referralLastName: identity?.last_name ?? record.referralLastName,
      referralDob: identity?.birthday ? new Date(identity.birthday) : record.referralDob,
      referralZipcode: identity?.zip_code ?? record.referralZipcode,
      ...(inserted.referredBy && { referredBy: inserted.referredBy }),
      referralDate: inserted.referralDate,
      ...(inserted.referralExternalId && { referralExternalId: inserted.referralExternalId }),
      ...(inserted.patientExternalId && { referralExternalPatientId: inserted.patientExternalId }),
      accountId: inserted.accountId,
      ...(identity && { identityId: identity.identity_id }),
      ...(inserted.payerId && { payerId: inserted.payerId }),
      sourceData: inserted.sourceData,
      createdAt: inserted.createdAt,
      updatedAt: inserted.updatedAt,
    })
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

type SelectInboundReferralByReferralInboundId = { 
  referralInboundId: ReferralInboundRecord['referralInboundId']
}
type SelectInboundReferralByExternalId = {
  referralExternalId: Exclude<ReferralInboundRecord['referralExternalId'], undefined>,
  accountId: ReferralInboundRecord['accountId'],
}

type SelectInboundReferralSelector = 
  SelectInboundReferralByReferralInboundId |
  SelectInboundReferralByExternalId

interface SelectInboundReferralOptions {
  missingNotAnError?: boolean
}

/**
 * Select an inbound referral by ID (internal or external).
 * 
 * @param context 
 * @param selector 
 */
export async function selectInboundReferral(
  context: IContext,
  selector: SelectInboundReferralSelector,
  options?: SelectInboundReferralOptions,
): Promise<Result<ReferralInboundPartialRecord | undefined, ErrCode>> {
  const { logger, store: { reader } } = context
  const TAG = [...MTAG, 'selectInboundReferral']

  options = options ?? {}

  try {
    let selected: ScheduleReferralRecord | undefined

    if ((selector as SelectInboundReferralByReferralInboundId).referralInboundId !== undefined) {
      const referralId = (selector as SelectInboundReferralByReferralInboundId).referralInboundId

      const result = await getScheduleReferral(context, referralId)

      if (result.isErr()) {
        if (options.missingNotAnError && result.error === ErrCode.NOT_FOUND) {
          return ok(undefined)
        } else {
          logger.error(context, TAG, 'Error selecting referral.', {
            selector,
            error: result.error,
          })

          return err(result.error)
        }
      }
      selected = result.value
    }
    else {
      const {
        referralExternalId,
        accountId,
       } = (selector as SelectInboundReferralByExternalId)

       const result = await getScheduleReferralByExternalId(context, referralExternalId, accountId)

       if (result.isErr()) {
        if (options.missingNotAnError && result.error === ErrCode.NOT_FOUND) {
          return ok(undefined)
        } else {
          logger.error(context, TAG, 'Error selecting referral.', {
            selector,
            error: result.error,
          })

          return err(result.error)
        }
      }
      selected = result.value
    }

    let identity: zs.telenutrition.iam_identity.JSONSelectable | undefined

    if (selected.identityId !== undefined) {
      const pool = await reader()

      identity = await db.selectOne('telenutrition.iam_identity', {
        identity_id: selected.identityId
      }).run(pool)

      if (identity === undefined) {
        logger.error(context, TAG, 'Failed to retrieve identity.', {
          referral: selected,
          identity_id: selected.identityId,
          selected,
        })

        return (err(ErrCode.STATE_VIOLATION))
      }
    }

    return ok(mapReferralInboundRecord(selected, identity))
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION) 
  }
}

type InboundReferralUpdatable = {
  referralExternalPatientId: ReferralInboundRecord['referralExternalPatientId'],
  referralStatus: ReferralStatus,
  identityId: ReferralInboundRecord['identityId'],
  sourceData: ReferralInboundRecord['sourceData'],
}

export type InboundReferralUpdates = RequireAtLeastOne<InboundReferralUpdatable>

/**
 * Perform updates after initial creation. This is ussually in the context of re-loading a referral which
 *  - may have data correcting, 
 *  - an identity created which was previously not associated, 
 *  - etc..
 * 
 * @param context 
 * @param referralInboundId 
 */
export async function updateInboundReferral(context: IContext, referralInboundId: ReferralInboundRecord['referralInboundId'], updates: InboundReferralUpdates) {
  const { logger } = context
  const TAG = [ ...MTAG, 'updateInboundReferral']

  const {
    referralExternalPatientId: patientExternalId,
    ...otherUpdates
  } = updates

  try {
    const updateResult = await updateScheduleReferral(context, referralInboundId, {
      patientExternalId,
      ...otherUpdates,
    })

    if (updateResult.isErr()) {
      logger.error(context, TAG, 'Error updating referral.', {
        referral_id: referralInboundId,
        updates,
      })

      return err(updateResult.error)
    }

    const updated = updateResult.value
    let identity: zs.telenutrition.iam_identity.JSONSelectable | undefined

    if (updated.identityId !== undefined) {
      const { store: { reader }} = context
      const pool = await reader()

      identity = await db.selectOne('telenutrition.iam_identity', {
        identity_id: updated.identityId
      }).run(pool)

      if (identity === undefined) {
        logger.error(context, TAG, 'Failed to retrieve identity.', {
          referral: updated,
          identity_id: updated.identityId,
          updated,
        })

        return (err(ErrCode.STATE_VIOLATION))
      }
    }

    return ok(mapReferralInboundRecord(updated, identity))
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }

}

/**
 * Verify a referral status transition is valid. Valid transitions are:
 * 
 *  REQUESTED -> DECLINED
 *  REQUESTED -> ACCEPTED
 *  ACCEPTED  -> IN_PROGRESS
 *  IN_PROGRESS -> COMPLETED
 *  IN_PROGRESS -> CANCELLED
 *  
 * @param currentStatus 
 * @param desiredStatus 
 * @returns 
 */
function isReferralStatusTransitionValid(currentStatus: ReferralStatus, desiredStatus: ReferralStatus): boolean {
  if (currentStatus === ReferralStatus.REQUESTED) {
    if (![
      ReferralStatus.DECLINED,
      ReferralStatus.ACCEPTED
    ].includes(desiredStatus)) {
      return false
    }
  }

  if (currentStatus === ReferralStatus.ACCEPTED && desiredStatus !== ReferralStatus.IN_PROGRESS) {
    return false
  }

  if (currentStatus === ReferralStatus.IN_PROGRESS) {
    if (![
      ReferralStatus.COMPLETED,
      ReferralStatus.CANCELLED
    ].includes(desiredStatus)) {
      return false
    }
  }
  return true
}

/**
 * Update the referral status with the source of the referral. 
 * 
 * Note, this perhaps should be configurable in some manner. TBD. Right now, key off of the account ID
 * to call an integration.
 * 
 * @returns 
 */
export async function updateSourceReferralStatus(context: IContext, referral: ScheduleReferralRecord, status: ReferralStatus, options?: SourceReferralOptions): Promise<Result<void, ErrCode>> {
  const { logger } = context
  const TAG = [...MTAG, 'updateSourceReferralStatus']

  try {
    logger.debug(context, TAG, 'Updating source referral status.', {
      referral,
      new_status: status,
    })
    if (referral.accountId === AccountIds.CalOptima) {
      logger.debug(context, TAG, 'Updating CalOptima source referral status.', {
        referral,
        new_status: status,
        dry_run: options?.dryRun ?? false,
      })

      if (referral.patientExternalId === undefined || referral.referralExternalId === undefined) {
        logger.error(context, TAG, 'Patient and service external ID are required.', {
          referral,
        })

        return err(ErrCode.INVALID_DATA)
      }

      if (status === ReferralStatus.ACCEPTED) {
        const result = await CalOptima.Referral.updateReferralStatus(context, referral.patientExternalId, referral.referralExternalId, CalOptimaReferralStatus.ACCEPTED, options)

        if (result.isErr()) {
          logger.error(context, TAG, 'Error updating referral source status.', {
            referral,
            status,
          })

          return err(result.error)
        }
      }
      else if (status === ReferralStatus.DECLINED) {
        const result = await CalOptima.Referral.updateReferralStatus(context, referral.patientExternalId, referral.referralExternalId, CalOptimaReferralStatus.DECLINED, options)

        if (result.isErr()) {
          logger.error(context, TAG, 'Error updating referral source status.', {
            referral,
            status,
          })

          return err(result.error)
        }
      }
      else if (status === ReferralStatus.IN_PROGRESS) {
        const result = await CalOptima.Referral.updateReferralStatus(context, referral.patientExternalId, referral.referralExternalId, CalOptimaReferralStatus.IN_PROGRESS, options)

        if (result.isErr()) {
          logger.error(context, TAG, 'Error updating referral source status.', {
            referral,
            status,
          })

          return err(result.error)
        }
      }
      else if (status === ReferralStatus.COMPLETED) {
        const result = await CalOptima.Referral.updateReferralStatus(context, referral.patientExternalId, referral.referralExternalId, CalOptimaReferralStatus.COMPLETED, options)

        if (result.isErr()) {
          logger.error(context, TAG, 'Error updating referral source status.', {
            referral,
            status,
          })

          return err(result.error)
        }
      }
      else {
        logger.error(context, TAG, 'Unsupported referral status.', {
          referral,
          status,
        })

        return err(ErrCode.INVALID_DATA)
      }
    }

    return ok(undefined)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export async function updateInboundReferralStatus(context: IContext, referralId: number, status: ReferralStatus, options?: SourceReferralOptions): Promise<Result<ReferralStatus, ErrCode>> {
  const { logger } = context
  const TAG = [...MTAG, 'updateInboundReferralStatus']

  try {
    const getResult = await getScheduleReferral(context, referralId)

    if (getResult.isErr()) {
      logger.error(context, TAG, 'Error retrieving referral to update.', {
        referralId,
        status,
      })

      return err(getResult.error)
    }

    const referral = getResult.value

    if (!isReferralStatusTransitionValid(referral.referralStatus, status)) {
      logger.error(context, TAG, 'Invalid referral status transition requested.', {
        referral,
        status,
      })

      return err(ErrCode.STATE_VIOLATION)
    }

    const sourceStatusUpdateResult = await updateSourceReferralStatus(context, referral, status, options)

    if (sourceStatusUpdateResult.isErr()) {
      logger.error(context, TAG, 'Error updating status with referral source.', {
        referral,
        status,
      })

      return err(sourceStatusUpdateResult.error)
    }

    const updateResult = await updateScheduleReferralStatus(context, referralId, referral.referralStatus, status)

    if (updateResult.isErr()) {
      logger.error(context, TAG, 'Error updating referral status.', {
        referral,
        status,
      })

      return err(updateResult.error)
    }

    return ok(status)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export interface ProcessRequestedReferralsResult {
  num_processed: number,
  num_accepted: number,
  num_declined: number,
  num_errors: number,
}

/**
 * Process 'requested' referrals, where:
 *  - Requested referrals which are duplicates transition to 'declined'
 *  - Requested referrals which are not duplicates transition to 'accepted.
 * 
 * @param context 
 * @param source 
 * @param dryRun 
 * @returns 
 */
export async function processRequestedReferrals(context: IContext, source: Sources, dryRun?: boolean): Promise<Result<ProcessRequestedReferralsResult, ErrCode>> {
  const { logger } = context
  const TAG = [...MTAG, 'processRequestedReferrals']

  try {
    dryRun = dryRun ?? false
    //
    // Get referrals for source which are have a 'requested' status.
    //
    const getReferralsResult = await getNewAcceptedReferrals(context, {
      sources: source,
    })

    if (getReferralsResult.isErr()) {
      logger.error(context, TAG, 'Error fetching referrals', { error: getReferralsResult.error })

      return err(getReferralsResult.error)
    } else {
      logger.info(context, TAG, `Got ${getReferralsResult.value.length} new referrals.`)
    }

    const sourceContextResult = await createSourceReferralContext(context, source)

    if (sourceContextResult.isErr()) {
      logger.error(context, TAG, 'Error creating source referral context.', {
        source,
        error: sourceContextResult.error,
      })

      return err(sourceContextResult.error)
    }

    const sourceContext = sourceContextResult.value

    const referralOptions = {
      dryRun,
      sourceContext,
    }

    const referrals = getReferralsResult.value

    const result: ProcessRequestedReferralsResult = {
      num_processed: 0,
      num_accepted: 0,
      num_declined: 0,
      num_errors: 0,
    }

    for (let referral of referrals) {
      if (referral.isDuplicate) {
        logger.info(context, TAG, `process referral_status: ${referral.referralStatus}`, {
          referral,
          new_status: ReferralStatus.DECLINED,
        })

        if (dryRun) {
          logger.info(context, TAG, 'Dry run, skipping update of inbound referral status.', {
            referral,
            new_status: ReferralStatus.DECLINED,
          })
        }
        else {
          const declineResult = await updateInboundReferralStatus(context, referral.referralId, ReferralStatus.DECLINED, referralOptions)

          if (declineResult.isErr()) {
            logger.error(context, TAG, 'Error declining duplicate referral.', {
              referral,
              error: declineResult.error
            })

            result.num_errors = result.num_errors + 1
          }
          else {
            result.num_declined = result.num_declined + 1
          }
        }
      } else {
        logger.info(context, TAG, `process referral_id: ${referral.referralId}`, {
          referral,
        })

        if (referral.referralStatus === ReferralStatus.REQUESTED) {
          logger.info(context, TAG, `process referral_status: ${referral.referralStatus}`, {
            referral,
            new_status: ReferralStatus.ACCEPTED,
          })

          if (dryRun) {
            logger.info(context, TAG, 'Dry run, skipping update of inbound referral status.', {
              referral,
              new_status: ReferralStatus.ACCEPTED,
            })
          }
          else {
            const acceptResult = await updateInboundReferralStatus(context, referral.referralId, ReferralStatus.ACCEPTED, referralOptions)

            if (acceptResult.isErr()) {
              logger.error(context, TAG, 'Error accepting referral.', {
                referral,
                error: acceptResult.error
              })

              result.num_errors = result.num_errors + 1
            }
            else {
              result.num_accepted = result.num_accepted + 1
            }
          }
        }
      }
      result.num_processed = result.num_processed + 1
    }

    // log the number of referrals processed
    logger.info(context, TAG, `Processed ${result.num_processed} referrals.`, {
      ...result,
    })

    if (sourceContext) {
      //
      // New context must be destroyed.
      //
      const destroyResult = await destroySourceReferralContext(context, source, sourceContext)

      if (destroyResult.isErr()) {
        logger.error(context, TAG, 'Error destroying Caloptima Connect context.', {
          error: destroyResult.error,
        })
      }
    }
    return ok(result)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export interface ProcessAcceptedReferralsResult {
  num_processed: number,
  num_in_progress: number,
  num_errors: number,
}

/**
 * Process 'accepted' referrals. 'accepted' referrals which have an appointment schedule transition to the 'in-progress' state.
 * 
 * @param context 
 * @param source 
 * @param dryRun 
 * @returns 
 */
export async function processAcceptedReferrals(context: IContext, source: Sources, dryRun?: boolean): Promise<Result<ProcessAcceptedReferralsResult, ErrCode>> {
  const { logger } = context
  const TAG = [...MTAG, 'processAcceptedReferrals']

  try {
    //
    // Get referrals with an 'accepted' status which should transition to 'in-progress'.
    //
    const getReferralsResult = await getNewInProgressReferrals(context, {
      sources: source,
    })

    if (getReferralsResult.isErr()) {
      logger.error(context, TAG, 'Error fetching referrals', { error: getReferralsResult.error })

      return err(getReferralsResult.error)
    } else {
      logger.info(context, TAG, `Got ${getReferralsResult.value.length} new In Progress referrals.`)
    }

    const sourceContextResult = await createSourceReferralContext(context, source)

    if (sourceContextResult.isErr()) {
      logger.error(context, TAG, 'Error creating source referral context.', {
        source,
        error: sourceContextResult.error,
      })

      return err(sourceContextResult.error)
    }

    const sourceContext = sourceContextResult.value

    const referralOptions = {
      dryRun: dryRun ?? false,
      ...(sourceContext && { sourceContext, })
    }

    const referrals = getReferralsResult.value

    const result: ProcessAcceptedReferralsResult = {
      num_processed: 0,
      num_in_progress: 0,
      num_errors: 0,
    }

    for (let referral of referrals) {
      logger.info(context, TAG, `process referral_id: ${referral.referralId}`, {
        referral,
      })

      if (referral.referralStatus === ReferralStatus.ACCEPTED) {
        logger.info(context, TAG, `process referral_status: ${referral.referralStatus}`, {
          referral,
          new_status: ReferralStatus.IN_PROGRESS,
        })

        if (!dryRun) {
          const inProgressResult = await updateInboundReferralStatus(context, referral.referralId, ReferralStatus.IN_PROGRESS, referralOptions)

          if (inProgressResult.isErr()) {
            logger.error(context, TAG, 'Error transition referral to in-progress.', {
              referral,
              error: inProgressResult.error 
            })

            result.num_errors = result.num_errors + 1
          }
          else {
            result.num_in_progress = result.num_in_progress + 1
          }
        }
      }
      result.num_processed = result.num_processed + 1
    }

    logger.info(context, TAG, `Processed ${result.num_processed} referrals.`, {
      ...result,
    })

    if (sourceContext) {
      //
      // New context must be destroyed.
      //
      const destroyResult = await destroySourceReferralContext(context, source, sourceContext)

      if (destroyResult.isErr()) {
        logger.error(context, TAG, 'Error destroying Caloptima Connect context.', {
          error: destroyResult.error,
        })
      }
    }

    return ok(result)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export interface ProcessInProgressReferralsResult {
  num_processed: number,
  num_completed: number,
  num_errors: number,
}

/**
 * Process 'in-progress' referrals. 'in-progress' referrals which have an appointment completed transition to the 'completed' state.
 * 
 * @param context 
 * @param source 
 * @param dryRun 
 * @returns 
 */
export async function processInProgressReferrals(context: IContext, source: Sources, dryRun?: boolean): Promise<Result<ProcessInProgressReferralsResult, ErrCode>> {
  const { logger } = context
  const TAG = [...MTAG, 'processInProgressReferrals']

  try {
    //
    // Get 'in-progress' referrals which should be considered 'completed'
    //
    const getReferralsResult = await getNewCompletedReferrals(context, {
      sources: source,
    })

    if (getReferralsResult.isErr()) {
      logger.error(context, TAG, 'Error fetching referrals', { error: getReferralsResult.error })

      return err(getReferralsResult.error)
    } else {
      logger.info(context, TAG, `Got ${getReferralsResult.value.length} new Completed referrals.`)
    }

    const sourceContextResult = await createSourceReferralContext(context, source)

    if (sourceContextResult.isErr()) {
      logger.error(context, TAG, 'Error creating source referral context.', {
        source,
        error: sourceContextResult.error,
      })

      return err(sourceContextResult.error)
    }

    const sourceContext = sourceContextResult.value

    const referralOptions = {
      dryRun: dryRun ?? false,
      ...(sourceContext && { sourceContext, })
    }

    const referrals = getReferralsResult.value

    const result: ProcessInProgressReferralsResult = {
      num_processed: 0,
      num_completed: 0,
      num_errors: 0,
    }

    for (let referral of referrals) {
      logger.info(context, TAG, `process referral_id: ${referral.referralId}`, {
        referral,
      })

      if (referral.referralStatus === ReferralStatus.IN_PROGRESS) {
        logger.info(context, TAG, `process referral_status: ${referral.referralStatus}`, {
          referral,
          new_status: ReferralStatus.COMPLETED,
        })

        if (!dryRun) {
          const updateResult = await updateInboundReferralStatus(context, referral.referralId, ReferralStatus.COMPLETED, {
            ...referralOptions,
            appointmentDate: referral.appointmentDate,
          })

          if (updateResult.isErr()) {
            logger.error(context, TAG, 'Error transition referral to in-progress.', {
              referral,
              error: updateResult.error 
            })

            result.num_errors = result.num_errors + 1
          }
          else {
            result.num_completed = result.num_completed + 1
          }
        }
      }
      result.num_processed = result.num_processed + 1
    }

    logger.info(context, TAG, `Processed ${result.num_processed} referrals.`, {
      ...result,
    })

    if (sourceContext) {
      //
      // New context must be destroyed.
      //
      const destroyResult = await destroySourceReferralContext(context, source, sourceContext)

      if (destroyResult.isErr()) {
        logger.error(context, TAG, 'Error destroying Caloptima Connect context.', {
          error: destroyResult.error,
        })
      }
    }

    return ok(result)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export interface ProcessCompletedReferralsResult {
  num_processed: number,
  num_errors: number,
}

/**
 * Process 'completed' referrals. This may imply creating an "output referral" for a "medically tailored meal". This is dependant upon the referral source.
 * 
 * @param context 
 * @param source 
 * @param dryRun 
 */
export async function processCompletedReferrals(context: IContext, source: Sources, dryRun?: boolean): Promise<Result<ProcessCompletedReferralsResult, ErrCode>> {
  const { logger } = context
  const TAG = [...MTAG, 'processCompletedReferrals']

  try {
    const result: ProcessCompletedReferralsResult = {
      num_processed: 0,
      num_errors: 0,
    }

    if (source === Sources.CalOptima) {
      //
      // Delegate to source specific handling which may grant "medically tailored meals".
      //
      const getResult = await getActionableReferrals(context, { sources: source })

      if (getResult.isErr()) {
        logger.error(context, TAG, 'Error getting actionable referrals.', {
          source,
          error: getResult.error,
        })

        return err(getResult.error)
      }

      const referrals = getResult.value

      logger.info(context, TAG, `Got ${referrals.length} actionable referrals.`)

      const sourceContextResult = await createSourceReferralContext(context, source)

      if (sourceContextResult.isErr()) {
        logger.error(context, TAG, 'Error creating source referral context.', {
          source,
          error: sourceContextResult.error,
        })

        return err(sourceContextResult.error)
      }

      const sourceContext = sourceContextResult.value

      for (const referral of referrals) {
        const performResult = await performReferralActions(context, {
          referralId: referral.referralId,
          patientExternalId: referral.patientExternalId,
          referralExternalId: referral.referralExternalId,
          identityId: referral.identityId,
          questionnaireId: referral.questionnaireId,
        }, {
          sourceContext,
        })

        if (performResult.isErr()) {
          logger.error(context, TAG, 'Error performing referral actions.', {
            referral,
            error: performResult.error
          })

          result.num_errors = result.num_errors + 1
        }
        result.num_processed = result.num_processed + 1
      }

      logger.info(context, TAG, `Processed ${result.num_processed} referrals.`, {
        ...result,
      })

      if (sourceContext) {
        //
        // New context must be destroyed.
        //
        const destroyResult = await destroySourceReferralContext(context, source, sourceContext)

        if (destroyResult.isErr()) {
          logger.error(context, TAG, 'Error destroying Caloptima Connect context.', {
            error: destroyResult.error,
          })
        }
      }

      if (result.num_errors) {
        logger.error(context, TAG, 'Errors encountered performing referral actions.', result)
      } else {
        logger.info(context, TAG, 'Processed all referrals successfully.', result)
      }

      return ok(result)
    }
    else {
      logger.info(context, TAG, 'Source has no action for completed / unactioned referrals.', {
        source,
      })

      return ok(result)
    }
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export default {
  createInboundReferral,
  selectInboundReferral,
  updateInboundReferralStatus,
  processRequestedReferrals,
  processAcceptedReferrals,
  processInProgressReferrals,
  processCompletedReferrals,
}
