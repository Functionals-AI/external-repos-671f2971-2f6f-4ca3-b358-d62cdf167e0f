import { Err, Result } from 'neverthrow';

import { ErrCode } from '../../error';

import { IContext } from '../../context';
import { ActionableReferral, ScheduleReferralRecord, ReferralStatus, ReferralConfig } from '../store';

import Demo from './demo';

export enum Action {
  APPOINTMENT_COMPLETED = 'APPOINTMENT_COMPLETED',
}

export type OnStatusChangeOptions = {
  appointmentDate?: Date;
};

export type OnActionOptions = {
  // This is empty for now but it's reasonable to expect future
  // sources to require additional data for actions and this allows us to
  // not change the interface when that happens.
};

export interface ProcessReferralsCallbacks {
  onStateChange(
    context: IContext,
    referral: ScheduleReferralRecord,
    newStatus: ReferralStatus,
    options?: OnStatusChangeOptions,
  ): Promise<Result<undefined, ErrCode>>;

  onAction(
    context: IContext,
    referral: ActionableReferral,
    action: Action,
    options?: OnActionOptions,
  ): Promise<Result<undefined, ErrCode>>;

  destroy(context: IContext): Promise<Result<void, ErrCode>>;
}

export type CallbackCreationResults = {
  callbacks: Record<string, ProcessReferralsCallbacks>;

  // If we failed to create the callbacks for a source we need to skip
  // processing that source
  skipSources: string[];

  errors: ErrCode[];
};

const createCallbackRegistry: Record<
  string,
  (context: IContext) => Promise<Result<ProcessReferralsCallbacks, ErrCode>>
> = {
  demo: Demo.createCallback,
};

export async function createCallbacks(
  context: IContext,
  referralConfigs: Record<string, ReferralConfig>,
): Promise<CallbackCreationResults> {
  const callbacks: Record<string, ProcessReferralsCallbacks> = {};
  const errors: ErrCode[] = [];
  const skipSources: string[] = [];

  for (const source in referralConfigs) {
    if (createCallbackRegistry[source]) {
      const result = await createCallbackRegistry[source](context);

      if (result.isErr()) {
        errors.push(result.error);
        skipSources.push(source);
      } else {
        callbacks[source] = result.value;
      }
    }
  }

  return {
    callbacks,
    skipSources,
    errors,
  };
}

export default {
  createCallbacks,
  Action,
};
