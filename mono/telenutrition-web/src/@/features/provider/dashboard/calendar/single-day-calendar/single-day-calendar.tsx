import {
  AvailabilityDot,
  AvailabilityLegend,
  getSlotAvailabilityType,
} from '@/modules/calendar/date-navigator/date-navigator-with-appointment-details';
import { SingleDateNavigatorReturn } from '@/modules/calendar/date-navigator/useSingleDateNavigator';
import { DayPicker } from '@/ui-components/calendar/day-picker';
import { cn } from '@/utils';
import { AppointmentRecord } from 'api/types';
import { DateTime } from 'luxon';

export default function SingleDayCalendar({
  timezone,
  dateNavigator,
  appointmentsByDay,
}: {
  dateNavigator: SingleDateNavigatorReturn;
  timezone: string;
  appointmentsByDay: Record<string, AppointmentRecord[]>;
}) {
  const { month, currentDate, setCurrentDate } = dateNavigator;
  return (
    <div data-testid="single-day-calendar">
      <DayPicker
        mode="single"
        timeZone={timezone}
        month={month.toJSDate()}
        selected={currentDate.toJSDate()}
        onSelect={(_, date) => {
          if (!date) return;

          const dateStr = DateTime.fromJSDate(date).startOf('day').toFormat('LL/dd/yyyy');
          const dateInTz = DateTime.fromFormat(dateStr, 'LL/dd/yyyy', {
            zone: timezone,
          }).startOf('day');

          setCurrentDate(dateInTz);
        }}
        styles={{ caption: { display: 'none' } }}
        hideNavigation
        showOutsideDays={false}
        classNames={{
          today: '',
        }}
        components={{
          DayButton: (props) => {
            const { type } = getSlotAvailabilityType({ appointmentsByDay, date: props.day.date });
            const isSelected = props.modifiers.selected;
            const isToday = props.modifiers.today;
            return (
              <button
                {...props}
                style={isSelected ? { backgroundColor: 'var(--blue-100) !important' } : {}}
                className={cn(props.className, '!border-none', 'flex flex-col gap-y-1 h-12 w-12')}
              >
                <span
                  className={cn('p-1', isToday && '!bg-blue-600 text-white rounded-full w-6 h-6')}
                >
                  {props.day.date.getDate()}
                </span>
                <AvailabilityDot type={type} />
              </button>
            );
          },
        }}
      />
      <AvailabilityLegend />
    </div>
  );
}
