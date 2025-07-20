import { DateTime } from 'luxon';
import { useState } from 'react';

export type Day =
  | 'Sunday'
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday';

export type WeekViewTableCell = {
  day: Day;
  time: string;
};

export interface ExtraData {
  getAllCells: () => WeekViewTableCell[];
  numRows: number;
}

type TimeString = `${string}:${string}`;

export interface WeekViewTableProps {
  renderHeaderCell: (day: Day, i: number, extra: ExtraData) => React.ReactNode;
  renderRowLabelCell: (time: string, i: number, extra: ExtraData) => React.ReactNode;
  renderCell: (cell: WeekViewTableCell, i: number, extra: ExtraData) => React.ReactNode;
  startTime: TimeString;
  endTime: TimeString;
  increment: 30 | 60;
  rowKeyWidth?: string | number;
  rowHeight?: string | number;
  days: Day[];
}

export default function WeekViewTable({
  renderHeaderCell,
  renderRowLabelCell,
  renderCell,
  startTime,
  endTime,
  increment,
  days,
  rowKeyWidth = '6rem',
  rowHeight = '40px',
}: WeekViewTableProps) {
  const [dates] = useState<string[]>(() => {
    const baseDate = DateTime.fromJSDate(new Date()).startOf('day');
    const [startHour, startMinute] = startTime.split(':');
    let from = DateTime.fromObject({
      day: baseDate.day,
      hour: parseInt(startHour),
      minute: parseInt(startMinute),
    });
    const [endHour, endMinute] = endTime.split(':');
    const to = DateTime.fromObject({
      day: baseDate.day,
      hour: parseInt(endHour),
      minute: parseInt(endMinute),
    });

    const _dates = [];
    while (from < to) {
      _dates.push(from.toFormat('HH:mm'));
      from = from.plus({ minutes: increment });
    }
    return _dates;
  });

  const cells: WeekViewTableCell[] = dates.reduce((acc, time) => {
    return [...acc, ...days.map((day) => ({ day, time }))];
  }, [] as WeekViewTableCell[]);

  const extraData: ExtraData = {
    getAllCells: () => cells,
    numRows: dates.length,
  };

  return (
    <div className="overflow-x-scroll" data-testid="week-view-table">
      <div className="min-w-[40rem]">
        <div
          className="grid"
          style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
        >
          <div
            style={{ width: rowKeyWidth }}
            className="col-end-1 border-r border-neutral-150"
          ></div>
          {days.map((day, i) => (
            <div key={day} className="border-r border-r-neutral-150">
              {renderHeaderCell(day, i, extraData)}
            </div>
          ))}
        </div>
        <div className="flex">
          <div className="flex flex-col">
            {dates.map((time, i) => (
              <div
                key={time}
                className="border-t border-t-neutral-150 border-r border-r-neutral-150"
                style={{ width: rowKeyWidth, height: rowHeight }}
              >
                {renderRowLabelCell(time, i, extraData)}
              </div>
            ))}
          </div>
          <div
            className="w-full grid gap-0"
            style={{
              gridAutoRows: rowHeight,
              gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`,
            }}
          >
            {cells.map((cell, i) => (
              <div
                data-testid="week-view-table-cell"
                data-test={`${cell.day}-${cell.time}`}
                key={`${cell.day}-${cell.time}`}
                className="border-r-neutral-150 border-r border-t-neutral-150 border-t flex items-center justify-center"
              >
                {renderCell(cell, i, extraData)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
