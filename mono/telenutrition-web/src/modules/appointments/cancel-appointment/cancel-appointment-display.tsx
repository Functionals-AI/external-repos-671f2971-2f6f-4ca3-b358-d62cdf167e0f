import CalendarIcon from '../../../components/calendar-icon';
import Button from '../../../components/button';
import Loading from '../../../components/loading';
import { useRouter } from 'next/router';
import { useState } from 'react';
import usePutCancelAppointment, { AppointmentCancelReason } from '../../../api/usePutCancelAppointment';
import { UseGetAppointmentByIdReturn } from '../../../api/useGetAppointmentById';
import { useModalManager } from '../../modal/manager';
import { ApiRequestError } from '../../../utils/errors';
import { ErrorIcon } from '../../modal/icons';
import { useTranslation } from 'react-i18next';
import ReasonSelector from '../../provider/dashboard/reason-selector';

interface CancelAppointmentDisplayProps {
  appointmentId: number;
  oneTimeToken?: string;
  data: UseGetAppointmentByIdReturn;
  isProvider?: boolean;
}

export default function CancelAppointmentDisplay({
  appointmentId,
  oneTimeToken,
  data,
  isProvider,
}: CancelAppointmentDisplayProps) {
  const { appointment } = data;
  const { t } = useTranslation();
  const router = useRouter();
  const [reason, setReason] = useState<AppointmentCancelReason>(() => {
    if (isProvider) return 'PROVIDER_UNAVAILABLE';
    const startAt = new Date(appointment.startAt);
    const now = new Date();
    const fourHoursLater = new Date();
    fourHoursLater.setHours(fourHoursLater.getHours() + 4);
    if (now < startAt && startAt < fourHoursLater) return 'LAST_MINUTE_CANCELLATION';
    else return 'PATIENT_CANCELLED';
  });
  const modalManager = useModalManager();

  const {
    post: putCancelAppointment,
    data: { isSubmitting },
  } = usePutCancelAppointment({ appointmentId });

  const [hasCanceled, setHasCanceled] = useState(false);

  const startAt = new Date(appointment.startAt);
  const month = startAt.toLocaleString('default', { month: 'long' });
  const day = startAt.getDate().toString();
  const dayOfWeek = startAt.toLocaleDateString('default', { weekday: 'long' });

  const handleCancel = async () => {
    putCancelAppointment({ payload: { cancelReason: reason } }, oneTimeToken)
      .then(() => {
        setHasCanceled(true);
      })
      .catch((e: ApiRequestError) => {
        if (e.code === 'already-canceled') {
          modalManager.openModal({
            type: 'Custom',
            title: t('AppointmentAlreadyCanceled', 'Appointment Already Canceled'),
            content: (
              <div>
                <p className="text-base text-gray-500">
                  {t(
                    'ThisAppointmentHasAlreadyBeenCanceledOrCheckedIn',
                    'This appointment has already been canceled or checked in',
                  )}
                </p>
                <p className="mt-3 text-sm text-gray-500">Trace ID: {e.trace}</p>
              </div>
            ),
            icon: <ErrorIcon />,
            buttons: [
              {
                children: t('Ok', 'Ok'),
                onClick: () => {
                  modalManager.closeModal();
                },
              },
              {
                children: t('ScheduleAnother', 'Schedule Another'),
                onClick: () => {
                  router.push('/schedule/flow/select-patient');
                  modalManager.closeModal();
                },
              },
            ],
          });

          return;
        }

        modalManager.handleApiError({
          error: e,
          subtitle: t('ErrorCancelingAppointment', 'Error canceling appointment'),
        });
      });
  };

  const handleScheduleAppointment = () => {
    if (isProvider) {
      router.push('/schedule/providers');
    } else {
      router.push('/schedule/flow/select-patient');
    }
  };

  return (
    <div className="flex flex-col gap-y-2 m-auto max-w-lg items-center">
      <div className="flex w-full border-b-2 border-f-dark-green border-solid">
        <CalendarIcon {...{ month, day, dayOfWeek }} />
        <div className="flex flex-col items-center justify-center">
          <p className="text-lg">
            <span className="text-f-red line-through decoration-1">{appointment.startTime}</span>
            {` | ${data.providerName}`}
          </p>
          <p className="text-lg line-through decoration-1">
            {appointment.startDate} ({appointment.duration} mins)
          </p>
        </div>
      </div>
      {!!isProvider && <ReasonSelector reason={reason} setReason={setReason} />}
      <div className="p-4">
        {isSubmitting ? (
          <Loading />
        ) : hasCanceled ? (
          <>
            <p className="text-base">
              {t(
                'YourAppointmentHasBeenCanceled',
                'Your appoinment on {{startDate}} at {{startTime}} has successfully been canceled. To reschedule, simply click the button below.',
                { startDate: appointment.startDate, startTime: appointment.startTime },
              )}
            </p>
            <div className="flex flex-col justify-center items-center">
              <Button onClick={handleScheduleAppointment}>
                {isProvider
                  ? t('BackToDashboard', 'Back To Dashboard')
                  : t('ScheduleNewAppointment', 'Schedule new appointment')}
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-base">
              {t(
                'YouAreAboutToCancelYourAppointment',
                'You are about to cancel your appoinment on {{startDate}} at {{startTime}}. To cancel, simply click the button below.',
                { startDate: appointment.startDate, startTime: appointment.startTime },
              )}
            </p>
            <div className="flex flex-col justify-center items-center mt-4">
              <Button onClick={handleCancel}>{t('CancelAppointment', 'Cancel Appointment')}</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
