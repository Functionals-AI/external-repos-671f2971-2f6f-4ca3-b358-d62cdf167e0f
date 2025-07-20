import { err, ok, Result } from 'neverthrow'
import { IContext } from '@mono/common/lib/context'
import { Logger } from '@mono/common'
import { ErrCode } from '@mono/common/lib/error'
import Store from './store'

const MTAG = Logger.tag()

type SurveyResponseParameters = {
  appointmentId: number,
  patientId: number,
  score: number,
  data: any
}

export async function submitSurveyResponse(context: IContext, params: SurveyResponseParameters): Promise<Result<boolean, ErrCode>> {
  const TAG = [...MTAG, 'submitSurveyResponse']
  const {logger} = context

  const result = await Store.insertSurveyResponse(context, {
    patient_id: params.patientId,
    appointment_id: params.appointmentId,
    score: params.score,
    survey_data: params.data
  })

  if (result.isErr()) {
    logger.error(context, TAG, 'error saving survey response', { error: result.error })
    return err(result.error)
  }
  return ok(true)
}

export default {
  submitSurveyResponse
}