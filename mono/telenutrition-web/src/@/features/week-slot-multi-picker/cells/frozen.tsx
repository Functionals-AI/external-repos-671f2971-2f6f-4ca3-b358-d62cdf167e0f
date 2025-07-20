import { Trans } from 'react-i18next';
import { DateTime } from 'luxon';

import { Button } from '@/ui-components/button';
import CellSkeleton from '../cell-skeleton';
import { useWeekViewSchedulingContext } from '../context';

import { DayScheduleType } from '..';
import { cn } from '@/utils';

export default function Frozen({
  dateTime,
  duration,
  timeDisplay,
  dayScheduleType,
}: {
  dateTime: DateTime;
  duration: number;
  timeDisplay: string;
  dayScheduleType: DayScheduleType;
}) {
  const { openUnfreezeSlotModal } = useWeekViewSchedulingContext();
  return (
    <CellSkeleton
      className={cn(
        'group bg-neutral-115 text-neutral-400 flex items-center justify-center',
        dayScheduleType !== 'allowed' && 'opacity-60',
      )}
    >
      <Button
        className={cn('invisible', dayScheduleType === 'allowed' && 'group-hover:visible')}
        variant="tertiary"
        onClick={() =>
          openUnfreezeSlotModal({
            dateTime,
            timeDisplay,
            duration,
          })
        }
      >
        <Trans>Unfreeze</Trans>
      </Button>
    </CellSkeleton>
  );
}
