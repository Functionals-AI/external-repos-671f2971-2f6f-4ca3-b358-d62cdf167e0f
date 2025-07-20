import { Button } from '@/ui-components/button';
import { Trans } from 'react-i18next';
import { DateTime } from 'luxon';

import CellSkeleton from '../cell-skeleton';
import { useWeekViewSchedulingContext } from '../context';
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/ui-components/tooltip';
import { DayScheduleType } from '..';
import { cn } from '@/utils';

export default function Available({
  dateTime,
  appointmentIds,
  duration,
  dayScheduleType,
}: {
  dateTime: DateTime;
  appointmentIds: {
    primary: number;
    secondary?: number;
  };
  duration: 30 | 60;
  dayScheduleType: DayScheduleType;
}) {
  const { openScheduleSlotOptionsModal } = useWeekViewSchedulingContext();

  return (
    <TooltipProvider>
      <Tooltip {...(dayScheduleType === 'allowed' && { open: false })}>
        <TooltipTrigger
          className={cn(
            'flex items-center justify-center h-full w-full cursor-default',
            dayScheduleType !== 'allowed' && 'opacity-60',
          )}
          onClick={(e) => {
            e.preventDefault();
          }}
          asChild={dayScheduleType === 'allowed'}
        >
          <CellSkeleton
            dataTestId={`available-${duration}-cell`}
            className="group text-neutral-700 flex items-center justify-center"
          >
            <Button
              className={cn('invisible', dayScheduleType === 'allowed' && 'group-hover:visible')}
              variant="tertiary"
              onClick={() =>
                openScheduleSlotOptionsModal({ type: 'create', dateTime, appointmentIds, duration })
              }
            >
              <Trans>Select</Trans>
            </Button>
          </CellSkeleton>
        </TooltipTrigger>
        <TooltipContent>
          <TooltipArrow />
          <Trans>Members cannot schedule more than one appointment per week.</Trans>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
