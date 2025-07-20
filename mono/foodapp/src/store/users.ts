import { err, ok, Result } from "neverthrow";
import { RowDataPacket } from "mysql2";

import { ErrCode } from "@mono/common/lib/error";
import { IContext } from "@mono/common/lib/context";
import { getAccountMembershipCaseSQLQuery } from "./account";

const TAG = `app.store.users`;

export interface GoUserStoreRecord {
  id: number,
  ta_user_id: number | null,
  ta_identity_id: number | null,
  firstname: string | null,
  lastname: string | null,
  birthday: Date | null,
  email: string,
  zip: string | null,
  organization_id: number | null,
  suborganization_id: string | null,
  eligible_id: number | null,
  account_id: number | null,
}

async function fetchByUserId(
  context: IContext,
  id: number
): Promise<Result<GoUserStoreRecord, ErrCode>> {
  const { mysql: { reader }, logger } = context
  try {
    const pool = await reader();

    const accountCaseQueryResult = await getAccountMembershipCaseSQLQuery(context)
    if (accountCaseQueryResult.isErr()) {
      return err(accountCaseQueryResult.error)
    }
    const accountCase = accountCaseQueryResult.value

    const [users] = await pool.query<GoUserStoreRecord[] & RowDataPacket[]>(
      `
      SELECT
        go_users.id,
        go_users.ta_user_id,
        go_users.ta_identity_id,
        go_users.organization_id,
        go_users.suborganization_id,
        go_users.eligible_id,
        go_users.firstname,
        go_users.lastname,
        go_users.birthday,
        AES_DECRYPT(go_users.username_crypt, 'complicatedkeyforAESencryption') AS email,
        go_user_infos.zip,
        (${accountCase}) as account_id
      FROM tenants.go_users
      LEFT JOIN tenants.go_user_infos
      ON go_users.id = go_user_infos.user_id
      WHERE go_users.id = ?
    `,
      [id]
    )

    if (users.length > 0) {
      return ok(users[0])
    }
    return err(ErrCode.NOT_FOUND)
  } catch (e) {
    logger.exception(context, `${TAG}.fetchByUserId`, e)
    return err(ErrCode.EXCEPTION);
  }
}

export default {
  fetchByUserId,
};
