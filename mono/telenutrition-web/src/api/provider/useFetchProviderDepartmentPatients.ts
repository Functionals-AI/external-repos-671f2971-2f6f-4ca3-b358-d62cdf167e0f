import { HouseholdMemberWithSchedulingInfo } from 'api/types';
import useFetch, { UseFetchTypes } from 'hooks/useFetch';

const FETCH_PROVIDER_DEPARTMENT_PATIENTS_QUERY_KEY = ['provider', 'department-patients'];

export type FetchProviderDepartmentPatientsParams = { query: string; scheduleDate?: string };
export type FetchProviderDepartmentPatientsResult = {
  patients: HouseholdMemberWithSchedulingInfo[];
};

type Types = UseFetchTypes<
  FetchProviderDepartmentPatientsParams,
  FetchProviderDepartmentPatientsResult
>;

export default function useFetchProviderDepartmentPatients(
  params: FetchProviderDepartmentPatientsParams,
) {
  return useFetch<Types>({
    path: '/provider/department-patients',
    queryKey: FETCH_PROVIDER_DEPARTMENT_PATIENTS_QUERY_KEY,
    options: {
      params,
    },
  });
}
