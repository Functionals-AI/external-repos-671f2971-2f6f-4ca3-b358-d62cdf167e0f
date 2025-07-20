import { DateTime } from 'luxon';
import calendarItemsSelector from '@/selectors/calendarItemsSelector';
import { useMemo } from 'react';
import { AppointmentRecord } from 'api/types';
import { useCalendarExpanders } from '../calendar-expanders';
import { useSidePanelContext } from '../../side-panel/context';

interface UseProviderCalendarSingleDayStateProps {
  selectedDate: DateTime;
  timezone: string;
  appointmentsByDay: Record<string, AppointmentRecord[]>;
}

export default function useProviderCalendarSingleDayState({
  appointmentsByDay,
  selectedDate,
  timezone,
}: UseProviderCalendarSingleDayStateProps) {
  const {filteredOverbookingSlots} = useSidePanelContext()
  
  const calendarItems = useMemo(() => {
    const selectedDayKey = selectedDate.toFormat('LL/dd/yyyy');

    return calendarItemsSelector({
      appointmentsForDay: appointmentsByDay[selectedDayKey] ?? [],
      displayTimezone: timezone,
      date: selectedDate.toJSDate(),
      overbookingSlots: filteredOverbookingSlots.map(({vacancy}) => vacancy)
    });
  }, [appointmentsByDay, timezone, selectedDate]);

  const calendarExpanders = useCalendarExpanders({ timezone, calendarItems });

  const displayedCalendarItems = calendarExpanders.getFilteredCalendarItems(calendarItems);

  return {
    displayedCalendarItems,
    calendarExpanders,
  };
}
