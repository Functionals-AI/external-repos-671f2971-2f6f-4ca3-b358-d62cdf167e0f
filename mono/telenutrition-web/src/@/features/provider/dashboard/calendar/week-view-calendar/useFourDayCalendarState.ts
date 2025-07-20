import calendarItemsSelector, { CalendarItemHour } from '@/selectors/calendarItemsSelector';
import { AppointmentRecord } from 'api/types';
import { DateTime } from 'luxon';
import { useMemo } from 'react';
import { useCalendarExpanders } from '../calendar-expanders';
import { useSidePanelContext } from '../../side-panel/context';

interface UseProviderDashboardFourDayCalendarStateProps {
  timezone: string;
  appointmentsByDay: Record<string, AppointmentRecord[]>;
  dates: DateTime[];
}

export interface UseProviderDashboardFourDayCalendarStateResult {
  groupedByTimeslot: {
    item: CalendarItemHour | null;
  }[][];
  dates: DateTime[];
  calendarExpanders: ReturnType<typeof useCalendarExpanders>;
}

export default function useProviderDashboardFourDayCalendarState({
  appointmentsByDay,
  timezone,
  dates,
}: UseProviderDashboardFourDayCalendarStateProps): UseProviderDashboardFourDayCalendarStateResult {
  
  const {filteredOverbookingSlots} = useSidePanelContext()
  const calendarItemGroups = useMemo(() => {
    return dates.map((date) => {
      const selectedDayKey = date.toFormat('LL/dd/yyyy');

      return calendarItemsSelector({
        appointmentsForDay: appointmentsByDay[selectedDayKey] ?? [],
        displayTimezone: timezone,
        date: date.toJSDate(),
        overbookingSlots: filteredOverbookingSlots.map(({vacancy}) => vacancy)
      });
    });
  }, [dates, appointmentsByDay, timezone, filteredOverbookingSlots]);

  const calendarExpanders = useCalendarExpanders({
    calendarItems: calendarItemGroups,
    timezone,
  });

  const displayedGroups = calendarItemGroups.map((group) => {
    return calendarExpanders.getFilteredCalendarItems(group);
  });

  // use the first group to get the general list of timeslots to grab corresponding timeslots on other days.
  const calendarItemTimeslotTemplate = displayedGroups[0];

  const groupedByTimeslot = calendarItemTimeslotTemplate.map((calendarItemHour) => {
    return displayedGroups.map((group) => {
      const found = group.find(
        (item) =>
          item.topOfHourTimeslot.dateTime.toFormat('HH:mm') ===
          calendarItemHour.topOfHourTimeslot.dateTime.toFormat('HH:mm'),
      );

      // VERY edge case... Daylight savings time. Just render as blocked.
      if (!found) {
        return {
          item: null,
        };
      }

      return {
        item: found,
      };
    });
  });

  return {
    groupedByTimeslot,
    dates,
    calendarExpanders,
  };
}
