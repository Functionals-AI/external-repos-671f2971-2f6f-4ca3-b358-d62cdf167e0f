import { IContext } from "@mono/common/lib/context"
import '@mono/common/lib/zapatos/schema'
import { Result, err, ok } from "neverthrow"
import { ErrCode } from "@mono/common/lib/error"
import { getAccountMembershipCaseSQLQuery } from "./store/account"

export async function syncEligibilityAccounts(context: IContext): Promise<Result<true, ErrCode>> {
  const { mysql: { writer }, logger } = context

  const pool = await writer()

  try {
    const caseQueryResult = await getAccountMembershipCaseSQLQuery(context)
    if (caseQueryResult.isErr()) {
      return err(caseQueryResult.error)
    }

    const query = `
      UPDATE tenants.go_users_eligible SET account_id = ${caseQueryResult.value}
    `;

    await pool.query(query)
    return ok(true)
  } catch(e) {
    logger.exception(context, 'syncEligibilityAccounts', e);
    return err(ErrCode.EXCEPTION);
  }
}

export default {
  syncEligibilityAccounts
}
