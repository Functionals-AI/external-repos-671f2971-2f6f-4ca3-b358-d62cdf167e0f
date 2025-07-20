import usePost from '../usePost';

export default function usePostLogout() {
  return usePost<{ payload: {} }, void>({
    path: '/auth/logout',
    invalidateCacheKeys: ['*'],
  });
}
