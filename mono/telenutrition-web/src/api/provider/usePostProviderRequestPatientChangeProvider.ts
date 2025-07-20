import usePost from 'api/usePost';

interface PostProviderRequestPatientChangeProviderParams {
  payload: {
    patientId: number;
    reason: string;
    note?: string;
  };
}

export default function usePostProviderRequestPatientChangeProvider() {
  return usePost<PostProviderRequestPatientChangeProviderParams, never>({
    path: '/provider/request/patient-change-provider',
  });
}
