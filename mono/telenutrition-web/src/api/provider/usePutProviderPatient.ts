import { PatientProfile } from '@/features/provider/patient/profile/util';
import usePost from '../usePost';
import { FETCH_PROVIDER_PATIENTS_QUERY_KEY } from './useFetchProviderPatients';

type UsePutProviderPatientParams = {
  payload: {
    patientId: number;
    patient: PatientProfile;
  };
};

export default function usePutProviderPatient() {
  return usePost<UsePutProviderPatientParams>({
    method: 'put',
    path: '/provider/patient',
    invalidateCacheKeys: [FETCH_PROVIDER_PATIENTS_QUERY_KEY],
  });
}
