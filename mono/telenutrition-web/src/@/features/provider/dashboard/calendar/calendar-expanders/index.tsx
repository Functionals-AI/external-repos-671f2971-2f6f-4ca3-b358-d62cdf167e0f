import _ from 'lodash';
import { CalendarItemHour } from '@/selectors/calendarItemsSelector';
import { useState, useMemo, createContext, useContext, PropsWithChildren } from 'react';
import * as Helpers from './helpers';
import { DeveloperError } from 'utils/errors';

const CalendarExpanderContext = createContext<null | ReturnType<typeof useCalendarExpanders>>(null);

export function useCalendarExpanderContext() {
  const context = useContext(CalendarExpanderContext);
  if (!context) {
    throw new DeveloperError(
      'useCalendarExpanderContext must be used within a CalendarExpanderProvider',
    );
  }

  return context;
}

export function CalendarExpanderProvider({
  children,
  ...props
}: PropsWithChildren<ReturnType<typeof useCalendarExpanders>>) {
  return (
    <CalendarExpanderContext.Provider value={props}>{children}</CalendarExpanderContext.Provider>
  );
}

interface UseCalendarExpandersParams {
  calendarItems: CalendarItemHour[] | CalendarItemHour[][];
  timezone: string;
}

export interface UseCalendarExpandersResult {
  isTopExpanded: boolean;
  setIsTopExpanded: (expanded: boolean) => void;
  isBottomExpanded: boolean;
  setIsBottomExpanded: (expanded: boolean) => void;
  firstVisibleHour: number;
  lastVisibleHour: number;
  isFirstVisibleHour: (hour: number) => boolean;
  isLastVisibleHour: (hour: number) => boolean;
  getFilteredCalendarItems: (items: CalendarItemHour[]) => CalendarItemHour[];
}

export function useCalendarExpanders({
  calendarItems,
  timezone,
}: UseCalendarExpandersParams): UseCalendarExpandersResult {
  const [isTopExpanded, setIsTopExpanded] = useState(false);
  const [isBottomExpanded, setIsBottomExpanded] = useState(false);

  const { firstVisibleHour, lastVisibleHour } = useMemo(
    () => Helpers.getFirstAndLastHours(_.flatten(calendarItems), timezone),
    [calendarItems],
  );

  function isFirstVisibleHour(hour: number) {
    return hour === firstVisibleHour;
  }
  function isLastVisibleHour(hour: number) {
    return hour === lastVisibleHour;
  }

  function getFilteredCalendarItems(items: CalendarItemHour[]) {
    let filteredCalendarItems = items;
    if (!isTopExpanded) {
      filteredCalendarItems = filteredCalendarItems.filter(
        (item) => item.topOfHourTimeslot.dateTime.setZone(timezone).hour >= firstVisibleHour,
      );
    }
    if (!isBottomExpanded) {
      filteredCalendarItems = filteredCalendarItems.filter(
        (item) => item.topOfHourTimeslot.dateTime.setZone(timezone).hour <= lastVisibleHour,
      );
    }
    return filteredCalendarItems;
  }

  return {
    isTopExpanded,
    setIsTopExpanded,
    isBottomExpanded,
    setIsBottomExpanded,
    firstVisibleHour,
    lastVisibleHour,
    isFirstVisibleHour,
    isLastVisibleHour,
    getFilteredCalendarItems,
  };
}
