import { Button } from '@/ui-components/button';
import Icon from '@/ui-components/icons/Icon';
import useToaster from 'hooks/useToaster';
import { Trans, useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui-components/dropdown-menu';
import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';
import { useModal } from '@/modules/modal';
import usePutCreateProviderAppointmentReminder from 'api/provider/usePutCreateProviderAppointmentReminder';
import { AppointmentRecord } from 'api/types';
import { useFeatureFlags } from '@/modules/feature-flag';

export default function SessionActionsDropdown({
  appointment,
}: {
  appointment: AppointmentRecord;
}) {
  const featureFlags = useFeatureFlags();

  const [now, setNow] = useState(() => DateTime.now());
  const toaster = useToaster();
  const { post: putCreateProviderAppointmentReminder } = usePutCreateProviderAppointmentReminder(
    appointment.appointmentId,
  );
  const { t } = useTranslation();
  const modal = useModal();
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(DateTime.now());
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const apptStartTime = DateTime.fromISO(appointment.startTimestamp);
  const fiveMinutesAfter = apptStartTime.plus({ minutes: 5 });
  const isPastAppointment = now.startOf('day') > apptStartTime.startOf('day');
  const isSameAppointmentDay = now.startOf('day').equals(apptStartTime.startOf('day'));
  const providerCanSendReminder = now > apptStartTime && now < fiveMinutesAfter;
  function openCancelModal() {
    modal.openPrimary({ type: 'cancel-session', appointment });
  }

  function openRescheduleModal() {
    if (featureFlags.hasFeature('thorough_scheduling_flow_ENG_1629')) {
      modal.openPrimary({
        type: 'reschedule-session-v2',
        rescheduleAppointment: appointment,
      });
    } else {
      modal.openPrimary({ type: 'reschedule-session', rescheduleAppointment: appointment });
    }
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
  return (
    <div className="flex items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="px-2 h-fit" variant="secondary">
            <Icon name="meatballs" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {isSameAppointmentDay && (
            <DropdownMenuItem onClick={() => sendReminder()} disabled={!providerCanSendReminder}>
              <Trans>Send reminder message</Trans>
            </DropdownMenuItem>
          )}
          {!isPastAppointment &&
            appointment.patient &&
            ['2', '1', 'f'].includes(appointment.status) && (
              <>
                <DropdownMenuItem onClick={() => openRescheduleModal()}>
                  <Trans>Reschedule session</Trans>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
          {['2', '1', 'f'].includes(appointment.status) && (
            <DropdownMenuItem onClick={() => openCancelModal()}>
              <Trans>Cancel session</Trans>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
