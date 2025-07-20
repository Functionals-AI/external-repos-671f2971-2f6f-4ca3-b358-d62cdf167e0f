import { Result, ok } from 'neverthrow';

import { ErrCode } from '../../../error';
import { IContext } from '../../../context';
import { Action, ProcessReferralsCallbacks, OnStatusChangeOptions, OnActionOptions } from '../index';
import { ActionableReferral, ScheduleReferralRecord, ReferralStatus } from '../../store';

// This is a demo source so we only log that the events happen and otherwise
// treat it as a no-op
class DemoLoggingCallbacks implements ProcessReferralsCallbacks {
  // Store any state of the callback here
  // `this` should store any needed source specific context (maybe a http client, or credentials)
  readonly MTAG = ['referral', 'sources', 'demo', 'DemoLoggingCallbacks'];

  async onStateChange(
    context: IContext,
    referral: ScheduleReferralRecord,
    newStatus: ReferralStatus,
    options?: OnStatusChangeOptions,
  ): Promise<Result<undefined, ErrCode>> {
    const { logger } = context;
    const TAG = [...this.MTAG, 'onStateChange'];

    logger.info(context, TAG, 'Referral state change', {
      referralId: referral.referralId,
      newStatus,
      options,
    });

    return ok(undefined);
  }

  async onAction(
    context: IContext,
    referral: ActionableReferral,
    action: Action,
    options?: OnActionOptions,
  ): Promise<Result<undefined, ErrCode>> {
    const { logger } = context;
    const TAG = [...this.MTAG, 'onAction'];

    logger.info(context, TAG, 'Referral action', {
      referralId: referral.referralId,
      action,
      options,
    });

    return ok(undefined);
  }

  async destroy(): Promise<Result<void, ErrCode>> {
    return ok(undefined);
  }
}

export async function createCallback(context: IContext): Promise<Result<ProcessReferralsCallbacks, ErrCode>> {
  // For this demo case we should never have an error case but
  // we would expect failures in real source in cases like failing to
  // get an auth token or something similar.
  return ok(new DemoLoggingCallbacks());
}

export default {
  createCallback,
};
