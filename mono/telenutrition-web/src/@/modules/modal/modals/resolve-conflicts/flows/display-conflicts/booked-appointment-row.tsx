import React, { useContext } from 'react';
import { AppointmentRecord } from 'api/types';
import { Trans } from 'react-i18next';
import { cn } from '@/utils';
import { DateTime } from 'luxon';
import { Button } from '@/ui-components/button';
import DataDisplay from '@/ui-components/data-display';
import Icon from '@/ui-components/icons/Icon';
import { AsBasicDate } from '@/modules/dates';
import { TimezoneContext } from '@/modules/dates/context';

interface AppointmentRowProps {
  isConflict: boolean;
  appointment: AppointmentRecord;
  className?: string;
  onReschedule: () => void;
  onCancel: () => void;
}

export default function AppointmentRow(props: AppointmentRowProps) {
  const { isConflict, appointment, className, onReschedule, onCancel } = props;
  const timezone = useContext(TimezoneContext);
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

  return (
    <div className={cn('w-full flex flex-col p-2 gap-y-2', className)}>
      <div className="w-full flex flex-row justify-between">
        <div className="text-lg flex flex-row items-center gap-x-2">
          <Icon
            size="xs"
            name={isConflict ? 'alert-circle' : 'check'}
            color={isConflict ? 'statusRed' : 'fsGreen'}
          />
          <p>
            {appointment.patient
              ? `${appointment.patient?.firstName} ${appointment.patient?.lastName}`
              : `MemberId: ${appointment.patientId}`}
          </p>
        </div>
        <div className="flex flex-row gap-2">
          <Button
            size="sm"
            variant="secondary"
            leftIcon={{ name: 'calendar' }}
            onClick={onReschedule}
            dataTestId={`reschedule-appointment-${appointment.appointmentId}`}
          >
            <Trans>Reschedule</Trans>
          </Button>
          <Button
            size="sm"
            variant="secondary"
            leftIcon={{ name: 'x' }}
            onClick={onCancel}
            dataTestId={`cancel-appointment-${appointment.appointmentId}`}
          >
            <Trans>Cancel</Trans>
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
