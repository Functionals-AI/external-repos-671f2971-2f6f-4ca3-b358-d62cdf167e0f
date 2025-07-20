import { Result, err, ok } from 'neverthrow';

import { ErrCode } from '@mono/common/lib/error';
import { IContext } from '@mono/common/lib/context';
import * as zs from 'zapatos/schema';
import * as db from 'zapatos/db';

const MTAG = ['telenutrition', 'callcenter', 'store'];

type CCLeadRecord = {
  leadId: number;
  phone: string[];
};

function mapLeadRecord(record: zs.callcenter.lead.JSONSelectable): CCLeadRecord {
  return {
    leadId: record.lead_id,
    phone: record.phone,
  };
}

export async function fetchLeadById(context: IContext, id: number): Promise<Result<CCLeadRecord, ErrCode>> {
  const TAG = [...MTAG, 'fetchLeadById'];
  const { store, logger } = context;

  try {
    const pool = await store.reader();
    const record = await db
      .selectOne('callcenter.lead', {
        lead_id: id,
      })
      .run(pool);
    if (record === undefined) {
      return err(ErrCode.NOT_FOUND);
    }
    return ok(mapLeadRecord(record));
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

export async function insertNoShowLead(context: IContext, appointmentId: number, dbTxn: db.TxnClientForSerializable): Promise<Result<null, ErrCode>> {
  const tag = [...MTAG, 'insertNoShowLead'];
  const { store, logger } = context;

  try {   
    const callingListId = 'countycare_noshow_ondemand'

    const result = await dbTxn.query(
      `
        SELECT
            II.identity_id,
            II.account_id AS account_id,
            II.eligible_id,
            UP.user_id,
            'available' as status,
            II.birthday::text AS dob,
            SP.patient_id AS patient_id,
            II.first_name AS first_name,
            II.last_name AS last_name,
            '' AS "group_id",
            '{'|| CONCAT('+1', regexp_replace(SP.phone, '[^0-9]', '')) || '}' AS phone,
            SP.email,
            PM.member_id,
            SP.sex as gender,
            SP.address,
            '' as address2,
            SP.city,
            SP."state",
            SP.zip_code as postal_code,
            NULL AS guardian_name,
            SPR.first_name || ' ' || SPR.last_name AS provider,
            (SA.start_timestamp AT TIME ZONE SP.timezone || ' ' || SP.timezone) AS program,
            PMT.label AS superpackage,
            '' AS special_program,
            '' AS last_appointment_date,
            0 AS followups_completed,
            0 AS followups_scheduled,
            '' as lang,
            '${callingListId}' as calling_list_id
        FROM
            telenutrition.schedule_appointment SA
            LEFT JOIN telenutrition.schedule_patient SP ON SP.patient_id=SA.patient_id
            LEFT JOIN telenutrition.iam_identity II ON SP.identity_id=II.identity_id
            LEFT JOIN telenutrition.schedule_patient_payment_method PM ON PM.payment_method_id=SA.payment_method_id
            LEFT JOIN telenutrition.schedule_user_patient UP ON UP.patient_id=SP.patient_id
            LEFT JOIN telenutrition.schedule_provider SPR ON SA.provider_id=SPR.provider_id
            LEFT JOIN telenutrition.payment_method_type PMT ON PMT.payment_method_type_id=PM.payment_method_type_id
        WHERE
            SA.appointment_id = $1
            AND PMT.insurance_id = 18;`,
      [appointmentId],
    );

    logger.info(context, tag, `built ${result.rowCount} no show leads`, { appointmentId, result: result.rows });

    if (result.rows.length === 1) {
      const lead = result.rows[0];
      const values = Object.values(lead)
        .map((_, i) => `$${i + 1}`)
        .join(',');

      await db.upsert(
        'callcenter.calling_list', 
        { calling_list_id: callingListId }, 
        'calling_list_id', 
        { updateColumns: db.doNothing }
      ).run(dbTxn);

      await dbTxn.query(
        `
        INSERT INTO callcenter.lead (${Object.keys(lead)}) 
        VALUES (${values});
       `,
        Object.values(lead),
      );
      logger.info(context, tag, `inserted no show lead`, { appointmentId, result: result.rows });
    }

    return ok(null);
  } catch (e) {
    logger.exception(context, tag, e);
    return err(ErrCode.EXCEPTION);
  }
}

export default {
  fetchLeadById,
  insertNoShowLead,
};
