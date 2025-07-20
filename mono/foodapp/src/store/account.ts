import { ErrCode } from '@mono/common/lib/error'
import { IContext } from '@mono/common/lib/context'
import { err, ok, Result } from 'neverthrow'

import * as db from 'zapatos/db'
import { Logger } from '@mono/common'

const MTAG = Logger.tag()

export async function getAccountMembershipCaseSQLQuery(context: IContext): Promise<Result<string, ErrCode>> {
  const TAG = [...MTAG, 'store.getAccountMemberships']
  const {store: {reader}, logger} = context

  try {
    const pool = await reader()

    const rows = await db.select('common.account_membership', {
      type: "Foodsmart",
      sql: db.conditions.isNotNull
    }).run(pool)

    const cases:  {sql: string, account_id: number}[] = []

    for (let row of rows) {
      // ANSI_QUOTES is not enabled, so replace column identifiers with backticks
      const sql = (row.sql || "").trim().replace(/"/g, '`');
      if (sql.length > 0) {
        cases.push({ account_id: row.account_id, sql })
      }
    }

    if (cases.length == 0) {
      return err(ErrCode.NOT_FOUND)
    }

    return ok(`
      CASE
        ${cases.map(c => `WHEN (${c.sql}) THEN ${c.account_id}`).join(" ")}
      END
    `);
  } catch(e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export default {
  getAccountMembershipCaseSQLQuery,
}