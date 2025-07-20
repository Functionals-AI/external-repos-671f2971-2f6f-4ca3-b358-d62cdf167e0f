import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import LabelAndValue from '../../provider/label-and-value';
import { RewardUser } from '../../../api/useGetRewardsEarned';

type RewardCardProps = {
  reward: RewardUser;
};

export default function RewardCard({ reward }: RewardCardProps) {
  const {
    reward: { description, correctable },
    userActivity: {
      activityAt
    },
    meta: { instacart_code_url: urls, instacart_code: codes },
    patient: { firstName, lastName },
  } = reward;
  const { t } = useTranslation();

  const getURL = (url: string) => (!url.includes('://') ? `https://${url}` : url);

  return (
    <div className="bg-white rounded-md flex flex-col p-6 gap-2 border border-neutral-150">
      <span className="text-lg">{description}</span>
      {correctable ? (
        <span className="text-lg">
          {t('CreditReceivedFromSupport', 'Credit received from Support')}
        </span>
      ) : (
        <span className="text-lg">
          {t('EarnedBy', 'Earned by {{firstName}} {{lastName}} on {{activityAt}}', {
            firstName,
            lastName,
            activityAt,
          })}
        </span>
      )}
      <LabelAndValue
        label={t('RedemptionLink', 'Redemption Link')}
        value={
          <>
            {Array.isArray(codes) ? (
              codes.map((code, ind) => (
                <>
                  <Link key={code} target="_blank" href={getURL(urls[ind])} className="ml-1 mr-1 text-blue-400 text-lg underline underline-offset-4">
                    {code}
                  </Link>
                  {ind < codes.length - 1 && ", "}
                </>
              ))
            ) : (
              <Link key={codes} target="_blank" href={getURL(urls)} className="ml-1 mr-1 text-blue-400 text-lg underline underline-offset-4">
                {codes}
              </Link>
            )}
          </>
        }
      />
    </div>
  );
}
