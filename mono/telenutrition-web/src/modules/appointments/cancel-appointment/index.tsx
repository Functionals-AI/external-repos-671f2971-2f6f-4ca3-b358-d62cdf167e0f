import useGetAppointmentById from '../../../api/useGetAppointmentById';
import Loading from '../../../components/loading';
import AlreadyCancelled from './already-cancelled';
import CancelAppointmentDisplay from './cancel-appointment-display';
import HeaderSubheader from '../../../components/header-subheader';
import FlowTransition from '../../../components/layouts/basic/transition';
import { useTranslation } from 'react-i18next';
import ApiGetError from '../../../components/api-get-error';
import useGetProviderTimezone from '../../../api/provider/useGetProviderTimezone';
import { appointmentStartHasPassed } from '../../../utils/appointment';
import AppointmentTimePassed from './appointment-time-passed';

interface CancelAppointmentWrapperProps {
  appointmentId: string;
  oneTimeToken?: string;
  isProvider?: boolean;
}

export default function CancelAppointmentWrapper({
  appointmentId,
  oneTimeToken,
  isProvider,
}: CancelAppointmentWrapperProps) {
  // if not provider, isLoading defaults to false and api call doesn't fire
  const { isLoading, data } = useGetProviderTimezone(!!isProvider);

  if (isLoading) return <Loading />;

  return (
    <CancelAppointment {...{ appointmentId, oneTimeToken, timezone: data?.timezone, isProvider }} />
  );
}

interface CancelAppointmentProps {
  appointmentId: string;
  oneTimeToken?: string;
  timezone?: string;
  isProvider?: boolean;
}

function CancelAppointment({
  oneTimeToken,
  timezone,
  isProvider,
  ...props
}: CancelAppointmentProps) {
  const appointmentId = parseInt(props.appointmentId);
  const { data, error, isLoading, refetch } = useGetAppointmentById({
    appointmentId,
    headerToken: oneTimeToken,
    params: { timezone: isProvider ? timezone : Intl.DateTimeFormat().resolvedOptions().timeZone },
  });
  const { t } = useTranslation();

  return (
    <FlowTransition>
      <div className="max-w-2xl m-auto py-8 space-y-6 px-8">
        <HeaderSubheader header={t('CancelAppointment', 'Cancel Appointment')} />
        <>
          {(() => {
            if (error) return <ApiGetError error={error} refetch={refetch} />;
            if (isLoading || !data) return <Loading />;
            if (data.appointment.status === 'x') return <AlreadyCancelled />;
            if (appointmentStartHasPassed(data.appointment))
              return (
                <AppointmentTimePassed data={data} type={isProvider ? 'provider' : 'patient'} />
              );
            return (
              <CancelAppointmentDisplay {...{ appointmentId, oneTimeToken, data, isProvider }} />
            );
          })()}
        </>
      </div>
    </FlowTransition>
  );
}
