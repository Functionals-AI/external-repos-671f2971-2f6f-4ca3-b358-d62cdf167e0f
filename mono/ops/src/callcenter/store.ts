import { Result, ok, err } from 'neverthrow'
import { DateTime } from 'luxon'

import { IContext } from '@mono/common/lib/context'
import { ErrCode } from '@mono/common/lib/error'

const MTAG = ['ops', 'callcenter', 'store'];

export interface InsertReferralLeadsResult {
  num_leads: number,
  num_inserted: number,
}

/**
 * 
 * @param context 
 * @param callingListId 
 * @param accountId 
 * @returns 
 */
export async function insertReferralLeads(context: IContext, callingListId: string, accountId: number): Promise<Result<InsertReferralLeadsResult, ErrCode>> {
  const { logger, redshift, store: { writer } } = context

  const TAG = [...MTAG, 'insertReferralLeads'];

  try {
    const redshiftPool = await redshift()
    const selectLeadsQuery = `
SELECT
  II.identity_id,
  II.account_id AS account_id,
  II.eligible_id,
  IU.user_id,
  'available' as status,
  II.birthday AS dob,
  SP.patient_id AS patient_id,
  II.first_name,
  II.last_name,
  '' AS "group_id",
  '{' || GUE.mobile_phone || '}' AS phone,
  SP.email,
  TRIM(GUE.person_id) as member_id,
  '' as gender,
  TRIM(GUE.address) as address,
  '' as address2,
  TRIM(GUE.city) as city,
  GUE."state",
  GUE.zip_code as postal_code,
  NULL AS guardian_name,
  CASE WHEN LEN(JSON_EXTRACT_PATH_TEXT(GUE.raw_data, 'REFERRING_PROV_NPI')) > 0 THEN JSON_EXTRACT_PATH_TEXT(GUE.raw_data, 'REFERRED_BY') END as  provider,
  '' AS program,
  '' AS superpackage,
  '' AS special_program,
  '' AS last_appointment_date,
  0 AS followups_completed,
  0 AS followups_scheduled,
  GUE."language" as lang,
  '${callingListId}' as calling_list_id
  FROM fq_common_telenutrition.schedule_referral SR
  LEFT JOIN fq_common_telenutrition.iam_identity II ON SR.identity_id=II.identity_id
  LEFT JOIN fq_common_telenutrition.schedule_patient SP ON SP.identity_id=II.identity_id
  LEFT JOIN fq_common_telenutrition.iam_user IU ON IU.identity_id=II.identity_id
  LEFT JOIN fq_foodapp_tenants.go_users_eligible GUE ON GUE.id=II.eligible_id
WHERE
  SR.referral_status IN ('accepted')
  AND SR.account_id = ${accountId}
  AND IU.user_id IS NULL
  AND SP.patient_id IS NULL
  AND GUE.id NOT IN (SELECT eligible_id from fq_common_callcenter.lead WHERE calling_list_id='${callingListId}')
  AND SR.created_at < CURRENT_DATE
;
`
    const selectResult = await redshiftPool.query(selectLeadsQuery)
    const { rows: selectedRows } = selectResult
    const leads = Array.isArray(selectedRows) ? selectedRows : [selectedRows]

    logger.info(context, TAG, `Selected ${leads.length} referral leads.`, { 
      callingListId,
      accountId,
      leads,
    });

    if (leads.length === 0) {
      logger.info(context, TAG, 'No leads selected.')

      return ok({
        num_leads: 0,
        num_inserted: 0
      })
    }
    else {
      const wPool = await writer();

      for (const lead of leads) {
        lead['dob'] = DateTime.fromJSDate(lead['dob']).toFormat('yyyy-MM-dd')
      }

      const valueParams = leads.map((lead, i) => {
        var length = Object.values(lead).length
        var values = Object.values(lead).map((v, j) => `$${i * length + j + 1}`).join(',')
        return `(${values})`
      }).join(',')

      const values = leads.map((lead, i) => Object.values(lead)).flat()

      const insertQuery = `
INSERT INTO callcenter.lead (${Object.keys(leads[0])}) 
VALUES ${valueParams}
RETURNING lead_id
;
`

      logger.debug(context, TAG, 'insert query: ', {
        query: insertQuery,
      //  values,
      })

      const insertResult = await wPool.query(insertQuery, values)

      const { rows: insertedRows } = insertResult

      const result = {
        num_leads: leads.length,
        num_inserted: insertedRows.length,
      }

      logger.info(context, TAG, `Inserted referral leads`, result)

      return ok(result);
    }
  } 
  catch (e) {
    logger.exception(context, TAG, e);

    return err(ErrCode.EXCEPTION);
  }
}

export default {
  insertReferralLeads,
};
