import { useRangeDateNavigator } from '@/modules/calendar/date-navigator/useRangeDateNavigator';
import { useProviderDashboardContext } from '../../context';
import Card from '@/ui-components/card';
import { useEffect } from 'react';
import { DateTime } from 'luxon';
import { AppointmentRecord } from 'api/types';
import { calendarItemTimeslotId } from '../calendar-expanders/expanders';
import CalendarHeaderBar from '../calendar-header-bar';
import WeekViewCalendarHeader from './header';
import WeekViewCalendarTableCells from './table';
import useProviderDashboardFourDayCalendarState from './useFourDayCalendarState';

export default function WeekView({
  timezone,
  appointmentsByDay,
}: {
  timezone: string;
  appointmentsByDay: Record<string, AppointmentRecord[]>;
}) {
  const { trackedDay, setTrackedDay } = useProviderDashboardContext();
  const dateNavigator = useRangeDateNavigator({
    interval: 7,
    value: trackedDay,
    pivotDate: DateTime.now().setZone(timezone).startOf('week').minus({ days: 1 }),
    onChange: (date) => {
      setTrackedDay(date[0]);
    },
  });

  const { groupedByTimeslot, dates, calendarExpanders } = useProviderDashboardFourDayCalendarState({
    appointmentsByDay,
    timezone,
    dates: dateNavigator.currentDates,
  });

  useEffect(() => {
    const nowHour = Math.max(DateTime.now().setZone(timezone).hour - 1, 0);
    const elementToScroll = document.getElementById(calendarItemTimeslotId(nowHour));

    if (elementToScroll) {
      elementToScroll.scrollIntoView();
    }
  }, [trackedDay]);

  return (
    <div className="h-full flex flex-col w-full gap-2">
      <CalendarHeaderBar
        appointmentsByDay={appointmentsByDay}
        dateNavigator={dateNavigator}
        timezone={timezone}
      />
      <Card
        className="h-full p-0 overflow-y-scroll relative min-w-[43rem]"
        dataTestId={`week-calendar-view`}
      >
        <WeekViewCalendarHeader
          timezone={timezone}
          dates={dates}
          numDays={7}
          appointmentsByDay={appointmentsByDay}
        />
        <WeekViewCalendarTableCells
          numDays={7}
          timezone={timezone}
          calendarExpanders={calendarExpanders}
          groupedByTimeslot={groupedByTimeslot}
          appointmentsByDay={appointmentsByDay}
        />
      </Card>
    </div>
  );
}
