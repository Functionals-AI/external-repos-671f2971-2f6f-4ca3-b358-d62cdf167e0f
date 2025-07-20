import { Household } from 'api/types';
import useFetch, { UseFetchTypes } from 'hooks/useFetch';

export type GetProviderPatientsResult = Household[];

export type Types = UseFetchTypes<never, GetProviderPatientsResult>;

export const path = '/provider/patients';

export const FETCH_PROVIDER_PATIENTS_QUERY_KEY = ['provider', 'patients'];

export function useFetchProviderPatients() {
  return useFetch<Types>({ path, queryKey: FETCH_PROVIDER_PATIENTS_QUERY_KEY });
}
