import { TimezoneContext } from '@/modules/dates/context';
import { Badge, BadgeVariant } from '@/ui-components/badge';
import { DateTime } from 'luxon';
import { ReactNode, useContext } from 'react';

interface TimeDifferenceBadgeProps {
  variant?: BadgeVariant;
  timezone: string | null;
  date: Date | DateTime;
  label: ReactNode;
}

/**
 * Shows a badge with the time of the date in the given timezone, if the timezone is different from the TimezoneContext (displayed timezone)
 */
export default function TimeDifferenceBadge({
  variant,
  date,
  timezone,
  label,
}: TimeDifferenceBadgeProps) {
  const context = useContext(TimezoneContext);

  if (!context) return null;

  if (timezone === null || context.timezone === timezone) return null;

  const dateTime = DateTime.isDateTime(date) ? date : DateTime.fromJSDate(date);

  const dateDisplay = dateTime.setZone(timezone).toFormat('h:mma');

  return (
    <Badge className="h-6 w-fit" variant={variant ?? 'neutral'} leftIconName={'clock'}>
      {dateDisplay} {label}
    </Badge>
  );
}
