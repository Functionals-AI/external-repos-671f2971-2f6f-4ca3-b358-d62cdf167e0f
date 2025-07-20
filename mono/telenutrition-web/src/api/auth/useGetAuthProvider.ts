import useFetch, { UseFetchTypes } from 'hooks/useFetch';
import useGet from '../useGet';

export type GetAuthProviderResult = string;

export type Types = UseFetchTypes<never, GetAuthProviderResult>;

export const path = '/auth/provider';

export default function useGetAuthProvider() {
  return useGet<GetAuthProviderResult>({ path: '/auth/provider' });
}

export function useFetchAuthProvider() {
  return useFetch<Types>({
    path,
    queryKey: ['auth', 'provider'],
  });
}
