import type { AppointmentEncounterRecord, AppointmentRecord } from '@mono/telenutrition/lib/types';
import usePost from 'api/usePost';

interface PutSubmitAppointmentEncounterParams {
  payload: { chartingData: Record<string, any> };
}

export type FormDataError = {
  key: string;
  value: any;
  error: string;
};

type PutSubmitAppointmentEncounterResult = {
  appointment: AppointmentRecord,
  appointmentEncounter: AppointmentEncounterRecord
}

export default function usePutSubmitAppointmentEncounter(encounterId: number) {
  return usePost<PutSubmitAppointmentEncounterParams, PutSubmitAppointmentEncounterResult>({
    path: `/appointment-encounter/${encounterId}/submit`,
    method: 'put',
    invalidateCacheKeys: [
      ['appointment-encounter'],
      ['provider', 'patients'],
      ['provider', 'appointments'],
    ],
  });
}
