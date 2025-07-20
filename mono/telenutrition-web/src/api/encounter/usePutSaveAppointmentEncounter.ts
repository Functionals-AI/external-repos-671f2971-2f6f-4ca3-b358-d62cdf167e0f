import type { AppointmentEncounterRecord } from '@mono/telenutrition/lib/types';
import usePost from 'api/usePost';

type SurveyQuestionSchema = any;

export type PutUpdateAppointmentEncounterParams = {
  payload: {
    chartingData: Record<string, SurveyQuestionSchema>;
  };
};
type PutUpdateAppointmentEncounterResult = {
  encounter: AppointmentEncounterRecord;
};

export default function usePutUpdateAppointmentEncounter(encounterId: number) {
  return usePost<PutUpdateAppointmentEncounterParams, PutUpdateAppointmentEncounterResult>({
    path: `/appointment-encounter/${encounterId}/save`,
    method: 'put',
    // Do not invalidate cache keys... this should be in the background but not show any visible ux changes.
  });
}
