import { useRouter } from 'next/router';
import Button from '../../components/button';
import { useTranslation } from 'react-i18next';

export default function InitialCheckinRequired() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <div className="container flex flex-col items-center justify-center px-5 mx-auto mt-32">
      <div className="max-w-md text-center">
        <p className="text-lg font-semibold md:text-2xl pb-4">
          {t(
            'InitialCheckinRequiredTitle',
            'Initial visit must be completed before scheduling a follow up',
          )}
        </p>

        <p className="mb-8">
          {t(
            'InitialCheckinRequiredDescription',
            'If you are trying to schedule a new initial visit, please cancel or reschedule the previously scheduled visit.',
          )}
        </p>
        <Button key="btn-dashboard" onClick={() => router.push('/schedule/dashboard')} variant="secondary">
          {t('GoToDashboard', 'Go To Dashboard')}
        </Button>
      </div>
    </div>
  );
}
