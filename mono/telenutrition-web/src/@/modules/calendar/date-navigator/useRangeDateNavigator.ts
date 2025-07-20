import { useContext, useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import { TimezoneContext } from '@/modules/dates/context';
import { DisabledDate } from '@/ui-components/calendar/day-picker';

// Negative modulos don't work in normal JS
function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export function getDateRange({
  defaultDate,
  interval,
  pivotDate,
}: {
  defaultDate: DateTime;
  interval: number;
  pivotDate?: DateTime;
}): DateTime[] {
  const offset = pivotDate ? mod(defaultDate.diff(pivotDate, 'days').days, interval) : 0;
  const start = defaultDate.minus({ days: offset });
  return [
    start,
    ...Array.from({ length: interval - 1 }, (value, index) => start.plus({ days: index + 1 })),
  ];
}

export interface RangeDateNavigatorReturn {
  type: 'range';
  currentDates: DateTime[];
  prev: () => void;
  next: () => void;
  today: () => void;
  setCurrentDate: (date: DateTime) => void;
  month: DateTime;
  setMonth: (date: DateTime) => void;
  prevMonth: () => void;
  nextMonth: () => void;
  disabledDates?: DisabledDate[];
}

type RangeDateNavigatorParamsValue =
  | {
      value: DateTime;
    }
  | {
      defaultDate?: DateTime;
    };

type RangeDateNavigatorParams = RangeDateNavigatorParamsValue & {
  onChange?: (dates: DateTime[]) => void;
  interval: number;
  pivotDate?: DateTime;
  disabledDates?: DisabledDate[];
};

export function useRangeDateNavigator({
  onChange,
  interval,
  pivotDate,
  ...props
}: RangeDateNavigatorParams): RangeDateNavigatorReturn {
  const getValueToUse = () => ('value' in props ? props.value : props.defaultDate) ?? TODAY;
  const timezoneContext = useContext(TimezoneContext);
  const TODAY = DateTime.now()
    .setZone(timezoneContext?.timezone ?? undefined)
    .startOf('day');

  const [month, setMonth] = useState(() => {
    return getValueToUse();
  });

  const [current, setCurrent] = useState<DateTime[]>(() => {
    return getDateRange({ defaultDate: getValueToUse(), interval, pivotDate });
  });

  useEffect(() => {
    setCurrent(getDateRange({ defaultDate: getValueToUse(), interval, pivotDate }));
  }, ['value' in props ? props.value : props.defaultDate, interval]);

  const currentDates = current;
  const next = () => {
    const newDates = getDateRange({
      defaultDate: currentDates[0].plus({ days: interval }),
      interval,
      pivotDate,
    });
    setCurrent(newDates);
    onChange?.(newDates);
  };

  const prev = () => {
    const newDates = getDateRange({
      defaultDate: currentDates[0].minus({ days: interval }),
      interval,
      pivotDate,
    });
    setCurrent(newDates);
    onChange?.(newDates);
  };

  const prevMonth = () => {
    const newDate = month.minus({ month: 1 });
    setMonth(newDate);
  };

  const nextMonth = () => {
    const newDate = month.plus({ month: 1 });
    setMonth(newDate);
  };

  const today = () => {
    const newRange = getDateRange({ defaultDate: TODAY, interval, pivotDate });
    setCurrent(newRange);
    setMonth(TODAY);
    onChange?.(newRange);
  };

  const setCurrentDate = (date: DateTime) => {
    const range = getDateRange({ defaultDate: date, interval, pivotDate });
    setCurrent(range);

    setMonth(date);
    onChange?.(range);
  };

  return {
    currentDates,
    prev,
    next,
    today,
    setCurrentDate: setCurrentDate,
    month,
    setMonth,
    prevMonth,
    nextMonth,
    type: 'range',
    disabledDates: props.disabledDates,
  };
}
