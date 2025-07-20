import { Err, err, ok, Result } from 'neverthrow'
import { ErrCode } from '../error'
import { IContext } from '../context'
import Logger from '../logger'

import * as db from 'zapatos/db'
import * as zs from 'zapatos/schema'

const MTAG = Logger.tag()

export interface AccountRecord {
  id: number
  name: string
  active: boolean
  efile: boolean
}

export function mapAccountRecord(record: zs.common.account.JSONSelectable): AccountRecord {
  return {
    id: record.account_id,
    name: record.name,
    active: record.active,
    efile: record.efile
  }
}

export async function getAccount(context: IContext, accountId: number): Promise<Result<AccountRecord, ErrCode>> {
  const TAG = [...MTAG, 'store.getAccount']
  const {store: {reader}, logger} = context

  try {
    const pool = await reader()
    const account = await db.selectOne('common.account', { account_id: accountId }).run(pool)

    if (account === undefined) {
      return err(ErrCode.NOT_FOUND)
    }

    return ok(mapAccountRecord(account))
  } catch(e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export default {
  getAccount
}
