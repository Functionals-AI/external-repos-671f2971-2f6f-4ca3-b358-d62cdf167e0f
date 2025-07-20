import usePost from '../usePost';
import { PostAuthReturn } from './types';

interface UsePostAuthReferralParams {
  payload: {
    referralCode: string;
    firstName: string;
    lastName: string;
  };
}

type UsePostAuthReferralReturn = PostAuthReturn<{ flowId?: number }>;

export default function usePostAuthReferral() {
  return usePost<UsePostAuthReferralParams, UsePostAuthReferralReturn>({
    method: 'post',
    path: '/auth/referral',
  });
}
