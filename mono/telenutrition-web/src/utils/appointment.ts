import { DateTime } from 'luxon';

export function appointmentStartHasPassed({ startTimestamp }: { startTimestamp: string }): boolean {
  const now = DateTime.now();
  return DateTime.fromISO(startTimestamp) < now;
}
