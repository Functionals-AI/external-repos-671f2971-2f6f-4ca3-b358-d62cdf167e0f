import { DateTime } from 'luxon';
import { useContext } from 'react';
import { TimezoneContext } from './context';

export function useDateHelpers() {
  const ctx = useContext(TimezoneContext);

  const timezone = ctx?.timezone ?? 'America/Los_Angeles';

  function asTime(date: string | Date | DateTime, withTimezone: boolean = true) {
    const asDateTime = DateTime.isDateTime(date)
      ? date
      : typeof date === 'string'
        ? DateTime.fromJSDate(new Date(date))
        : DateTime.fromJSDate(date);

    return asDateTime
      .setZone(timezone)
      .toFormat(`h:mma ${withTimezone ? 'ZZZZ' : ''}`)
      .replace('AM', 'am')
      .replace('PM', 'pm');
  }

  function asBasicDate(
    date: string | Date | DateTime,
    format?: 'short' | 'long' | 'full' | 'LL dd yyyy' | 'LLL d yyyy',
  ) {
    const asDateTime = DateTime.isDateTime(date)
      ? date
      : typeof date === 'string'
        ? DateTime.fromJSDate(new Date(date))
        : DateTime.fromJSDate(date);

    return asDateTime
      .setZone(timezone)
      .toFormat(
        format === 'short'
          ? 'LLL d'
          : format === 'full'
            ? 'LLLL d, yyyy'
            : format === 'LL dd yyyy'
              ? 'LL dd yyyy'
              : format ?? 'LL/dd/yyyy',
      );
  }

  return { asTime, asBasicDate };
}

export function AsTime({
  children,
  withTimezone,
}: {
  children: string | Date | DateTime;
  withTimezone?: boolean;
}) {
  const helpers = useDateHelpers();

  return <>{helpers.asTime(children, withTimezone)}</>;
}

export function AsBasicDate({
  format,
  children,
}: {
  children: string | Date | DateTime;
  format?: 'short' | 'long' | 'full' | 'LL dd yyyy';
}) {
  const helpers = useDateHelpers();

  return <>{helpers.asBasicDate(children, format)}</>;
}
