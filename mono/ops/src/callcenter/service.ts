import { Result, err, ok } from 'neverthrow';

import { ErrCode } from '@mono/common/lib/error';
import { IContext } from '@mono/common/lib/context';
import Store from './store';
import { InsertReferralLeadsResult as CreateReferralLeadsResult } from './store'

export { InsertReferralLeadsResult as CreateReferralLeadsResult } from './store'

const MTAG = ['telenutrition', 'callcenter', 'service'];

export async function createReferralLeads(context: IContext, callListId: string, accountId: number): Promise<Result<CreateReferralLeadsResult, ErrCode>> {
  const tag = [...MTAG, 'createReferralLeads'];
  const { logger } = context;

  try {
    const insertResult = await Store.insertReferralLeads(context, callListId, accountId);
    if (insertResult.isErr()) {
      logger.error(context, tag, 'error inserting referral leads', { callListId, accountId, });

      return err(ErrCode.SERVICE);
    }
    return ok(insertResult.value);
  } catch (e) {
    logger.exception(context, tag, e);
    return err(ErrCode.EXCEPTION);
  }
}

export default {
  createReferralLeads,
};
