import { useMemo, useState } from 'react';
import { DateTime } from 'luxon';

import { NavigationBar, UseWeekPickerReturn } from '@/modules/calendar/week-view';
import { GroupedAppointmentsByProvider } from 'api/useGetAppointments';
import type { PatientRecord } from '@mono/telenutrition/lib/types';
import RadioGroupItemCard from '@/ui-components/radio-and-checkbox/radio/radio-group-item-card';
import RadioGroup from '@/ui-components/radio-and-checkbox/radio';
import DayButton from './day-button';
import * as React from 'react';

import { FormField } from '../../ui-components/form/form';
import { RegisterOptions } from 'react-hook-form/dist/types/validator';

export interface DisabledDatesWithTooltip {
  tooltip: string;
  date: DateTime;
}

interface Props {
  patient: PatientRecord;
  // todo: try to make this type right
  form: any;
  id: string;
  weekPicker: UseWeekPickerReturn;
  timezone: string;
  openingsByDate: Record<string, GroupedAppointmentsByProvider | undefined>;
  rules?: RegisterOptions;
  disabledDatesWithTooltip?: DisabledDatesWithTooltip[];
}

export default function WeekViewHourOptionPicker({
  form,
  id,
  openingsByDate,
  weekPicker,
  timezone,
  disabledDatesWithTooltip,
  rules,
}: Props) {
  const [viewDate, setViewDate] = useState<DateTime>();

  const buttonItems = useMemo(() => {
    return weekPicker.selectedDates.map((date) => {
      const dateTime = DateTime.fromJSDate(date);
      const key = dateTime.toFormat('MM/dd/y');
      const slotCount = openingsByDate[key]?.appointments.length ?? 0;
      const found = disabledDatesWithTooltip?.find(
        ({ date }) => date.toFormat('LLL dd yyyy') === dateTime.toFormat('LLL dd yyyy'),
      );
      const isToday = dateTime.toFormat('LLL dd yyyy') === DateTime.now().toFormat('LLL dd yyyy');

      return (
        <DayButton
          key={key}
          datetime={dateTime}
          onClick={() => setViewDate(dateTime)}
          slotCount={slotCount}
          buttonClassName={isToday ? '!bg-blue-100' : ''}
          isActive={viewDate?.toFormat('dd LLL yyyy') === dateTime?.toFormat('dd LLL yyyy')}
          {...(found && { disabled: true, tooltip: found.tooltip })}
          {...(dateTime < DateTime.now().startOf('day') && { disabled: true })}
        />
      );
    });
  }, [openingsByDate, viewDate]);

  const slotItems = useMemo(() => {
    if (!viewDate) return null;
    const key = viewDate.toFormat('MM/dd/y');

    const slot = openingsByDate[key];

    return slot?.appointments.map((appointment) => {
      const label = DateTime.fromISO(appointment.startTimestamp)
        .setZone(timezone)
        .toLocaleString(DateTime.TIME_SIMPLE);
      return (
        <div key={appointment.startTimestamp} className="mb-1">
          <RadioGroupItemCard
            value={appointment.startTimestamp}
            description={label}
            dataTestId={`option-${label}`}
          />
        </div>
      );
    });
  }, [openingsByDate, viewDate]);

  return (
    <div>
      <NavigationBar {...weekPicker} />
      <div className="flex mb-3 gap-x-1">{buttonItems}</div>
      <div>
        <FormField
          name={id}
          control={form.control}
          render={() => {
            return (
              <RadioGroup form={form} id={id}>
                {slotItems}
              </RadioGroup>
            );
          }}
          rules={{ required: true }}
        />
      </div>
    </div>
  );
}
