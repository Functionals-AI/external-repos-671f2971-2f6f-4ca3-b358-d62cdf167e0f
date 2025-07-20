import { Button } from '@/ui-components/button';
import ButtonBar from '@/ui-components/button/group';
import { DateTime } from 'luxon';
import { useCallback, useMemo, useState } from 'react';
import { DayPicker } from '@/ui-components/calendar/day-picker';
import { Day } from '@/ui-components/week-view-table';
import { DeveloperError } from 'utils/errors';
import Icon from '@/ui-components/icons/Icon';
import DatePickerPopover from '../date-navigator/date-picker-popover';
import { useRangeDateNavigator } from '../date-navigator/useRangeDateNavigator';

const dayToIndexMap: Record<Day, number> = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 7,
};

export type UseWeekPickerReturn = {
  days: Day[];
  selectedDates: Date[];
  onSelectedDay: (_days: unknown, selectedDay: Date) => void;
  onReset: () => void;
  onNaviagateNextWeek: () => void;
  onNavigateLastWeek: () => void;

  timezone: string;

  // get specific date of this day for the selected week
  getWeekDateForDay: (day: Day) => Date;
  getWeekDateAndTimeForDay: (day: Day, time: string, timezone: string) => Date;
};

// Alex Y: this hook uses and returns JS Dates, which causes a lot of headaches dealing
// with timezones and converting to Luxon DateTimes. Converting to Luxon might ease some difficulties
export function useWeekPicker(timezone: string, initialDate?: Date): UseWeekPickerReturn {
  const getWeekRange = useCallback(
    (date: Date): Date[] => {
      const asDateTime = DateTime.fromJSDate(date, { zone: timezone });
      // last Sunday
      const startOfWeek =
        asDateTime.weekday === 7
          ? asDateTime.startOf('day')
          : asDateTime.startOf('week').startOf('day').minus({ days: 1 });

      const days: Date[] = [];
      for (let i = 0; i < 7; i++) {
        // we must make a week of JS Dates used mainly for MM/DD/YYYY format
        const dt = startOfWeek.plus({ days: i });
        const jsDate = dt.toJSDate();
        jsDate.setFullYear(dt.year, dt.month - 1, dt.day);
        jsDate.setHours(0);
        days.push(jsDate);
      }

      return days;
    },
    [timezone],
  );

  const date = initialDate ?? new Date();

  const [selectedDates, setDateRange] = useState<Date[]>(() => getWeekRange(date));

  function onSelectedDay(_days: unknown, selectedDay?: Date) {
    if (selectedDay) {
      setDateRange(getWeekRange(selectedDay));
    }
  }

  function onReset() {
    setDateRange(getWeekRange(new Date()));
  }

  function onNaviagateNextWeek() {
    setDateRange((prev) =>
      getWeekRange(
        DateTime.fromJSDate(prev[prev.length - 1])
          .plus({ days: 2 })
          .toJSDate(),
      ),
    );
  }

  function onNavigateLastWeek() {
    setDateRange((prev) =>
      getWeekRange(DateTime.fromJSDate(prev[0]).minus({ days: 1 }).toJSDate()),
    );
  }

  function getWeekDateForDay(day: Day): Date {
    const found = selectedDates.find((date) => {
      return DateTime.fromJSDate(date).weekday === dayToIndexMap[day];
    });
    if (!found) throw new DeveloperError("Couldn't find date for day " + day);

    return found;
  }

  function getWeekDateAndTimeForDay(day: Day, time: string, timezone: string): Date {
    const date = getWeekDateForDay(day);
    const [hour, minute] = time.split(':').map((n) => parseInt(n, 10));

    return DateTime.fromJSDate(date).startOf('day').plus({ hour, minute }).toJSDate();
  }

  return {
    getWeekDateForDay,
    getWeekDateAndTimeForDay,
    selectedDates,
    onSelectedDay,
    onReset,
    onNaviagateNextWeek,
    onNavigateLastWeek,
    timezone,
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  };
}

// This is a pre-built component, but doesn't have to be used
function NavigationBar({
  right,
  ...weekPicker
}: UseWeekPickerReturn & { right?: React.ReactNode }) {
  const dd = useMemo(() => {
    return DateTime.fromJSDate(weekPicker.selectedDates[0]);
  }, [weekPicker.selectedDates[0]]);

  const dateNavigator = useRangeDateNavigator({
    interval: 7,
    value: dd,
    pivotDate: dd.endOf('week').startOf('day'),
  });

  return (
    <ButtonBar className="justify-start">
      <Button
        dataTestId="week-picker-today-button"
        onClick={weekPicker.onReset}
        variant="tertiary"
        leftIcon={{ name: 'calendar-arrow', color: 'fsGreen' }}
      >
        Today
      </Button>
      <Button
        dataTestId="week-picker-nav-last-week"
        size="sm"
        className="px-3"
        variant="tertiary"
        onClick={weekPicker.onNavigateLastWeek}
      >
        <Icon name="chevron-left" />
      </Button>
      <Button
        size="sm"
        dataTestId="week-picker-nav-next-week"
        className="px-3"
        variant="tertiary"
        onClick={weekPicker.onNaviagateNextWeek}
      >
        <Icon name="chevron-right" />
      </Button>
      <DatePickerPopover
        {...weekPicker}
        nextMonth={() => dateNavigator.nextMonth()}
        prevMonth={() => dateNavigator.prevMonth()}
        prev={dateNavigator.prev}
        next={dateNavigator.next}
        today={dateNavigator.today}
        setCurrentDate={(date) => weekPicker.onSelectedDay([], date.toJSDate())}
        setMonth={dateNavigator.setMonth}
        month={dateNavigator.month}
        type="range"
        currentDates={dateNavigator.currentDates}
        PopoverTriggerComponent={
          <Button size="sm" variant="tertiary">
            {DateTime.fromJSDate(weekPicker.selectedDates[0]).toFormat('MMMM yyyy')}
          </Button>
        }
      />
      <ButtonBar.Group>{right && right}</ButtonBar.Group>
    </ButtonBar>
  );
}

function WeekPickerCalendar({ selectedDates, onSelectedDay }: UseWeekPickerReturn) {
  return (
    <DayPicker
      mode="multiple"
      selected={selectedDates}
      onSelect={onSelectedDay}
      modifiers={{
        weekends: selectedDates.filter((date) => DateTime.fromJSDate(date).weekday > 5),
        saturday: selectedDates.filter((date) => DateTime.fromJSDate(date).weekday === 6),
        sunday: selectedDates.filter((date) => DateTime.fromJSDate(date).weekday === 7),
      }}
      modifiersClassNames={{
        weekends: 'bg-fs-green-300 text-white',
        saturday: 'rounded-r-md',
        sunday: 'rounded-l-md',
      }}
      classNames={{
        day: 'h-8 w-8 p-0 font-normal aria-selected:opacity-100 rounded-none border-0',
        day_outside: '',
      }}
      styles={{ caption: { display: 'none' } }}
      hideNavigation
    />
  );
}

export { NavigationBar, WeekPickerCalendar };
