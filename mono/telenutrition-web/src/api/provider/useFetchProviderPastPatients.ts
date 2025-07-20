import { HouseholdMemberSchedulable } from 'api/types';
import useFetch, { UseFetchTypes } from 'hooks/useFetch';

type BasePaginationParams = {
  offset: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
};

export type FetchProviderPatientsResult = HouseholdMemberSchedulable[];

export type DaysSinceLastSessionOption = 7 | 14 | 30 | 90;

export type FetchProviderPatientsParams = BasePaginationParams & {
  daysSinceLastSession?: DaysSinceLastSessionOption;
  paymentMethodTypeIds?: string;
  patientIdNameQuery?: string;
};

export type Types = UseFetchTypes<FetchProviderPatientsParams, FetchProviderPatientsResult>;

export const path = '/provider/past-patients';

export const getFetchProviderPastPatientsQueryKey = (...props: any[]) => [
  'provider',
  'past-patients',
  ...props,
];

export function useFetchProviderPastPatients(params?: FetchProviderPatientsParams) {
  const queryKey = getFetchProviderPastPatientsQueryKey(
    params?.offset,
    params?.limit,
    params?.sortBy,
    params?.sortOrder,
    params?.daysSinceLastSession,
    params?.patientIdNameQuery,
    params?.paymentMethodTypeIds,
  );

  return useFetch<Types>({
    path,
    queryKey,
    options: {
      params: params,
    },
  });
}
