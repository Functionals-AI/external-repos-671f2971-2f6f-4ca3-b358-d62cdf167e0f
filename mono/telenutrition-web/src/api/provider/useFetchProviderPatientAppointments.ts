import {
  AppointmentRecord,
  AppEncounterData,
  CompleteAppEncounterData,
  HistoricalEncounterData,
} from 'api/types';
import useFetch, { UseFetchTypes } from 'hooks/useFetch';

type FetchProviderPatientAppointmentsParams = {
  limit?: number;
  includeEncounterData?: boolean;
  completeOnly?: boolean;
};

export type ProviderPatientAppointment = {
  appointment: AppointmentRecord;
  encounterData?:
    | HistoricalEncounterData
    | Omit<AppEncounterData, 'chartingConfig'>
    | CompleteAppEncounterData;
};
export type FetchProviderPatientAppointmentsReturn = {
  appointments: ProviderPatientAppointment[];
};

export const getFetchProviderPatientAppointmentsQueryKey = (patientId: number) => [
  'provider',
  'patients',
  patientId,
  'appointments',
];

export default function useFetchProviderPatientAppointments(
  patientId: number,
  params?: FetchProviderPatientAppointmentsParams,
) {
  return useFetch<
    UseFetchTypes<FetchProviderPatientAppointmentsParams, FetchProviderPatientAppointmentsReturn>
  >({
    path: `/provider/patients/${patientId}/appointments`,
    options: {
      params,
    },
    queryKey: getFetchProviderPatientAppointmentsQueryKey(patientId),
  });
}
