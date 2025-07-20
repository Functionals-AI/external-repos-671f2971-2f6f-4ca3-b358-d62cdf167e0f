import useGet from './useGet';
import type { RewardUser as RewardUserLib } from '@mono/telenutrition/lib/types';

export interface RewardUser extends RewardUserLib {
  meta: any;
}

type UseGetRewardsEarnedResult = {
  rewards: RewardUser[];
};

export default function useGetRewardsEarned() {
  return useGet<UseGetRewardsEarnedResult>({
    path: '/account/rewards',
  });
}
