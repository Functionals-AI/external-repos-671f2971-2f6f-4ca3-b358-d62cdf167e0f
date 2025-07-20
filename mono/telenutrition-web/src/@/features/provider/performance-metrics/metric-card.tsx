import Card from '@/ui-components/card';
import Icon from '@/ui-components/icons/Icon';
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/ui-components/tooltip';
import { cn } from '@/utils';
import { ReactNode } from 'react';

export default function MetricCard({
  title,
  value,
  extra,
  className,
  tooltip,
}: {
  title: ReactNode;
  value: ReactNode;
  extra?: ReactNode;
  className?: string;
  tooltip?: React.ReactNode;
}) {
  return (
    <Card className={cn('p-4', className)}>
      <div className="flex flex-col gap-y-4">
        <span className="flex gap-x-2 items-center">
          <h4 className="text-neutral-600 text-xl font-semibold">{title}</h4>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  onClick={(e) => {
                    e.preventDefault();
                  }}
                >
                  <Icon size="xs" name="info-circle" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[20rem]">
                  {tooltip}
                  <TooltipArrow className="fill-neutral-1500" />
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </span>
        <div className="flex gap-x-2">
          <p className="text-neutral-1500 text-4xl">{value}</p>
          {extra && (
            <div className="text-sm text-neutral-600 flex items-center gap-x-2">{extra}</div>
          )}
        </div>
      </div>
    </Card>
  );
}
