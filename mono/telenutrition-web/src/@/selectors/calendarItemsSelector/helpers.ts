import { DateTime } from 'luxon';

export type TimeSlot = {
  display: string;
  // Date.getTime()
  time: number;
  dateTime: DateTime;
};

interface Get30MinuteTimeslotsPerHourParams {
  displayTimezone: string;
  date: Date;
}

export function get30MinuteTimeslotsPerHour({
  displayTimezone,
  date,
}: Get30MinuteTimeslotsPerHourParams): TimeSlot[][] {
  const slots: TimeSlot[][] = [];

  let start = DateTime.fromJSDate(date).setZone(displayTimezone).startOf('day');
  const end = start.plus({ hour: 23, minute: 30 });

  const INTERVAL_MINUTES = 60;

  const MAX = 100;
  let count = 0;

  while (start <= end && count < MAX) {
    count++;

    const topOfHour: TimeSlot = {
      display: start.toFormat('h:mma').replace('AM', 'am').replace('PM', 'pm'),
      time: start.toJSDate().getTime(),
      dateTime: start,
    };

    const middleOfHourDateTime = start.plus({ minutes: 30 });

    const middleOfHour: TimeSlot = {
      display: middleOfHourDateTime.toFormat('h:mma').replace('AM', 'am').replace('PM', 'pm'),
      time: middleOfHourDateTime.toJSDate().getTime(),
      dateTime: middleOfHourDateTime,
    };

    start = start.plus({ minutes: INTERVAL_MINUTES });

    slots.push([topOfHour, middleOfHour]);
  }

  return slots;
}
