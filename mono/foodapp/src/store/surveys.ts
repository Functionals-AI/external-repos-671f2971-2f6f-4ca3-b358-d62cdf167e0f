import { err, ok, Result } from "neverthrow";
import { RowDataPacket } from "mysql2";

import { ErrCode } from "@mono/common/lib/error";
import { IContext } from "@mono/common/lib/context";

const TAG = `app.store.surveys`;

interface SurveyResponseMaxRow {
  response_time: Date
}

async function fetchLastSurveyQuestionCompletion(
  context: IContext,
  question: string,
  identityId: number
): Promise<Result<Date, ErrCode>> {
  const { mysql: { reader }, logger, config } = context

  if (config.isDevenv) return err(ErrCode.NOT_FOUND)

  try {
    const pool = await reader();
    const [rows] = await pool.query<SurveyResponseMaxRow[] & RowDataPacket[]>(
      `
      SELECT
        max(response_time) as response_time
      FROM tenants.survey_response
      WHERE question = ?
      AND user_id IN (
        SELECT id
        FROM tenants.go_users
        WHERE ta_identity_id = ?
      );
    `,
      [question, identityId]
    )

    if (rows.length > 0) {
      return ok(rows[0]['response_time'])
    }
    return err(ErrCode.NOT_FOUND)
  } catch (e) {
    logger.exception(context, `${TAG}.fetchLastSurveyQuestionCompletion`, e)
    return err(ErrCode.EXCEPTION);
  }
}

export default {
  fetchLastSurveyQuestionCompletion,
};
