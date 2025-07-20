jest.mock('@mono/common/lib/referral/store', () => {
  const originalModule = jest.requireActual('@mono/common/lib/referral/store');

  return {
    ...originalModule,

    getNewInvalidReferrals: jest.fn(),
    getNewAcceptedReferrals: jest.fn(),
    getNewInProgressReferrals: jest.fn(),
    getNewCompletedReferrals: jest.fn(),
    getActionableReferrals: jest.fn(),
    getScheduleReferral: jest.fn(),
    updateScheduleReferralStatus: jest.fn(),
  };
});

import {
    getNewInvalidReferrals,
    getNewAcceptedReferrals,
    getNewInProgressReferrals,
    getNewCompletedReferrals,
    getActionableReferrals,
    getScheduleReferral,
    updateScheduleReferralStatus,
} from '@mono/common/lib/referral/store';

import { IContext } from '@mono/common/lib/context';
import { ErrCode } from '@mono/common/lib/error';
import { ProcessReferralsCallbacks } from '@mono/common/lib/referral/sources';
import { err, ok } from 'neverthrow';


import {
  processAcceptedReferrals,
  processCompletedReferrals,
  processInProgressReferrals,
  processReferrals,
  processRequestedReferrals,
} from './process-referral-lifecycles';

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  fatal: jest.fn(),
  trace: jest.fn(),
  exception: jest.fn(),
  tag: jest.fn(),
};

const context: IContext = {
  logger: mockLogger,
} as unknown as IContext;

const defaultReferral = {
  referralId: 1,
  referralSource: 'sourceA',
  referralStatus: 'requested',
  accountId: 1,
  referralDate: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  sourceData: {},
};

const referralCallbacks: Record<string, ProcessReferralsCallbacks> = {
  sourceA: {
    onStateChange: jest.fn().mockResolvedValue(ok(undefined)),
    onAction: jest.fn().mockResolvedValue(ok(undefined)),
    destroy: jest.fn().mockResolvedValue(ok(undefined)),
  },
};

const sources = ['sourceA'];

beforeEach(() => jest.clearAllMocks());

describe('processRequestedReferrals', () => {
  it('accepts a valid referral', async () => {
    (getNewInvalidReferrals as jest.Mock).mockResolvedValue(ok([]));
    (getNewAcceptedReferrals as jest.Mock).mockResolvedValue(ok([defaultReferral]));
    (getScheduleReferral as jest.Mock).mockResolvedValue(ok(defaultReferral));
    (updateScheduleReferralStatus as jest.Mock).mockResolvedValue(ok('accepted'));

    const result = await processRequestedReferrals(context, sources, referralCallbacks, false);
    console.log('Result:', result);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toStrictEqual({
      num_accepted: 1,
      num_declined: 0,
      num_processed: 1,
      errors: [],
    });

    expect(updateScheduleReferralStatus).toHaveBeenCalledTimes(1);
  });

  it("doesn't update the referral state in dry run mode", async () => {
    (getNewInvalidReferrals as jest.Mock).mockResolvedValue(ok([]));
    (getNewAcceptedReferrals as jest.Mock).mockResolvedValue(ok([defaultReferral]));
    (getScheduleReferral as jest.Mock).mockResolvedValue(ok(defaultReferral));
    (updateScheduleReferralStatus as jest.Mock).mockResolvedValue(ok('accepted'));

    const result = await processRequestedReferrals(context, sources, referralCallbacks, true);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toStrictEqual({
      num_accepted: 1,
      num_declined: 0,
      num_processed: 1,
      errors: [],
    });

    expect(updateScheduleReferralStatus).not.toHaveBeenCalled();
  });
});

describe('processAcceptedReferrals', () => {
  it('transitions referrals to IN_PROGRESS', async () => {
    const acceptedReferral = { ...defaultReferral, referralStatus: 'accepted' };
    (getNewInProgressReferrals as jest.Mock).mockResolvedValue(ok([acceptedReferral]));
    (getScheduleReferral as jest.Mock).mockResolvedValue(ok(acceptedReferral));
    (updateScheduleReferralStatus as jest.Mock).mockResolvedValue(ok('in-progress'));

    const result = await processAcceptedReferrals(context, sources, referralCallbacks, false);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toStrictEqual({
      num_in_progress: 1,
      num_processed: 1,
      errors: [],
    });

    expect(updateScheduleReferralStatus).toHaveBeenCalledTimes(1);
  });

  it("doesn't update the referral state in dry run mode", async () => {
    const acceptedReferral = { ...defaultReferral, referralStatus: 'accepted' };
    (getNewInProgressReferrals as jest.Mock).mockResolvedValue(ok([acceptedReferral]));
    (getScheduleReferral as jest.Mock).mockResolvedValue(ok(acceptedReferral));
    (updateScheduleReferralStatus as jest.Mock).mockResolvedValue(ok('in-progress'));

    const result = await processAcceptedReferrals(context, sources, referralCallbacks, true);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toStrictEqual({
      num_in_progress: 1,
      num_processed: 1,
      errors: [],
    });

    expect(updateScheduleReferralStatus).not.toHaveBeenCalled();
  });
});

describe('processInProgressReferrals', () => {
  it('transitions referrals to COMPLETED', async () => {
    const inProgressReferral = { ...defaultReferral, referralStatus: 'in-progress' };
    (getNewCompletedReferrals as jest.Mock).mockResolvedValue(ok([inProgressReferral]));
    (getScheduleReferral as jest.Mock).mockResolvedValue(ok(inProgressReferral));
    (updateScheduleReferralStatus as jest.Mock).mockResolvedValue(ok('completed'));

    const result = await processInProgressReferrals(context, sources, referralCallbacks, false);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toStrictEqual({
      num_completed: 1,
      num_processed: 1,
      errors: [],
    });
  });

  it("doesn't update the referral state in dry run mode", async () => {
    const inProgressReferral = { ...defaultReferral, referralStatus: 'in-progress' };
    (getNewCompletedReferrals as jest.Mock).mockResolvedValue(ok([inProgressReferral]));
    (getScheduleReferral as jest.Mock).mockResolvedValue(ok(inProgressReferral));
    (updateScheduleReferralStatus as jest.Mock).mockResolvedValue(ok('completed'));

    const result = await processInProgressReferrals(context, sources, referralCallbacks, true);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toStrictEqual({
      num_completed: 1,
      num_processed: 1,
      errors: [],
    });

    expect(updateScheduleReferralStatus).not.toHaveBeenCalled();
  });
});

describe('processCompletedReferrals', () => {
  it('processes completed referrals via callback', async () => {
    (getActionableReferrals as jest.Mock).mockResolvedValue(ok([defaultReferral]));
    const result = await processCompletedReferrals(context, sources, referralCallbacks, false);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toStrictEqual({
      num_processed: 1,
      num_no_action_available: 0,
      errors: [],
    });

    expect(updateScheduleReferralStatus).not.toHaveBeenCalled();
  });
});

describe('processReferrals', () => {
  it('succeeds when all phases succeed', async () => {
    const invalidReferral = {
      ...defaultReferral,
      referralId: 2,
    };

    (getNewInvalidReferrals as jest.Mock).mockResolvedValue(ok([invalidReferral]));
    (getNewAcceptedReferrals as jest.Mock).mockResolvedValue(ok([defaultReferral]));
    (getScheduleReferral as jest.Mock).mockResolvedValue(ok(defaultReferral));
    (updateScheduleReferralStatus as jest.Mock).mockResolvedValue(ok('accepted'));

    (getNewInProgressReferrals as jest.Mock).mockResolvedValue(
      ok([{ ...defaultReferral, referralStatus: 'accepted' }]),
    );
    (getNewCompletedReferrals as jest.Mock).mockResolvedValue(
      ok([{ ...defaultReferral, referralStatus: 'in-progress' }]),
    );
    (getActionableReferrals as jest.Mock).mockResolvedValue(ok([defaultReferral]));

    const result = await processReferrals(context, referralCallbacks, sources, false);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toStrictEqual({
      process_requested_result: {
        num_accepted: 1,
        num_declined: 1,
        num_processed: 2,
        errors: [],
      },
      process_accepted_result: { num_in_progress: 1, num_processed: 1, errors: [] },
      process_in_progress_result: { num_completed: 1, num_processed: 1, errors: [] },
      process_completed_result: { num_no_action_available: 0, num_processed: 1, errors: [] },
    });

    expect(updateScheduleReferralStatus).toHaveBeenCalledTimes(4);
  });

  it('returns partial results and includes errors when some phases fail', async () => {
    // processRequestedReferrals fails
    (getNewInvalidReferrals as jest.Mock).mockResolvedValue(ok([]));
    (getNewAcceptedReferrals as jest.Mock).mockResolvedValue(err(ErrCode.NOT_FOUND));

    // processAcceptedReferrals succeeds
    (getNewInProgressReferrals as jest.Mock).mockResolvedValue(
      ok([{ ...defaultReferral, referralStatus: 'accepted' }]),
    );
    (getScheduleReferral as jest.Mock).mockResolvedValue(ok(defaultReferral));
    (updateScheduleReferralStatus as jest.Mock).mockResolvedValue(ok('in-progress'));

    // processInProgressReferrals fails
    (getNewCompletedReferrals as jest.Mock).mockResolvedValue(err(ErrCode.EXCEPTION));

    // processCompletedReferrals succeeds
    (getActionableReferrals as jest.Mock).mockResolvedValue(ok([defaultReferral]));
    (referralCallbacks.sourceA.onAction as jest.Mock).mockResolvedValue(ok(undefined));

    const result = await processReferrals(context, referralCallbacks, sources, false);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toStrictEqual({
      process_requested_result: {
        num_accepted: 0,
        num_declined: 0,
        num_processed: 0,
        errors: [ErrCode.NOT_FOUND],
      },
      process_accepted_result: { num_in_progress: 1, num_processed: 1, errors: [] },
      process_in_progress_result: { num_completed: 0, num_processed: 0, errors: [ErrCode.EXCEPTION] },
      process_completed_result: { num_no_action_available: 0, num_processed: 1, errors: [] },
    });

    expect(updateScheduleReferralStatus).toHaveBeenCalledTimes(1);
  });

  it('does not update referral status in dry run mode', async () => {
    const invalidReferral = {
      ...defaultReferral,
      referralId: 2,
    };

    (getNewInvalidReferrals as jest.Mock).mockResolvedValue(ok([invalidReferral]));
    (getNewAcceptedReferrals as jest.Mock).mockResolvedValue(ok([defaultReferral]));
    (getScheduleReferral as jest.Mock).mockResolvedValue(ok(defaultReferral));
    (updateScheduleReferralStatus as jest.Mock).mockResolvedValue(ok('accepted'));

    (getNewInProgressReferrals as jest.Mock).mockResolvedValue(
      ok([{ ...defaultReferral, referralStatus: 'accepted' }]),
    );
    (getNewCompletedReferrals as jest.Mock).mockResolvedValue(
      ok([{ ...defaultReferral, referralStatus: 'in-progress' }]),
    );
    (getActionableReferrals as jest.Mock).mockResolvedValue(ok([defaultReferral]));

    const result = await processReferrals(context, referralCallbacks, sources, true);

    expect(result.isOk()).toBe(true);
    // In dry run mode we expect the stats to be correct but no updates to the db to be made.
    expect(result._unsafeUnwrap()).toStrictEqual({
      process_requested_result: {
        num_accepted: 1,
        num_declined: 1,
        num_processed: 2,
        errors: [],
      },
      process_accepted_result: { num_in_progress: 1, num_processed: 1, errors: [] },
      process_in_progress_result: { num_completed: 1, num_processed: 1, errors: [] },
      process_completed_result: { num_no_action_available: 0, num_processed: 1, errors: [] },
    });
    expect(updateScheduleReferralStatus).not.toHaveBeenCalled();
  });
});
