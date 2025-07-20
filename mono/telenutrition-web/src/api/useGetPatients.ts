import type { PatientRecord } from '@mono/telenutrition/lib/types';
import useGet from './useGet';

export interface UseGetPatientsReturn {
  patients: (PatientRecord & { isSelf: boolean })[];
}

export default function useGetPatients() {
  return useGet<UseGetPatientsReturn>({ path: '/scheduling/patients' });
}
