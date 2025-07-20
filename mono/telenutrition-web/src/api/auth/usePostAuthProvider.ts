import usePost from '../usePost';
import { PostAuthReturn } from './types';

interface UsePostAuthProviderParams {
  payload: { code: string };
}

type UsePostAuthProviderReturn = PostAuthReturn;

export default function usePostAuthProvider() {
  return usePost<UsePostAuthProviderParams, UsePostAuthProviderReturn>({
    path: '/auth/provider',
  });
}
