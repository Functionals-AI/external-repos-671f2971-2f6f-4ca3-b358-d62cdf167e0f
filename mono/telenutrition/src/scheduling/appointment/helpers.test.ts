import { DateTime } from 'luxon';
import { formatTimeFields } from './helpers';

describe('formatTimeFields', () => {
  it('should correctly calculate start_time for UTC timezone', () => {
    const startTimestamp = DateTime.fromISO('2025-03-15T14:00:00+00:00');
    const result = formatTimeFields(startTimestamp, 'UTC');
    expect(result.start_time).toBe('14:00');
  });

  it('should correctly calculate start_time for a different timezone', () => {
    const startTimestamp = DateTime.fromISO('2025-03-15T14:00:00+00:00');
    const result = formatTimeFields(startTimestamp, 'America/New_York');
    expect(result.start_time).toBe('10:00');
  });

  it('should handle daylight saving time transitions correctly', () => {
    const startTimestamp = DateTime.fromISO('2025-03-09T07:00:00+00:00');
    const result = formatTimeFields(startTimestamp, 'America/New_York');
    expect(result.start_time).toBe('03:00');
  });

  it('should default to the original timestamp if no timezone is provided', () => {
    const startTimestamp = DateTime.fromISO('2025-03-15T14:00:00+00:00', { setZone: true });
    expect(startTimestamp.zoneName).toBe('UTC');

    const result = formatTimeFields(startTimestamp);
    expect(result.start_time).toBe('14:00');
  });

  it('should handle invalid timestamps gracefully', () => {
    const startTimestamp = DateTime.invalid('Invalid timestamp');
    const result = formatTimeFields(startTimestamp, 'UTC');
    expect(result.start_time).toBe('Invalid DateTime');
  });

  it('should format time correctly for a timezone without DST (e.g., Arizona)', () => {
    const startTimestamp = DateTime.fromISO('2025-07-15T14:00:00+00:00');
    const result = formatTimeFields(startTimestamp, 'America/Phoenix'); // Arizona does not observe DST
    expect(result.start_time).toBe('07:00');
  });

  it('should format February 29 on a leap year correctly', () => {
    const startTimestamp = DateTime.fromISO('2024-02-29T14:00:00+00:00');
    const result = formatTimeFields(startTimestamp, 'UTC');
    expect(result.date).toBe('02/29/2024');
    expect(result.start_time).toBe('14:00');
  });

  it('should handle timezones with half-hour offsets (e.g., IST)', () => {
    const startTimestamp = DateTime.fromISO('2025-03-15T14:00:00+00:00');
    const result = formatTimeFields(startTimestamp, 'Asia/Kolkata');
    expect(result.start_time).toBe('19:30');
  });

  it('should set start_timestamp to match the correct local time', () => {
    const startTimestamp = DateTime.fromISO('2025-03-15T14:00:00+00:00');
    const result = formatTimeFields(startTimestamp, 'America/New_York');
    const expected = DateTime.fromISO('2025-03-15T10:00:00', { zone: 'America/New_York' });
    expect(result.start_time).toBe(expected.toFormat('HH:mm'));
  });
});
