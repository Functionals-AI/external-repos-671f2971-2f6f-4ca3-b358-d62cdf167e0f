import type { ProviderRecord } from '@mono/telenutrition/lib/types';
import useFetch, { UseFetchTypes } from 'hooks/useFetch';

export type UseFetchPatientProvidersParams = { excludeSelf?: boolean };

export type UseFetchPatientProvidersResult = { providers: ProviderRecord[] };

type Types = UseFetchTypes<UseFetchPatientProvidersParams, UseFetchPatientProvidersResult>;

export default function useFetchPatientProviders(
  patientId: number,
  excludeSelf?: boolean | undefined,
) {
  return useFetch<Types>({
    path: `/scheduling/patients/${patientId}/providers`,
    queryKey: ['schedule', 'patient', patientId, 'providers', (!!excludeSelf).toString()],
    options: {
      params: { excludeSelf },
    },
  });
}
