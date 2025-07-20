import Icon from '@/ui-components/icons/Icon';
import { cn } from '@/utils';
import { DateTime } from 'luxon';
import { DayScheduleType } from '.';

export default function ColumnHeaderCell({
  date,
  dayScheduleType,
}: {
  date: Date;
  dayScheduleType: DayScheduleType;
}) {
  const type: string = dayScheduleType !== 'allowed' ? 'disabled' : 'default';
  const isToday =
    DateTime.fromJSDate(date).toFormat('dd LLL yyyy') === DateTime.now().toFormat('dd LLL yyyy');

  return (
    <div
      className={cn(
        'flex flex-col items-center px-4 py-2',
        isToday && '!bg-blue-100',
        type === 'disabled'
          ? 'bg-transparent text-neutral-400 opacity-60'
          : 'text-neutral-700 bg-neutral-100',
      )}
    >
      <h4 className={'text-sm text-type-secondary'}>{DateTime.fromJSDate(date).weekdayShort}</h4>
      <span className="flex items-center gap-x-2">
        <p>{DateTime.fromJSDate(date).toFormat('dd')}</p>
        {type === 'holiday' && <Icon name="umbrella" />}
      </span>
    </div>
  );
}
