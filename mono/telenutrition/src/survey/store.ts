import { Result, err, ok } from 'neverthrow'

import { ErrCode } from '@mono/common/lib/error'
import { IContext } from '@mono/common/lib/context'
import * as zs from 'zapatos/schema'
import * as db from 'zapatos/db'

const MTAG = [ 'telenutrition', 'survey', 'store' ]

export type PatientSurveyInsertable = Omit<zs.telenutrition.schedule_patient_survey.Insertable, 'patient_survey_id'>

async function insertSurveyResponse(context: IContext, insertable: PatientSurveyInsertable): Promise<Result<boolean, ErrCode>> {
  const TAG = [ ...MTAG, 'insertSurveyResponse' ]
  const { store, logger } = context

  try {
    const pool = await store.writer()
    const result = await db.insert('telenutrition.schedule_patient_survey', insertable).run(pool)
    return ok(true)
  } catch (e) {
    if (db.isDatabaseError(e, 'IntegrityConstraintViolation_UniqueViolation')) {
      return err(ErrCode.ALREADY_EXISTS)
    }
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export default {
  insertSurveyResponse,
}