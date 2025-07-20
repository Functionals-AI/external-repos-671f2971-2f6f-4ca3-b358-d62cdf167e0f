import { useTranslation } from 'react-i18next';
import useGetQueryParam from '../../../../hooks/useGetQueryParam';
import Loading from '../../../../components/loading';
import { useRouter } from 'next/router';
import NPSAppointment from 'modules/appointments/nps';
import Link from 'next/link';
import Button from 'components/button';

const NPSAppointmentPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const idResult = useGetQueryParam('id');
  const tokenResult = useGetQueryParam('token');
  const score = useGetQueryParam('score');

  if (idResult.loading || tokenResult.loading || score.loading) return <Loading />;

  if (!idResult.ok || !tokenResult.ok) {
    return (
      <div className="max-w-7xl mx-auto text-center py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <h3>
            {t('ThereWasAnErrorWithYourRequest', 'There was an error with your request')}
        </h3>
        <div className="mt-8 flex justify-center">
          <div className="inline-flex rounded-md shadow">
            <Link href="/schedule/dashboard">
              <Button>{t('GoToYourDashboard', 'Go to your Dashboard')}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <NPSAppointment
      appointmentId={idResult.value}
      oneTimeToken={tokenResult.value}
      score={score.ok ? parseInt(score.value) : undefined}
    />
  );
};

export default NPSAppointmentPage;
