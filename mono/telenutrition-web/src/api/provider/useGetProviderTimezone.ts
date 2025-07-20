import useFetch, { UseFetchTypes } from 'hooks/useFetch';
import useGet from '../useGet';

export type UseGetProviderTimezoneResult = {
  timezone: string;
};

export const FETCH_PROVIDER_TIMEZONE_QUERY_KEY = ['provider', 'timezone'];

export default function useGetProviderTimezone(doInitialGet?: boolean) {
  return useGet<UseGetProviderTimezoneResult>({
    path: '/provider/timezone',
    doInitialGet,
  });
}

export function useFetchProviderTimezone() {
  return useFetch<UseFetchTypes<never, UseGetProviderTimezoneResult>>({
    path: '/provider/timezone',
    queryKey: FETCH_PROVIDER_TIMEZONE_QUERY_KEY,
  });
}
