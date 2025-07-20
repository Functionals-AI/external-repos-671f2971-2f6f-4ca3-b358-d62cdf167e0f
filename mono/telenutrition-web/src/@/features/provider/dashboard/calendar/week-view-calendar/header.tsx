import { cn } from '@/utils';
import { DateTime } from 'luxon';
import { getTimeLabelWidgthClassName } from '../calendar-item-hour-cell';
import { AppointmentRecord } from 'api/types';
import { useProviderDashboardContext } from '../../context';

interface WeekViewCalendarHeaderProps {
  dates: DateTime[];
  numDays: number;
  timezone: string;
  appointmentsByDay: Record<string, AppointmentRecord[]>;
}

export default function WeekViewCalendarHeader({
  dates,
  numDays,
  timezone,
}: WeekViewCalendarHeaderProps) {
  const { highlightSlot } = useProviderDashboardContext();

  return (
    <div className="flex sticky top-0 border-b z-30 bg-white">
      <div className={cn(getTimeLabelWidgthClassName('sm'), 'border-r border-r-neutral-150')}></div>
      <div
        className="flex-1 grid"
        style={{ gridTemplateColumns: `repeat(${numDays}, minmax(0, 1fr))` }}
      >
        {dates.map((date, ind) => {
          const isToday =
            date.setZone(timezone).toFormat('Ll/dd/yyyy') ===
            DateTime.now().setZone(timezone).toFormat('Ll/dd/yyyy');

          const highlight =
            highlightSlot &&
            Math.abs(
              date
                .setZone(timezone)
                .startOf('day')
                .diff(
                  DateTime.fromISO(highlightSlot.startTimestamp).setZone(timezone).startOf('day'),
                )
                .as('days'),
            ) === 0;

          return (
            <div
              key={date.toISO()}
              className={cn(
                'border-r border-r-neutral-150 last:border-r-0 flex flex-col items-center justify-between gap-y-2 z-10',
                isToday && 'bg-blue-100',
                highlight && '!bg-fs-pale-green-100',
              )}
              data-testid={`calendar-header-${date.toFormat('LL/dd/yyyy')}`}
            >
              <div className="relative left-0 right-0 top-0 bottom-0 py-2 px-4 w-full h-full">
                {highlight && (
                  <div className="absolute left-0 right-0 top-0 bottom-0 border-green-300 border-2" />
                )}
                <p className={cn('text-sm text-neutral-600 font-bold', isToday && 'text-blue-600')}>
                  {date.day} {date.weekdayShort?.toUpperCase()}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
