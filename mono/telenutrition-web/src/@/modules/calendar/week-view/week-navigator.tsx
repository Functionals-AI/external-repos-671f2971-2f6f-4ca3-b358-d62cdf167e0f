import WeekViewTable, { WeekViewTableProps, Day } from '@/ui-components/week-view-table';
import { UseWeekPickerReturn } from '.';
import { ReactNode } from 'react';
import { DateTime } from 'luxon';

type WeekNavigatorProps = UseWeekPickerReturn &
  Pick<WeekViewTableProps, 'startTime' | 'endTime' | 'increment' | 'rowHeight'> & {
    // These are custom because they are date-specific rather than only day-specific
    renderCell: (date: Date, day: Day) => ReactNode;
    renderColKey: (date: Date, day: Day) => ReactNode;
  };

export default function WeekNavigator({
  renderCell,
  renderColKey,
  startTime,
  endTime,
  increment,
  rowHeight,
  timezone,
  ...weekPicker
}: WeekNavigatorProps) {
  return (
    <WeekViewTable
      startTime={startTime}
      endTime={endTime}
      increment={increment}
      rowHeight={rowHeight}
      days={weekPicker.days}
      renderCell={(cell) => {
        const date = weekPicker.getWeekDateAndTimeForDay(cell.day, cell.time, timezone);
        return renderCell(date, cell.day);
      }}
      renderHeaderCell={(day) => {
        const date = weekPicker.getWeekDateForDay(day);
        return renderColKey(date, day);
      }}
      renderRowLabelCell={(time) => {
        const [hour, minute] = time.split(':').map((n) => parseInt(n, 10));
        const display = DateTime.fromObject({ hour, minute });

        return (
          <div className="flex h-full text-type-secondary p-4 text-sm justify-end">
            {display.toLocaleString(DateTime.TIME_SIMPLE)}
          </div>
        );
      }}
    />
  );
}
