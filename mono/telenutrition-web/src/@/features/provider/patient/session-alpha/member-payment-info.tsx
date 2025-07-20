import { AsBasicDate, AsTime } from '@/modules/dates';
import { Trans, useTranslation } from 'react-i18next';
import TimeDifferenceBadge from '@/smart-components/time-difference-badge';
import { UseGetAppointmentByIdReturn } from 'api/useGetAppointmentById';
import { DateTime } from 'luxon';
import useMemberHelpers from '@/modules/member/useMemberHelpers';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui-components/dropdown-menu';
import { useModal } from '@/modules/modal';
import usePutCreateProviderAppointmentReminder from 'api/provider/usePutCreateProviderAppointmentReminder';
import useToaster from 'hooks/useToaster';
import { FormItemBoxUi } from '@/modules/form/ui';
import { useEffect, useState } from 'react';
import PaymentMethodsDisplay from '../session/components/session-patient-display/payment-methods-display';
import MeetingLink from '../session/components/session-patient-display/meeting-link';

interface PatientSessionMemberPaymentInfoProps {
  appointmentById: UseGetAppointmentByIdReturn;
}

export default function PatientSessionMemberPaymentInfo({
  appointmentById,
}: PatientSessionMemberPaymentInfoProps) {
  const { appointment } = appointmentById;
  const { patient } = appointment;
  const { t } = useTranslation();
  const memberHelpers = useMemberHelpers();
  const modal = useModal();
  const { post: putCreateProviderAppointmentReminder } = usePutCreateProviderAppointmentReminder(
    appointment.appointmentId,
  );
  const toaster = useToaster();
  const [now, setNow] = useState(() => DateTime.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(DateTime.now());
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const patientName = memberHelpers.getDisplayNameFromAppointment({ appointment });

  const meetingLink = appointment.meeting?.shortLink;

  function openCancelModal() {
    modal.openPrimary({ type: 'cancel-session', appointment });
  }

  function openRescheduleModal() {
    modal.openPrimary({ type: 'reschedule-session', rescheduleAppointment: appointment });
  }

  function sendReminder() {
    putCreateProviderAppointmentReminder({ payload: {} })
      .then(() => {
        toaster.success({
          title: t('We have sent a reminder notification to the patient about this appointment.'),
        });
      })
      .catch((error) => {
        toaster.apiError({ error, title: t('There was an error sending an appointment reminder') });
      });
  }

  const apptStartTime = DateTime.fromISO(appointment.startTimestamp);

  const fiveMinutesAfter = apptStartTime.plus({ minutes: 5 });

  const isPastAppointment = now.startOf('day') > apptStartTime.startOf('day');
  const isSameAppointmentDay = now.startOf('day').equals(apptStartTime.startOf('day'));
  const providerCanSendReminder = now > apptStartTime && now < fiveMinutesAfter;

  return (
    <div className="flex flex-col gap-y-2" style={{ flex: 2 }}>
      <div className="flex justify-between">
        <div className="flex flex-col gap-y-1">
          <h4 className="text-xl leading-6">{patientName}</h4>
          {patient?.patientId && (
            <p className="text-neutral-600 text-sm mt-2 mb-2">ID: {patient.patientId}</p>
          )}
          <p className="text-sm">
            <AsBasicDate format="full">{appointment.startTimestamp}</AsBasicDate>
          </p>
        </div>
        {isPastAppointment && ['3', '4'].some((status) => status === appointment.status) ? null : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <FormItemBoxUi as="button" className="px-4 h-fit">
                <Trans>Actions</Trans>
              </FormItemBoxUi>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {isSameAppointmentDay && (
                <DropdownMenuItem
                  onClick={() => sendReminder()}
                  disabled={!providerCanSendReminder}
                >
                  <Trans>Send reminder message</Trans>
                </DropdownMenuItem>
              )}
              {!isPastAppointment && appointment.patient && (
                <>
                  <DropdownMenuItem onClick={() => openRescheduleModal()}>
                    <Trans>Reschedule session</Trans>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              <DropdownMenuItem onClick={() => openCancelModal()}>
                <Trans>Cancel session</Trans>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <p className="text-sm">
        <AsTime>{appointment.startTimestamp}</AsTime> -{' '}
        {`${t('{{duration}} minutes', { duration: appointment.duration })}`}
      </p>
      <TimeDifferenceBadge
        variant="statusAmber"
        label={<Trans>Member time</Trans>}
        timezone={patient?.timezone ?? null}
        date={new Date(appointment.startTimestamp)}
      />
      {meetingLink && <MeetingLink meetingLink={meetingLink} />}
      <div className="mt-3 flex flex-col gap-y-2">
        <h4 className="text-neutral-700">
          <Trans>Insurance plans</Trans>
        </h4>
        <PaymentMethodsDisplay appointmentDetails={appointmentById} />
      </div>
    </div>
  );
}
