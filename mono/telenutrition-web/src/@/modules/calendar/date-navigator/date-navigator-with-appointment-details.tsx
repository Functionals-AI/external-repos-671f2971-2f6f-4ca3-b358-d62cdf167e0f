import { Trans, useTranslation } from 'react-i18next';
import DateNavigator, { DateNavigatorProps } from '.';
import { DateTime } from 'luxon';
import { AppointmentRecord } from 'api/types';
import { cn } from '@/utils';

import {
  BasicCollapsibleTrigger,
  Collapsible,
  CollapsibleContent,
} from '@/ui-components/collapsible';
import Dot from '@/icons/dot';

type SlotAvailablitlyType =
  | 'high-availability'
  | 'medium-availability'
  | 'low-availability'
  | 'no-availability';

export default function DateNavigatorWithAppointmentDetails({
  dateNavigator,
  appointmentsByDay,
}: {
  dateNavigator: DateNavigatorProps;
  appointmentsByDay: Record<string, AppointmentRecord[]>;
}) {
  return (
    <DateNavigator
      {...dateNavigator}
      renderAdditionalContentChildren={(viewType) => {
        if (viewType === 'month') return null;

        return <AvailabilityLegend />;
      }}
      components={{
        DayButton: (props) => {
          const { type } = getSlotAvailabilityType({ appointmentsByDay, date: props.day.date });

          return (
            <button {...props} className={cn(props.className, 'flex flex-col')}>
              <span>{props.day.date.getDate()}</span>
              <AvailabilityDot type={type} />
            </button>
          );
        },
      }}
    />
  );
}

export function AvailabilityLegend() {
  const { t } = useTranslation();

  return (
    <Collapsible>
      <BasicCollapsibleTrigger label={t('Legend')} className="text-f-blue" />
      <CollapsibleContent className="flex flex-col pl-4 gap-y-1">
        <span className="flex gap-x-2 items-center">
          <Dot className={cn('bg-status-green-200')} />
          <p>
            <Trans>High Availability</Trans>
          </p>
        </span>
        <span className="flex gap-x-2 items-center">
          <Dot className={cn('bg-status-amber-150')} />
          <p>
            <Trans>Medium Availability</Trans>
          </p>
        </span>
        <span className="flex gap-x-2 items-center">
          <Dot className={cn('bg-status-red-400')} />
          <p>
            <Trans>Low Availability</Trans>
          </p>
        </span>
        <span className="flex gap-x-2 items-center">
          <Dot className={cn('bg-neutral-1500')} />
          <p>
            <Trans>No Availability</Trans>
          </p>
        </span>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function AvailabilityDot({
  type,
  className,
}: {
  type: SlotAvailablitlyType;
  className?: string;
}) {
  return (
    <Dot
      className={cn(
        'w-2 h-2',
        className,
        type === 'no-availability' && 'bg-neutral-1500',
        type === 'low-availability' && 'bg-status-red-400',
        type === 'medium-availability' && 'bg-status-amber-150',
        type === 'high-availability' && 'bg-status-green-200',
      )}
    />
  );
}

export function getSlotAvailabilityType({
  appointmentsByDay,
  date,
}: {
  appointmentsByDay: Record<string, AppointmentRecord[]>;
  date: Date;
}): { type: SlotAvailablitlyType; mins: number } {
  if (!appointmentsByDay || !date) return { type: 'no-availability', mins: 0 };
  const appointmentsForDay =
    appointmentsByDay[DateTime.fromJSDate(date).toFormat('LL/dd/yyyy')] ?? [];
  const openSlotsNum = appointmentsForDay
    .filter((appt) => appt.status === 'o')
    .reduce((acc, slot) => acc + slot.duration, 0);
  const bookedSlotsNum = appointmentsForDay
    .filter((appt) => ['f', '1', '2', '3', '4'].includes(appt.status))
    .reduce((acc, slot) => acc + slot.duration, 0);

  if (openSlotsNum === 0) {
    return { type: 'no-availability', mins: openSlotsNum };
  }

  if (openSlotsNum <= 60) {
    return { type: 'low-availability', mins: openSlotsNum };
  }

  if (openSlotsNum <= 120) {
    return { type: 'medium-availability', mins: openSlotsNum };
  }

  return { type: 'high-availability', mins: openSlotsNum };
}
