import { IContext } from '../context'
import { ErrCode } from '../error'
import { Result, err, ok } from 'neverthrow'
import * as s from 'zapatos/schema'
import * as db from 'zapatos/db'

const MTAG = [ 'common', 'questionnaire', 'store' ]

export interface QuestionnaireRecord {
    questionnaire_id:	number,
    encounter_id?:	number,
    appointment_id:	number,
    patient_id:	number,
    provider_id:	number,
    questionnaire_type:	string,
    form_data:	any,
    determination_code:	string,
    determination_meta:	any,
    created_at:	string,
}

function mapQuestionnaireRecord(record: s.telenutrition.clinical_encounter_screening_questionnaire.JSONSelectable): QuestionnaireRecord {
    return {
        questionnaire_id: record.questionnaire_id,
        encounter_id: record.encounter_id ?? undefined,
        appointment_id: record.appointment_id,
        patient_id: record.patient_id,
        provider_id: record.provider_id,
        questionnaire_type: record.questionnaire_type,
        form_data: record.form_data,
        determination_code: record.determination_code,
        determination_meta: record.determination_meta,
        created_at: record.created_at,
    }
}

export async function getQuestionnaire(context: IContext, questionnaireId: number): Promise<Result<QuestionnaireRecord, ErrCode>> {
    const { logger, store: { reader } } = context
    const TAG = [ ...MTAG, 'getQuestionnaire']

    try {
        const pool = await reader()

        const questionnaire = await db.selectOne('telenutrition.clinical_encounter_screening_questionnaire', {
            questionnaire_id: questionnaireId,
        }).run(pool)

        if (questionnaire === undefined) {
            return err(ErrCode.NOT_FOUND)
        }

        return ok(mapQuestionnaireRecord(questionnaire))
    } catch (e) {
        logger.exception(context, 'TAG', e)
        return err(ErrCode.EXCEPTION)
    }
}

export default {
    getQuestionnaire
}