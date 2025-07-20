'use client';

import { useRouter } from 'next/navigation';
import { useWeekPicker, NavigationBar } from '@/modules/calendar/week-view';
import WeekNavigator from '@/modules/calendar/week-view/week-navigator';
import { cn } from '@/utils';
import { DateTime } from 'luxon';
import { Button } from '@/ui-components/button';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { groupBy } from 'lodash';
import { AppointmentRecord } from 'api/types';
import calendarItemsSelector, { CalendarItemHour } from '@/selectors/calendarItemsSelector';
import RenderCell from './render-cell';

export default function AvailabilityTab({
  providerTimezone,
  providerAppointments,
}: {
  providerTimezone: string;
  providerAppointments: AppointmentRecord[];
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const weekPicker = useWeekPicker(providerTimezone);
  const appointmentsByDay = groupBy(providerAppointments, (appt) => {
    return DateTime.fromJSDate(new Date(appt.startTimestamp))
      .setZone(providerTimezone)
      .toFormat('LL/dd/yyyy');
  });

  const calendarItemsForWeek = useMemo(
    () =>
      weekPicker.selectedDates.reduce((acc, date) => {
        const key = DateTime.fromJSDate(date).toFormat('LL/dd/yyyy');

        const items = calendarItemsSelector({
          appointmentsForDay: appointmentsByDay[key] ?? [],
          displayTimezone: providerTimezone,
          date,
        });

        return {
          ...acc,
          [key]: items,
        };
      }, {} as Record<string, CalendarItemHour[]>),
    [weekPicker.selectedDates],
  );

  function getItemFromDate(date: Date): { item: CalendarItemHour; type: 'top' | 'middle' } | null {
    const calendarItemsForDay =
      calendarItemsForWeek[
        DateTime.fromJSDate(date, { zone: providerTimezone }).toFormat('LL/dd/yyyy')
      ];

    const foundTop = calendarItemsForDay.find((slot) => {
      return slot.topOfHourTimeslot.time === date.getTime();
    });
    if (foundTop) {
      return { item: foundTop, type: 'top' };
    }

    const foundMiddle = calendarItemsForDay.find((slot) => {
      return slot.middleOfHourTimeslot.time === date.getTime();
    });
    if (foundMiddle) {
      return { item: foundMiddle, type: 'middle' };
    }

    return null;
  }

  return (
    <div className="flex flex-col gap-y-6 py-6">
      <NavigationBar
        {...weekPicker}
        right={
          <Button onClick={() => router.push('/schedule/provider/availability/edit')}>
            {t('Edit availability')}
          </Button>
        }
      />
      <WeekNavigator
        {...weekPicker}
        renderCell={(date) => {
          const item = getItemFromDate(date);
          if (!item) return <div>error</div>;
          return <RenderCell item={item} />;
        }}
        renderColKey={(date, day) => <WeekDayHeader date={date} day={day} />}
        days={['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']}
        startTime={'06:00'}
        endTime={'22:00'}
        increment={30}
      />
    </div>
  );
}

function WeekDayHeader({ day, date, className }: { day: string; date: Date; className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center border-r border-r-neutral-150 last:border-r-0',
        className,
      )}
    >
      <div className="flex flex-col items-center p-2">
        <h4>{day}</h4>
        <h4>{DateTime.fromJSDate(date).toFormat('d')}</h4>
      </div>
    </div>
  );
}
