import { DateTime } from 'luxon';
import { SlotTimingType } from './types';
import { DeveloperError } from 'utils/errors';
import { CalendarItemHour } from '@/selectors/calendarItemsSelector';
import { CalendarItemBannerProps } from './calendar-item-hour-cell';

// This can be used for top or middle of hour slots
export function getSlotTimingType({
  dateTime,
  duration,
}: {
  dateTime: DateTime;
  duration: number;
}): SlotTimingType {
  const now = DateTime.now();
  const isToday = dateTime.toFormat('LL/dd/yyyy') === now.toFormat('LL/dd/yyyy');

  if (isToday && now >= dateTime && now < dateTime.plus({ minutes: duration })) {
    return {
      type: 'in-progress',
      currentSecond: now.toSeconds() - dateTime.toSeconds(),
    };
  }

  if (isToday && now >= dateTime.minus({ minutes: 5 }) && now < dateTime) {
    return {
      type: 'starting-soon',
    };
  }

  if (now < dateTime) {
    return {
      type: 'future',
    };
  }
  if (now > dateTime.plus({ minutes: duration })) {
    return {
      type: 'past',
    };
  }

  throw new DeveloperError('Unknown HourTimingType');
}

const STARTING_SOON_BANNER = {
  text: 'Starting soon',
  className: 'bg-fs-green-300',
};
const IN_PROGRESS_BANNER = {
  text: 'Now',
  className: 'bg-fs-green-300',
};

export function getCalendarHourSlotBanner(
  calendarHourItem: CalendarItemHour,
  slotTimingType: SlotTimingType,
): CalendarItemBannerProps | null {
  if (calendarHourItem.type === '60-minute-appointment') {
    if (slotTimingType.type === 'in-progress') {
      return { ...IN_PROGRESS_BANNER, positionOfHour: 'top' };
    } else if (slotTimingType.type === 'starting-soon') {
      return { ...STARTING_SOON_BANNER, positionOfHour: 'top' };
    }
  }

  if (calendarHourItem.type === '30-minute-slots') {
    const topOfHourTimingType = getSlotTimingType({
      dateTime: calendarHourItem.topOfHourTimeslot.dateTime,
      duration: 30,
    });
    const middleOfHourTimingType = getSlotTimingType({
      dateTime: calendarHourItem.middleOfHourTimeslot.dateTime,
      duration: 30,
    });

    if (
      topOfHourTimingType.type === 'in-progress' &&
      calendarHourItem.topOfHourAppt?.status === 'f'
    ) {
      return { ...IN_PROGRESS_BANNER, positionOfHour: 'top' };
    }

    if (
      middleOfHourTimingType.type === 'in-progress' &&
      calendarHourItem.middleOfHourAppt?.status === 'f'
    ) {
      return { ...IN_PROGRESS_BANNER, positionOfHour: 'middle' };
    }
    if (
      topOfHourTimingType.type === 'starting-soon' &&
      calendarHourItem.topOfHourAppt?.status === 'f'
    ) {
      return { ...STARTING_SOON_BANNER, positionOfHour: 'top' };
    }

    if (
      middleOfHourTimingType.type === 'starting-soon' &&
      calendarHourItem.middleOfHourAppt?.status === 'f'
    ) {
      return { ...STARTING_SOON_BANNER, positionOfHour: 'middle' };
    }
  }

  return null;
}
