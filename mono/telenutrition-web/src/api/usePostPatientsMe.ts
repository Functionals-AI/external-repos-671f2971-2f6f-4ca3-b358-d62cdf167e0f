import type { PatientRecord } from '@mono/telenutrition/lib/types';
import usePost from './usePost';

interface UsePostPatientsMeParams {
  payload: {
    state: {
      state: string;
      phoneMobile?: string;
      email?: string;
      sex?: string;
      address?: string;
      address2?: string;
      city?: string;
      timezone?: string;
    };
  };
}

type UsePostPatientsMeReturn = PatientRecord

export default function usePostPatientsMe() {
  return usePost<UsePostPatientsMeParams, UsePostPatientsMeReturn>({
    method: 'post',
    path: '/scheduling/patients/me',
  });
}
