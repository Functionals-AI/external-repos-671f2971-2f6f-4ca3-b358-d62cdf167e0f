import CalendarItemHourCell from '../calendar-item-hour-cell';
import RenderCell from './render-cell';
import { DeveloperError } from 'utils/errors';
import { CalendarExpanderProvider, UseCalendarExpandersResult } from '../calendar-expanders';
import CalendarExpanders, { calendarItemTimeslotId } from '../calendar-expanders/expanders';
import { UseProviderDashboardFourDayCalendarStateResult } from './useFourDayCalendarState';

import { AppointmentRecord } from 'api/types';

interface WeekViewCalendarTableCellsProps {
  calendarExpanders: UseCalendarExpandersResult;
  groupedByTimeslot: UseProviderDashboardFourDayCalendarStateResult['groupedByTimeslot'];
  timezone: string;
  numDays: number;
  appointmentsByDay: Record<string, AppointmentRecord[]>;
}

export default function WeekViewCalendarTableCells({
  calendarExpanders,
  groupedByTimeslot,
  timezone,
  numDays,
  appointmentsByDay,
}: WeekViewCalendarTableCellsProps) {
  return (
    <div>
      <CalendarExpanderProvider {...calendarExpanders}>
        <CalendarExpanders.TopExpander />
        {groupedByTimeslot.map((rowItems) => {
          const label = rowItems.find((item) => !!item.item)?.item?.topOfHourTimeslot.display;
          if (!label) throw new DeveloperError('No valid items in group for timeslot');

          const hour = rowItems[0].item?.topOfHourTimeslot.dateTime.setZone(timezone).hour;
          if (hour === undefined) throw new DeveloperError('Error calculating hour of row');

          return (
            <div key={label} id={calendarItemTimeslotId(hour)}>
              <CalendarExpanders.TopCollapser hour={hour} />
              <CalendarItemHourCell
                size="sm"
                timeLabel={label}
                content={
                  <div
                    className="grid grid-col h-full"
                    style={{ gridTemplateColumns: `repeat(${numDays}, minmax(0, 1fr))` }}
                  >
                    {rowItems.map(({ item }) => (
                      <RenderCell
                        key={item?.topOfHourTimeslot.dateTime.toISO()}
                        item={item}
                        appointmentsByDay={appointmentsByDay}
                      />
                    ))}
                  </div>
                }
              />
              <CalendarExpanders.BottomCollapser hour={hour} />
            </div>
          );
        })}
        <CalendarExpanders.BottomExpander />
      </CalendarExpanderProvider>
    </div>
  );
}
