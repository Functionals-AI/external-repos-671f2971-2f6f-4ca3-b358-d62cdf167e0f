import { JsonObject, task, TaskBuilder } from '@mono/common-flows/lib/builder';
import { IContext } from '@mono/common/lib/context';
import { ErrCode } from '@mono/common/lib/error';
import {
  Action,
  createCallbacks,
  OnStatusChangeOptions,
  ProcessReferralsCallbacks,
} from '@mono/common/lib/referral/sources';
import {
  getActionableReferrals,
  getNewAcceptedReferrals,
  getNewCompletedReferrals,
  getNewInProgressReferrals,
  getNewInvalidReferrals,
  getReferralConfigs,
  getScheduleReferral,
  ReferralStatus,
  ScheduleReferralRecord,
  updateScheduleReferralStatus,
} from '@mono/common/lib/referral/store';
import { err, ok, Result } from 'neverthrow';

const MTAG = ['telenutrition-flows', 'referral-lifecycle-process', 'tasks', 'referral-lifecycle-process'];

type ProcessRequestedReferralsResult = {
  num_processed: number;
  num_accepted: number;
  num_declined: number;

  errors: ErrCode[];
};

type ProcessAcceptedReferralsResult = {
  num_processed: number;
  num_in_progress: number;

  errors: ErrCode[];
};

type ProcessInProgressReferralsResult = {
  num_processed: number;
  num_completed: number;

  errors: ErrCode[];
};

type ProcessCompletedReferralsResult = {
  num_processed: number;
  num_no_action_available: number;

  errors: ErrCode[];
};

export type ProcessReferralsResult = {
  process_requested_result: ProcessRequestedReferralsResult;
  process_accepted_result: ProcessAcceptedReferralsResult;
  process_in_progress_result: ProcessInProgressReferralsResult;
  process_completed_result: ProcessCompletedReferralsResult;
};

/**
 * @internal
 *
 * Check referrals to manage their lifetime.
 * @param context
 * @param referrerCallbackMap
 * @param dryRun
 * @returns
 */
export async function processReferrals(
  context: IContext,
  referralCallbacks: Record<string, ProcessReferralsCallbacks>,
  sourcesToProcess: string[],
  dryRun: boolean,
): Promise<Result<ProcessReferralsResult, ErrCode>> {
  const { logger } = context;
  const TAG = [...MTAG, 'processReferrals'];

  try {
    const results: ProcessReferralsResult = {
      process_requested_result: {
        num_processed: 0,
        num_accepted: 0,
        num_declined: 0,

        errors: [],
      },
      process_accepted_result: {
        num_processed: 0,
        num_in_progress: 0,

        errors: [],
      },
      process_in_progress_result: {
        num_processed: 0,
        num_completed: 0,

        errors: [],
      },
      process_completed_result: {
        num_processed: 0,
        num_no_action_available: 0,

        errors: [],
      },
    };

    // 1. Process Requested Referrals
    const processRequestedReferralsResult = await processRequestedReferrals(
      context,
      sourcesToProcess,
      referralCallbacks,
      dryRun,
    );

    if (processRequestedReferralsResult.isOk()) {
      results.process_requested_result = processRequestedReferralsResult.value;
    } else {
      logger.error(context, TAG, 'Error processing requested referrals.', {
        error: processRequestedReferralsResult.error,
      });

      results.process_requested_result.errors.push(processRequestedReferralsResult.error);
    }

    // 2. Process Accepted Referrals
    const processAcceptedReferralsResult = await processAcceptedReferrals(
      context,
      sourcesToProcess,
      referralCallbacks,
      dryRun,
    );

    if (processAcceptedReferralsResult.isOk()) {
      results.process_accepted_result = processAcceptedReferralsResult.value;
    } else {
      logger.error(context, TAG, 'Error processing accepted referrals.', {
        error: processAcceptedReferralsResult.error,
      });

      results.process_accepted_result.errors.push(processAcceptedReferralsResult.error);
    }

    // 3. Process In Progress Referrals
    const processInProgressReferralsResult = await processInProgressReferrals(
      context,
      sourcesToProcess,
      referralCallbacks,
      dryRun,
    );

    if (processInProgressReferralsResult.isOk()) {
      results.process_in_progress_result = processInProgressReferralsResult.value;
    } else {
      logger.error(context, TAG, 'Error processing in progress referrals.', {
        error: processInProgressReferralsResult.error,
      });

      results.process_in_progress_result.errors.push(processInProgressReferralsResult.error);
    }

    // 4. Process Completed Referrals
    const processCompletedReferralsResult = await processCompletedReferrals(
      context,
      sourcesToProcess,
      referralCallbacks,
      dryRun,
    );

    if (processCompletedReferralsResult.isOk()) {
      results.process_completed_result = processCompletedReferralsResult.value;
    } else {
      logger.error(context, TAG, 'Error processing completed referrals.', {
        error: processCompletedReferralsResult.error,
      });

      results.process_completed_result.errors.push(processCompletedReferralsResult.error);
    }

    return Promise.resolve(ok(results));
  } catch (e) {
    logger.exception(context, TAG, e);

    return err(ErrCode.EXCEPTION);
  }
}

type UpdateReferralStatusOptions = {
  callbacks?: ProcessReferralsCallbacks;
  onStateChangeOptions?: OnStatusChangeOptions;
};

/**
 * @internal
 *
 * @param context
 * @param referralId
 * @param status
 * @param options
 * @returns
 */
async function updateInboundReferralStatus(
  context: IContext,
  referralId: number,
  status: ReferralStatus,
  options: UpdateReferralStatusOptions,
): Promise<Result<ReferralStatus, ErrCode>> {
  const { logger } = context;
  const TAG = [...MTAG, 'updateInboundReferralStatus'];

  try {
    const getResult = await getScheduleReferral(context, referralId);

    if (getResult.isErr()) {
      logger.error(context, TAG, 'Error retrieving referral to update.', {
        referralId,
        status,
      });

      return err(getResult.error);
    }

    const referral = getResult.value;

    const { callbacks } = options;
    if (callbacks) {
      const callbackResult = await callbacks.onStateChange(context, referral, status, options.onStateChangeOptions);

      if (callbackResult.isErr()) {
        logger.error(context, TAG, 'Error processing callback.', {
          error: callbackResult.error,
        });

        return err(callbackResult.error);
      }
    } // A lack of callbacks is not an error and is expected for generic referrals

    const updateResult = await updateScheduleReferralStatus(context, referralId, referral.referralStatus, status);

    if (updateResult.isErr()) {
      logger.error(context, TAG, 'Error updating referral status.', {
        referral,
        status,
      });

      return err(updateResult.error);
    }

    return ok(status);
  } catch (e) {
    logger.exception(context, TAG, e);

    return err(ErrCode.EXCEPTION);
  }
}

async function processInvalidRequestedReferrals(
  context: IContext,
  sourcesToProcess: string[],
  referrerCallbacks: Record<string, ProcessReferralsCallbacks>,
  dryRun: boolean,
): Promise<ProcessRequestedReferralsResult> {
  const { logger } = context;
  const TAG = [...MTAG, 'processInvalidRequestedReferrals'];

  const result: ProcessRequestedReferralsResult = {
    num_processed: 0,
    num_accepted: 0,
    num_declined: 0,

    errors: [],
  };

  try {
    const invalidReferralsResult = await getNewInvalidReferrals(context, { sources: sourcesToProcess });

    if (invalidReferralsResult.isErr()) {
      result.errors.push(invalidReferralsResult.error);

      return result;
    }

    const invalidReferrals: ScheduleReferralRecord[] = invalidReferralsResult.value;

    logger.info(context, TAG, `Got ${invalidReferrals.length} invalid referrals.`);

    for (const referral of invalidReferrals) {
      const errors: string[] = [];
      if (!referral.referralExternalId) {
        errors.push('Missing `referralExternalId`.');
      }
      if (!referral.patientExternalId) {
        errors.push('Missing `patientExternalId`.');
      }

      referral.referralStatus = ReferralStatus.DECLINED;
      logger.info(context, TAG, `process referral_id: ${referral.referralId} is invalid, marking as declined.`, {
        referral,
        errors,
      });

      if (dryRun) {
        logger.info(context, TAG, 'Dry run, skipping update of inbound referral status.', {
          referral,
          new_status: ReferralStatus.DECLINED,
        });
      } else {
        const callback = referral.referralSource ? referrerCallbacks[referral.referralSource] : undefined;
        const declineResult = await updateInboundReferralStatus(context, referral.referralId, ReferralStatus.DECLINED, {
          callbacks: callback,
        });

        if (declineResult.isErr()) {
          logger.error(context, TAG, 'Error declining invalid referral.', {
            referral,
            error: declineResult.error,
          });

          result.errors.push(declineResult.error);
        }
      }
      result.num_declined = result.num_declined + 1;
      result.num_processed = result.num_processed + 1;
    }
  } catch (e) {
    logger.error(context, TAG, 'Failed to process invalid requested referrals.', e);

    result.errors.push(ErrCode.EXCEPTION);
  }

  return result;
}

/**
 * @internal
 *
 * Process 'requested' referrals, where:
 *  - Requested referrals which are duplicates transition to 'declined'
 *  - Requested referrals which are not duplicates transition to 'accepted.
 *
 * @param context
 * @param sourcesToProcess
 * @param referrerCallbackMap
 * @param dryRun
 * @returns
 */
export async function processRequestedReferrals(
  context: IContext,
  sourcesToProcess: string[],
  referrerCallbacks: Record<string, ProcessReferralsCallbacks>,
  dryRun: boolean,
): Promise<Result<ProcessRequestedReferralsResult, ErrCode>> {
  const { logger } = context;
  const TAG = [...MTAG, 'processRequestedReferrals'];

  const result = await processInvalidRequestedReferrals(context, sourcesToProcess, referrerCallbacks, dryRun);

  try {
    //
    // Get referrals for source which are have a 'requested' status.
    //
    const getReferralsResult = await getNewAcceptedReferrals(context, { sources: sourcesToProcess });
    if (getReferralsResult.isErr()) {
      logger.error(context, TAG, 'Error fetching referrals', { error: getReferralsResult.error });

      return err(getReferralsResult.error);
    }

    logger.info(context, TAG, `Got ${getReferralsResult.value.length} new referrals.`);

    const referrals = getReferralsResult.value;
    // referralSource should never be undefined as the query is already filtering by source.
    const sources = [...new Set(referrals.map((r) => r.referralSource))] as string[];

    for (const source of sources) {
      const callback = referrerCallbacks[source];
      const referralsForSource = referrals.filter((r) => r.referralSource === source);

      for (const referral of referralsForSource) {
        if (referral.isDuplicate) {
          logger.info(context, TAG, `process referral_status: ${referral.referralStatus}`, {
            referral,
            new_status: ReferralStatus.DECLINED,
          });

          if (dryRun) {
            logger.info(context, TAG, 'Dry run, skipping update of inbound referral status.', {
              referral,
              new_status: ReferralStatus.DECLINED,
            });
          } else {
            const referralOptions = {
              callbacks: callback,
            };
            const declineResult = await updateInboundReferralStatus(
              context,
              referral.referralId,
              ReferralStatus.DECLINED,
              referralOptions,
            );

            if (declineResult.isErr()) {
              logger.error(context, TAG, 'Error declining duplicate referral.', {
                error: declineResult.error,
              });

              return err(declineResult.error);
            }
          }
          result.num_declined = result.num_declined + 1;
        } else {
          logger.info(context, TAG, `process referral_id: ${referral.referralId}`, {
            referral,
          });

          if (referral.referralStatus === ReferralStatus.REQUESTED) {
            logger.info(context, TAG, `process referral_status: ${referral.referralStatus}`, {
              referral,
              new_status: ReferralStatus.ACCEPTED,
            });

            if (dryRun) {
              logger.info(context, TAG, 'Dry run, skipping update of inbound referral status.', {
                referral,
                new_status: ReferralStatus.ACCEPTED,
              });
            } else {
              const referralOptions = {
                callbacks: callback,
              };
              const acceptResult = await updateInboundReferralStatus(
                context,
                referral.referralId,
                ReferralStatus.ACCEPTED,
                referralOptions,
              );

              if (acceptResult.isErr()) {
                logger.error(context, TAG, 'Error accepting referral.', {
                  referral,
                });

                return err(acceptResult.error);
              }
            }
            result.num_accepted = result.num_accepted + 1;
          }
        }
        result.num_processed = result.num_processed + 1;
      }
    }

    return ok(result);
  } catch (e) {
    logger.exception(context, TAG, e);

    return err(ErrCode.EXCEPTION);
  }
}

/**
 * @internal
 *
 * @param context
 *  Process 'accepted' referrals. 'accepted' referrals which have an
 *  appointment schedule transition to the 'in-progress' state.
 * @param sourcesToProcess
 * @param referrerCallbacks
 * @param dryRun
 * @returns
 */
export async function processAcceptedReferrals(
  context: IContext,
  sourcesToProcess: string[],
  referrerCallbacks: Record<string, ProcessReferralsCallbacks>,
  dryRun: boolean,
): Promise<Result<ProcessAcceptedReferralsResult, ErrCode>> {
  const { logger } = context;
  const TAG = [...MTAG, 'processAcceptedReferrals'];

  const result: ProcessAcceptedReferralsResult = {
    num_processed: 0,
    num_in_progress: 0,

    errors: [],
  };

  try {
    const getNewInProgressReferralsResult = await getNewInProgressReferrals(context, {
      sources: sourcesToProcess,
    });

    if (getNewInProgressReferralsResult.isErr()) {
      logger.error(context, TAG, 'Error fetching referrals', { error: getNewInProgressReferralsResult.error });

      return err(getNewInProgressReferralsResult.error);
    } else {
      logger.info(context, TAG, `Got ${getNewInProgressReferralsResult.value.length} new In Progress referrals.`);
    }

    const referrals = getNewInProgressReferralsResult.value;
    // referralSource should never be undefined as the query is already filtering by source.
    const sources = [...new Set(referrals.map((r) => r.referralSource))] as string[];

    for (const source of sources) {
      const callback = referrerCallbacks[source];
      const referralsForSource = referrals.filter((r) => r.referralSource === source);

      for (const referral of referralsForSource) {
        logger.info(context, TAG, `process referral_id: ${referral.referralId}`, {
          referral,
        });

        logger.info(context, TAG, `process referral_status: ${referral.referralStatus}`, {
          referral,
          new_status: ReferralStatus.IN_PROGRESS,
        });

        if (!dryRun) {
          const referralOptions = {
            callbacks: callback,
          };

          const inProgressResult = await updateInboundReferralStatus(
            context,
            referral.referralId,
            ReferralStatus.IN_PROGRESS,
            referralOptions,
          );

          if (inProgressResult.isErr()) {
            logger.error(context, TAG, 'Error transition referral to in-progress.', {
              referral,
            });

            result.errors.push(inProgressResult.error);
          }
        }

        result.num_in_progress = result.num_in_progress + 1;
        result.num_processed = result.num_processed + 1;
      }
    }

    return ok(result);
  } catch (e) {
    logger.exception(context, TAG, e);

    return err(ErrCode.EXCEPTION);
  }
}

/**
 * @internal
 *
 * Process 'in-progress' referrals. 'in-progress' referrals which have an appointment completed transition to the 'completed' state.
 *
 * @param context
 * @param sourcesToProcess
 * @param referrerCallbackMap
 * @param dryRun
 * @returns
 */
export async function processInProgressReferrals(
  context: IContext,
  sourcesToProcess: string[],
  referrerCallbacks: Record<string, ProcessReferralsCallbacks>,
  dryRun: boolean,
): Promise<Result<ProcessInProgressReferralsResult, ErrCode>> {
  const { logger } = context;
  const TAG = [...MTAG, 'processInProgressReferrals'];

  const result: ProcessInProgressReferralsResult = {
    num_processed: 0,
    num_completed: 0,

    errors: [],
  };

  try {
    //
    // Get 'in-progress' referrals which should be considered 'completed'
    //
    const getReferralsResult = await getNewCompletedReferrals(context, {
      sources: sourcesToProcess,
    });

    if (getReferralsResult.isErr()) {
      logger.error(context, TAG, 'Error fetching referrals', { error: getReferralsResult.error });

      return err(getReferralsResult.error);
    } else {
      logger.info(context, TAG, `Got ${getReferralsResult.value.length} new Completed referrals.`);
    }

    const referrals = getReferralsResult.value;

    // referralSource should never be undefined as the query is already filtering by source.
    const sources = [...new Set(referrals.map((r) => r.referralSource))] as string[];

    for (const source of sources) {
      const callback = referrerCallbacks[source];
      const referralsForAccount = referrals.filter((r) => r.referralSource === source);

      for (const referral of referralsForAccount) {
        logger.info(context, TAG, `process referral_id: ${referral.referralId}`, {
          referral,
        });

        if (referral.referralStatus === ReferralStatus.IN_PROGRESS) {
          logger.info(context, TAG, `process referral_status: ${referral.referralStatus}`, {
            referral,
            new_status: ReferralStatus.COMPLETED,
          });

          if (!dryRun) {
            const updateResult = await updateInboundReferralStatus(
              context,
              referral.referralId,
              ReferralStatus.COMPLETED,
              {
                callbacks: callback,
                onStateChangeOptions: {
                  appointmentDate: referral.appointmentDate,
                },
              },
            );

            if (updateResult.isErr()) {
              logger.error(context, TAG, 'Error transition referral to in-progress.', {
                referral,
              });

              result.errors.push(updateResult.error);
            }
          }
          result.num_completed = result.num_completed + 1;
        }
        result.num_processed = result.num_processed + 1;
      }
    }
    return ok(result);
  } catch (e) {
    logger.exception(context, TAG, e);

    return err(ErrCode.EXCEPTION);
  }
}

/**
 * @internal
 *
 * Process 'completed' referrals. This may imply creating an "output referral" for a "medically tailored meal". This is dependant upon the referral source.
 *
 * @param context
 * @param sourcesToProcess
 * @param referrerCallbacks
 * @param dryRun
 * @returns
 */
export async function processCompletedReferrals(
  context: IContext,
  sourcesToProcess: string[],
  referralCallbacks: Record<string, ProcessReferralsCallbacks>,
  _dryRun: boolean,
): Promise<Result<ProcessCompletedReferralsResult, ErrCode>> {
  const { logger } = context;
  const TAG = [...MTAG, 'processCompletedReferrals'];

  const result: ProcessCompletedReferralsResult = {
    num_processed: 0,
    num_no_action_available: 0,

    errors: [],
  };

  try {
    //
    // Delegate to source specific handling which may grant "medically tailored meals".
    //
    const getResult = await getActionableReferrals(context, { sources: sourcesToProcess });

    if (getResult.isErr()) {
      logger.error(context, TAG, 'Error fetching actionable referrals.', { error: getResult.error });

      return err(getResult.error);
    }

    const referrals = getResult.value;

    logger.info(context, TAG, `Got ${referrals.length} actionable referrals.`);

    // referralSource should never be undefined as the query is already filtering by source.
    const sources = [...new Set(referrals.map((r) => r.referralSource))] as string[];

    for (const source of sources) {
      const callback = referralCallbacks[source];
      const referralsForSource = referrals.filter((r) => r.referralSource === source);

      if (callback) {
        for (const referral of referralsForSource) {
          const callbackResult = await callback.onAction(context, referral, Action.APPOINTMENT_COMPLETED);
          if (callbackResult.isOk()) {
            result.num_processed = result.num_processed + 1;
          } else {
            logger.error(context, TAG, 'Error fetching referral.', {
              error: callbackResult.error,
            });

            result.errors.push(callbackResult.error);
          }
        }
      } else {
        logger.warn(
          context,
          TAG,
          `Found ${referralsForSource.length} actionable referrals for source '${source}' but no callback was found.`,
        );

        result.num_no_action_available = result.num_no_action_available + referralsForSource.length;
      }
    }

    return ok(result);
  } catch (e) {
    logger.exception(context, TAG, e);

    return err(ErrCode.EXCEPTION);
  }
}

export interface ProcessRequestedGenericReferralsTaskOptions extends Omit<TaskBuilder, 'handler' | 'type'> {
  flowName: string;
  dryRun?: boolean;
  sources?: string[];
}

export function processReferralLifecyclesTaskBuilder(
  options: ProcessRequestedGenericReferralsTaskOptions
): TaskBuilder {
  const { flowName, dryRun } = options;
  return task({
    ...options,
    handler: async function (context: IContext): Promise<Result<JsonObject, ErrCode>> {
      const { logger } = context;
      const TAG = [...MTAG, flowName, 'processRequestedReferrals'];

      try {
        const referralConfigs = await getReferralConfigs(context, {
          sources: options.sources,
          withProcessEnabled: true,
          withCustomFlow: false,
        });

        if (referralConfigs.isErr()) {
          logger.error(context, TAG, 'Error getting referral configurations', {
            error: referralConfigs.error,
          });

          return err(referralConfigs.error);
        }

        const { callbacks, skipSources, errors } = await createCallbacks(context, referralConfigs.value);

        // Skip processing accounts that failed to create callbacks
        const sourcesToProcess = Object.keys(referralConfigs.value).filter((source) => !skipSources.includes(source));

        const result = await processReferrals(context, callbacks, sourcesToProcess, dryRun ?? false);

        if (result.isErr()) {
          logger.error(context, TAG, 'Service error', {
            error: result.error,
          });

          return err(result.error);
        }

        logger.info(context, TAG, 'Processing referrals results', { results: result.value });

        if (errors.length > 0) {
          logger.error(context, TAG, 'Error creating callbacks', {
            errors,
          });

          // Return the first error so it fails the task
          return err(errors[0]);
        }

        const process_errors = [
          ...result.value.process_requested_result.errors,
          ...result.value.process_accepted_result.errors,
          ...result.value.process_in_progress_result.errors,
          ...result.value.process_completed_result.errors,
        ];

        if (process_errors.length > 0) {
          logger.error(context, TAG, `There was ${process_errors.length} errors while processing referrals`, {
            errors: process_errors,
          });

          return err(ErrCode.EXCEPTION);
        }

        return ok(result.value as any as JsonObject);
      } catch (e) {
        logger.exception(context, TAG, e);

        return err(ErrCode.EXCEPTION);
      }
    },
  });
}
