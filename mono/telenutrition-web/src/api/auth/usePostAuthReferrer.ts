import usePost from '../usePost';
import { PostAuthReturn } from './types';

interface UsePostAuthReferrerParams {
  payload: {
    state: {
      firstName: string;
      lastName: string;
      credentials?: string;
      orgId: number;
      email: string;
    };
  };
}

type UsePostAuthReferrerReturn = PostAuthReturn;

export default function usePostAuthReferrer() {
  return usePost<UsePostAuthReferrerParams, UsePostAuthReferrerReturn>({
    path: '/auth/referrer',
    method: 'post',
  });
}
