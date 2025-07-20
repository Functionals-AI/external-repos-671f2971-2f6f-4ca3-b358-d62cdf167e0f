import Card from '@/ui-components/card';
import { CalendarExpanderProvider } from '../calendar-expanders';
import { calendarItemTimeslotId } from '../calendar-expanders/expanders';
import { getSlotTimingType } from '../helpers';
import CalendarExpanders from '../calendar-expanders/expanders';
import useProviderCalendarSingleDayState from './useProviderCalendarSingleDayState';
import { useEffect } from 'react';
import { DateTime } from 'luxon';
import { useProviderDashboardContext } from '../../context';
import { AppointmentRecord } from 'api/types';
import CalendarHourItemSlot from './calendar-hour-item-slot';

export default function SingleDayCalendarItemList({
  appointmentsByDay,
  timezone,
  currentDate,
}: {
  appointmentsByDay: Record<string, AppointmentRecord[]>;
  timezone: string;
  currentDate: DateTime;
}) {
  const { trackedDay } = useProviderDashboardContext();
  const { displayedCalendarItems, calendarExpanders } = useProviderCalendarSingleDayState({
    appointmentsByDay,
    selectedDate: currentDate,
    timezone,
  });

  useEffect(() => {
    const nowHour = Math.max(DateTime.now().setZone(timezone).hour - 1, 0);
    const elementToScroll = document.getElementById(calendarItemTimeslotId(nowHour));

    if (elementToScroll) {
      elementToScroll.scrollIntoView();
    }
  }, [trackedDay]);

  return (
    <Card className="h-full max-h-[84vh] p-0 overflow-y-scroll relative">
      <CalendarExpanderProvider {...calendarExpanders}>
        <CalendarExpanders.TopExpander />
        {displayedCalendarItems.map((item) => {
          const hour = item.topOfHourTimeslot.dateTime.setZone(timezone).hour;
          const key = calendarItemTimeslotId(
            parseInt(item.topOfHourTimeslot.dateTime.toFormat('H')),
          );

          return (
            <div key={key} id={key}>
              <CalendarExpanders.TopCollapser hour={hour} />
              <CalendarHourItemSlot
                hourSlotTimingType={getSlotTimingType({
                  dateTime: item.topOfHourTimeslot.dateTime,
                  duration: 60,
                })}
                item={item}
                date={currentDate}
                appointmentsByDay={appointmentsByDay}
              />
              <CalendarExpanders.BottomCollapser hour={hour} />
            </div>
          );
        })}
        <CalendarExpanders.BottomExpander />
      </CalendarExpanderProvider>
    </Card>
  );
}
