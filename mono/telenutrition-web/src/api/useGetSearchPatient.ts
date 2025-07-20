import useGet from './useGet';
import type { PatientRecord } from '@mono/telenutrition/lib/types';

interface UseGetSearchPatientsParams {
  patientId: number;
}

export type SearchPatientRecord = PatientRecord & { hasScheduledAppointment: boolean };

interface UseGetSearchPatientsResult {
  patient: SearchPatientRecord;
}

type UseGetSerachPatientParams =
  | {
      params: UseGetSearchPatientsParams;
    }
  | {
      doInitialGet: false;
    };

export default function useGetSearchPatient(params: UseGetSerachPatientParams) {
  return useGet<UseGetSearchPatientsResult, UseGetSearchPatientsParams>({
    path: '/scheduling/search/patients',
    ...params,
  });
}
