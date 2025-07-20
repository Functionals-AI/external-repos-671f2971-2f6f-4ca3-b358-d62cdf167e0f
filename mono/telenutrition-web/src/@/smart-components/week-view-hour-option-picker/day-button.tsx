import { DateTime } from 'luxon';

import Dot from '@/icons/dot';
import { cn } from '@/utils';
import { Button } from '@/ui-components/button';
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/ui-components/tooltip';
import { TooltipPortal } from '@radix-ui/react-tooltip';

type AvailabilityType =
  | 'no-availability'
  | 'high-availability'
  | 'medium-availability'
  | 'low-availability';

type DayButtonProps = {
  datetime: DateTime;
  onClick: () => void;
  slotCount: number;
  buttonClassName?: string;
  isActive: boolean;
} & ({ disabled?: false } | { disabled: true; tooltip?: string });

export default function DayButton({
  datetime,
  onClick,
  slotCount,
  buttonClassName,
  isActive,
  ...props
}: DayButtonProps) {
  let type: AvailabilityType = 'no-availability';
  if (slotCount >= 4) type = 'high-availability';
  else if (slotCount >= 2) type = 'medium-availability';
  else if (slotCount >= 1) type = 'low-availability';

  return (
    <div className="flex flex-col items-center w-full">
      <p>{datetime.toFormat('EEEEE')}</p>
      <TooltipProvider>
        <Tooltip {...((!props.disabled || !props.tooltip) && { open: false })}>
          <TooltipTrigger asChild className="!pointer-events-auto">
            <Button
              disabled={props.disabled}
              className={cn(
                'relative',
                'border rounded-lg flex items-center flex-col p-1 h-[2.75rem] bg-transparent w-full',
                'border-neutral-200 hover:border-blue-200 active:border-2',
                'disabled:bg-white border-neutral-200',
                props.disabled && '!border-neutral-115',
                isActive && 'border-blue-400 border-2',
                'hover:bg-transparent ring-offset-0 hover:ring-offset-0 active:ring-offset-0 focus:ring-offset-0 focus:bg-transparent focus:ring-0 hover:ring-0 active:border-blue-400 focus:border-blue-400',
                buttonClassName,
              )}
              onClick={onClick}
              dataTestId={datetime.toLocaleString(DateTime.DATE_SHORT)}
            >
              <div className="text-sm flex-1 flex flex-col justify-start">
                <p
                  className={cn(
                    'text-neutral-600 mt-1',
                    type === 'no-availability' && 'text-neutral-200',
                  )}
                >
                  {datetime.day}
                </p>
              </div>

              {type !== 'no-availability' && (
                <div className="absolute top-4">
                  <Dot
                    className={cn(
                      'inline-block',
                      type === 'low-availability' && 'bg-status-red-400',
                      type === 'medium-availability' && 'bg-status-amber-150',
                      type === 'high-availability' && 'bg-status-green-200',
                    )}
                  />
                </div>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipPortal>
            <TooltipContent>
              <TooltipArrow></TooltipArrow>
              {'tooltip' in props && props.tooltip}
            </TooltipContent>
          </TooltipPortal>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
