'use client';

import * as React from 'react';
import {
  DayFlag,
  DayPicker as ReactDayPicker,
  Day as DayComponent,
  Matcher,
} from 'react-day-picker';

import { cn } from '@/utils';
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/ui-components/tooltip';
import { DateTime } from 'luxon';
import { TooltipPortal } from '@radix-ui/react-tooltip';

export type DisabledDate = {
  date: DateTime;
  // Shows in tooltip when hovered and also error message when date entered manually
  tooltipMessage?: string;
};

export type DayPickerProps = React.ComponentProps<typeof ReactDayPicker> & {
  disabledDates?: DisabledDate[];
  hidden?: Matcher[];
};

function DayPicker({
  className,
  classNames,
  showOutsideDays = true,
  components,
  disabledDates,
  hidden,
  ...props
}: DayPickerProps) {
  return (
    <ReactDayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      modifiers={{
        weekend: {
          dayOfWeek: [0, 6],
        },
      }}
      modifiersClassNames={{
        weekend: '[&>button]:!bg-neutral-115 !text-neutral-400',
      }}
      classNames={{
        today: '[&>button]:!bg-blue-100',
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 justify-center',
        month: 'space-y-4',
        caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-medium',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex gap-x-[2px]',
        head_cell: 'text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]',
        row: 'flex w-full mt-2 gap-x-[2px]',
        day_button: cn(
          'flex items-center justify-center rounded-md h-10 w-10',
          'border border-neutral-150 transition-all',
          'text-neutral-600 text-sm',
        ),
        day: 'p-[2px]',
        selected: '[&>button]:!border-2 [&>button]:!border-blue-400',
        [DayFlag.outside]:
          'day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
        [DayFlag.disabled]: 'text-muted-foreground opacity-50',
        [DayFlag.hidden]: 'opacity-30 pointer-events-none',
        month_caption: 'hidden',
        weekday: 'text-neutral-200 font-normal',
        ...classNames,
      }}
      hidden={[...(hidden ?? []), ...(disabledDates?.map((d) => d.date.toJSDate()) ?? [])]}
      components={{
        Day: (dayProps) => {
          // @ts-ignore
          const dataDay = dayProps['data-day'] as string | undefined;
          const found = disabledDates?.find((d) => d.date.toFormat('yyyy-LL-dd') === dataDay);
          if (found) {
            if (found.tooltipMessage) {
              return (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DayComponent data-hidden={true} {...dayProps} />
                    </TooltipTrigger>
                    <TooltipPortal>
                      <TooltipContent>
                        <TooltipArrow />
                        {found.tooltipMessage}
                      </TooltipContent>
                    </TooltipPortal>
                  </Tooltip>
                </TooltipProvider>
              );
            } else {
              return <DayComponent data-hidden={true} {...dayProps} />;
            }
          }

          return <DayComponent {...dayProps} />;
        },
        ...components,
      }}
      {...props}
    />
  );
}
DayPicker.displayName = 'DayPicker';

export { DayPicker };
