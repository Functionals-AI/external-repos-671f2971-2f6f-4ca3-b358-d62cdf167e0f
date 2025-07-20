import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import Loading from '../../../components/loading';
import ApiGetError from '../../../components/api-get-error';
import useGetRewardsEarned, { RewardUser } from '../../../api/useGetRewardsEarned';
import RewardCard from './reward-card';

export default function RewardsEarned() {
  const { t } = useTranslation();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const { data, isLoading, error, refetch } = useGetRewardsEarned();
  const router = useRouter();

  if (isLoading || error || !(data && data.rewards && data.rewards.length)) return null;

  return (
    <div>
      <h3 className="border-b-2 border-f-light-green py-2">
        {t('RewardsEarned', 'Rewards earned')}
      </h3>
      <div className="my-6 gap-6 flex flex-col overflow-y-scroll" style={{ maxHeight: '30rem' }}>
        <div className="flex flex-col gap-y-3">
          {data.rewards.map((item) => (
            <RewardCard key={item.rewardId} reward={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
