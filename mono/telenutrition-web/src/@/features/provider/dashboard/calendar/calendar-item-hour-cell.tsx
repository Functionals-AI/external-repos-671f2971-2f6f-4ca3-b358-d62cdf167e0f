import { CSSProperties, ReactNode, forwardRef } from 'react';
import { cn } from '@/utils';
import { SlotTimingType } from './types';

export type CellSize = 'sm' | 'md';

const getCellHeightClassname = (size: CellSize) => (size === 'sm' ? 'h-[100px]' : 'h-[120px]');
export const getTimeLabelWidgthClassName = (size: CellSize) =>
  size === 'sm' ? 'w-[80px]' : 'w-[80px]';

interface CalendarItemHourCellProps {
  timeLabel: string;
  content: ReactNode;
  banner?: CalendarItemBannerProps;
  size: CellSize;
}

const CalendarItemHourCell = forwardRef<HTMLDivElement, CalendarItemHourCellProps>(
  function CalendarItemHourCell({ timeLabel, content, banner, size }, ref) {
    return (
      <div
        ref={ref}
        data-test={timeLabel}
        data-testid={'calendar-item-hour'}
        className={cn('flex border-b border-b-border-color-light relative')}
      >
        {/* Left timeslots */}
        <div
          className={cn(
            'flex flex-col relative bg-white border-r border-r-border-color-light',
            getTimeLabelWidgthClassName(size),
          )}
        >
          {banner && <CalendarItemBanner {...banner} />}
          <div
            className={cn(
              'flex items-start pt-6 px-1 justify-center text-type-secondary text-sm',
              getCellHeightClassname(size),
            )}
          >
            <p>{timeLabel}</p>
          </div>
        </div>
        {/* Main content */}
        <div className={cn('flex flex-col flex-1 relative', getCellHeightClassname(size))}>
          {content}
        </div>
      </div>
    );
  },
);

export type CalendarItemBannerProps = {
  className: string;
  text: string;
  positionOfHour: 'top' | 'middle';
};

function CalendarItemBanner({ className, text, positionOfHour }: CalendarItemBannerProps) {
  return (
    <div
      className={cn(
        'absolute w-full h-6 flex items-center justify-center',
        positionOfHour === 'middle' && 'top-20 mt-[0.5px]',
        className,
      )}
    >
      <p className="text-xs text-white text-center">{text}</p>
    </div>
  );
}

interface CalendarHourItemCellContentProps {
  children: ReactNode;
  className?: string;
  dataTestId: string;
  style?: CSSProperties;
  dataCy?: string;
  slotTimingType: SlotTimingType;
}

export const CalendarHourItemCellContent = forwardRef<
  HTMLDivElement,
  CalendarHourItemCellContentProps
>(function CalendarHourItemCellContent(
  { children, className, dataTestId, style, dataCy, slotTimingType, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      style={style}
      data-testid={dataTestId}
      data-cy={dataCy}
      className={cn(
        'flex items-start py-1 px-2 w-full h-full justify-between border-l-4 border-l-transparent',
        'border-r border-r-neutral-150',
        slotTimingType.type === 'past' && 'opacity-60 hover:opacity-100',
        className,
      )}
    >
      {children}
    </div>
  );
});

export default CalendarItemHourCell;
