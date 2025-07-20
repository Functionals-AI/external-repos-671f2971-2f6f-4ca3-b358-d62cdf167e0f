import { AsBasicDate, useDateHelpers } from '@/modules/dates';
import { TimezoneContext } from '@/modules/dates/context';
import { useModal } from '@/modules/modal';
import { Button } from '@/ui-components/button';
import DataDisplay from '@/ui-components/data-display';
import Icon from '@/ui-components/icons/Icon';
import { cn } from '@/utils';
import { AppointmentRecord } from 'api/types';
import { DateTime } from 'luxon';
import { useContext } from 'react';
import { Trans } from 'react-i18next';

export default function OpenSlotRow({
  appointment,
  className,
  isConflict,
}: {
  appointment: AppointmentRecord;
  className?: string;
  isConflict: boolean;
}) {
  const modal = useModal();
  const timezone = useContext(TimezoneContext);
  const dateHelpers = useDateHelpers();

  const startTime = DateTime.fromISO(appointment.startTimestamp).setZone(
    timezone?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const startTimeStr = startTime.toLocaleString({
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h12',
  });
  const endTime = startTime.plus({ minutes: appointment.duration });
  const endTimeStr = endTime.toLocaleString({
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h12',
  });

  function handleBlockOpenSlot() {
    modal.openSecondary({
      type: 'freeze-slot',
      dateDisplay: dateHelpers.asBasicDate(appointment.startTimestamp),
      timeDisplay: dateHelpers.asTime(appointment.startTimestamp),
      appointmentIds: {
        primary: appointment.appointmentId,
      },
      dateTime: DateTime.fromISO(appointment.startTimestamp)
    });
  }

  return (
    <div data-testid="open-slot-row" className={cn('w-full flex flex-col p-2 gap-y-2', className)}>
      <div className="w-full flex flex-row justify-between">
        <div className="text-lg flex flex-row items-center gap-x-2">
          <Icon size="xs" name="alert-circle" color="statusRed" />
          <Trans>Open Slot</Trans>
        </div>
        <div className="flex flex-row gap-2">
          <Button
            size="sm"
            variant="secondary"
            leftIcon={{ name: 'calendar' }}
            onClick={handleBlockOpenSlot}
            dataTestId={`reschedule-appointment-${appointment.appointmentId}`}
          >
            <Trans>Block</Trans>
          </Button>
        </div>
      </div>
      <div className="flex flex-row gap-8 pl-6">
        <DataDisplay
          size="sm"
          label={<Trans>Date</Trans>}
          content={
            <div className="text-sm">
              <AsBasicDate>{appointment.startTimestamp}</AsBasicDate>
            </div>
          }
        />
        <DataDisplay
          size="sm"
          label={<Trans>Start time</Trans>}
          content={
            <div className={`text-sm ${isConflict ? 'text-f-red' : ''}`}>{startTimeStr}</div>
          }
        />
        <DataDisplay
          size="sm"
          label={<Trans>End time</Trans>}
          content={<div className={`text-sm ${isConflict ? 'text-f-red' : ''}`}>{endTimeStr}</div>}
        />
      </div>
    </div>
  );
}
