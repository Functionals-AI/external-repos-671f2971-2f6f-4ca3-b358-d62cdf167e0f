import CancelAppointment from '../../../../modules/appointments/cancel-appointment';
import ErrorPageFull from '../../../../components/error-page-full';
import { useTranslation } from 'react-i18next';
import useGetQueryParam from '../../../../hooks/useGetQueryParam';
import Loading from '../../../../components/loading';

const CancelAppointmentPage = () => {
  const { t } = useTranslation();
  const idResult = useGetQueryParam('id');
  const tokenResult = useGetQueryParam('token');
  const isProviderResult = useGetQueryParam('is_provider');

  if (idResult.loading || tokenResult.loading || isProviderResult.loading) return <Loading />;

  if (!idResult.ok) {
    return (
      <ErrorPageFull
        link="/"
        message={
          t(
            'YouAreNotAuthorizedToViewAppointment',
            'You are not authorized to view or cancel this appointment',
          ) ?? undefined
        }
      />
    );
  }

  return (
    <CancelAppointment
      appointmentId={idResult.value}
      oneTimeToken={tokenResult.ok ? tokenResult.value : undefined}
      isProvider={isProviderResult.ok ? Boolean(isProviderResult.value) : undefined}
    />
  );
};

export default CancelAppointmentPage;
