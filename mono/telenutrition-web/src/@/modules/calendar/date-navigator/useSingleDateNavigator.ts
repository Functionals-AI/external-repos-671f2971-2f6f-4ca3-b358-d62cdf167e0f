import { DateTime } from 'luxon';
import { useContext, useEffect, useState } from 'react';
import { TimezoneContext } from '@/modules/dates/context';
import { DisabledDate } from '@/ui-components/calendar/day-picker';

type SingleDateNavigatorValueParams = { value: DateTime } | { defaultDate?: DateTime };

type NavigationType = 'day' | 'month';

type SingleDateNavigatorParams = SingleDateNavigatorValueParams & {
  navigationType: NavigationType;
  onChange?: (date: DateTime) => void;
  min?: DateTime;
  max?: DateTime;
  disabledDates?: DisabledDate[];
};

export interface SingleDateNavigatorReturn {
  type: 'single';
  navigationType: NavigationType;
  currentDate: DateTime;
  prev: () => void;
  next: () => void;
  today: () => void;
  setCurrentDate: (date: DateTime) => void;
  month: DateTime;
  setMonth: (date: DateTime) => void;
  prevMonth: () => void;
  nextMonth: () => void;
  disablePrevDayNavigation?: boolean;
  disableNextDayNavigation?: boolean;
  min?: DateTime;
  max?: DateTime;
  disabledDates?: DisabledDate[];
}

export function useSingleDateNavigator({
  onChange,
  min,
  max,
  ...props
}: SingleDateNavigatorParams): SingleDateNavigatorReturn {
  const getValueToUse = () => {
    const defaultDateToUse = ('value' in props ? props.value : props.defaultDate) ?? TODAY;

    if (!min) return defaultDateToUse;

    return DateTime.max(min, defaultDateToUse);
  };
  const timezoneContext = useContext(TimezoneContext);
  const TODAY = DateTime.now()
    .setZone(timezoneContext?.timezone ?? undefined)
    .startOf('day');

  const [month, setMonth] = useState(() => {
    return getValueToUse();
  });

  const [current, setCurrent] = useState<DateTime>(() => {
    return getValueToUse();
  });

  function setCurrentDate(date: DateTime) {
    setCurrent(date);
    onChange?.(date);
  }

  useEffect(() => {
    setCurrent(getValueToUse());
  }, []);

  useEffect(
    () => {
      if ('value' in props) {
        setCurrent(props.value);
      }
    },
    'value' in props ? [props.value] : [],
  );

  const currentDate = current;
  const prev = () => {
    const newDate = currentDate.minus({ day: 1 });
    setCurrent(newDate);
    onChange?.(newDate);

    if (newDate.month !== month.month) {
      setMonth(newDate.startOf('month'));
    }
  };

  const next = () => {
    const newDate = currentDate.plus({ day: 1 });
    setCurrent(newDate);
    onChange?.(newDate);

    if (newDate.month !== month.month) {
      setMonth(newDate.startOf('month'));
    }
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
    const today = TODAY as DateTime<true>;
    setCurrent(today);
    setMonth(today);
    onChange?.(today);
  };

  const disablePrevDayNavigation = min && currentDate.startOf('day') <= min.startOf('day');
  const disableNextDayNavigation = max && currentDate.startOf('day') >= max.startOf('day');

  return {
    currentDate: current as DateTime,
    prev,
    next,
    today,
    setCurrentDate,
    month,
    setMonth,
    prevMonth,
    nextMonth,
    type: 'single',
    disablePrevDayNavigation,
    disableNextDayNavigation,
    min,
    max,
    navigationType: props.navigationType,
    disabledDates: props.disabledDates,
  };
}
