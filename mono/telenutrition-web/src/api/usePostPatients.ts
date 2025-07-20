import { FETCH_PROVIDER_PATIENTS_QUERY_KEY } from './provider/useFetchProviderPatients';
import type { PatientRecord } from '@mono/telenutrition/lib/types';
import usePost from './usePost';

interface UsePostPatientsParams {
  payload: {
    state: Record<string, any>;
    challenge?: Record<string, any>;
    userId?: number;
  };
}

type UsePostPatientsReturn = PatientRecord;

export default function usePostPatients() {
  return usePost<UsePostPatientsParams, UsePostPatientsReturn>({
    path: '/scheduling/patients',
    method: 'post',
    invalidateCacheKeys: [FETCH_PROVIDER_PATIENTS_QUERY_KEY],
  });
}
