import { AppointmentRecord } from 'api/types';
import { AppointmentEncounterRecord } from '@mono/telenutrition/lib/types';
import usePost from 'api/usePost';

interface PutResubmitAppointmentEncounterParams {
  payload: { chartingData: Record<string, any> };
}

export type FormDataError = {
  key: string;
  value: any;
  error: string;
};

type PutResubmitAppointmentEncounterResult = {
  appointment: AppointmentRecord,
  appointmentEncounter: AppointmentEncounterRecord
}

export default function usePutResubmitAppointmentEncounter(encounterId: number) {
  return usePost<PutResubmitAppointmentEncounterParams, PutResubmitAppointmentEncounterResult>({
    path: `/appointment-encounter/${encounterId}/resubmit`,
    method: 'put',
    invalidateCacheKeys: [
      ['appointment-encounter'],
      ['provider', 'patients'],
      ['provider', 'appointments'],
    ],
  });
}
