import { AppointmentRecord } from 'api/types';
import { useSingleDateNavigator } from '@/modules/calendar/date-navigator/useSingleDateNavigator';
import { useProviderDashboardContext } from '../../context';
import CalendarHeaderBar from '../calendar-header-bar';
import SingleDayCalendarItemList from './single-day-calendar-item-list';
import SingleDayCalendar from './single-day-calendar';

export default function DayView({
  appointmentsByDay,
  timezone,
}: {
  appointmentsByDay: Record<string, AppointmentRecord[]>;
  timezone: string;
}) {
  const { trackedDay, setTrackedDay } = useProviderDashboardContext();
  const dateNavigator = useSingleDateNavigator({
    navigationType: 'month',
    value: trackedDay,
    onChange: (date) => {
      setTrackedDay(date);
    },
  });

  return (
    <div className="h-full flex flex-col w-full gap-2">
      <CalendarHeaderBar
        dateNavigator={dateNavigator}
        timezone={timezone}
        appointmentsByDay={appointmentsByDay}
      />
      <div className="flex flex-row gap-2">
        <SingleDayCalendar
          appointmentsByDay={appointmentsByDay}
          timezone={timezone}
          dateNavigator={dateNavigator}
        />
        <div className="flex-1">
          <SingleDayCalendarItemList
            appointmentsByDay={appointmentsByDay}
            timezone={timezone}
            currentDate={dateNavigator.currentDate}
          />
        </div>
      </div>
    </div>
  );
}
