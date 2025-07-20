import type { AppointmentEncounterRecord } from '@mono/telenutrition/lib/types';
import usePost from 'api/usePost';

type SurveyQuestionSchema = any;

interface CreateAppointmentEncounterParams {
  payload: {
    appointmentId: number;
    chartingData?: Record<string, SurveyQuestionSchema>;
  };
}

interface AppointmentEncounterReturn {
  encounter: AppointmentEncounterRecord;
}

export default function usePostCreateAppointmentEncounter() {
  return usePost<CreateAppointmentEncounterParams, AppointmentEncounterReturn>({
    path: '/appointment-encounter/create',
    method: 'post',
    invalidateCacheKeys: [
      ['appointment-encounter'],
      ['provider', 'patients'],
      ['provider', 'appointments'],
    ],
  });
}
