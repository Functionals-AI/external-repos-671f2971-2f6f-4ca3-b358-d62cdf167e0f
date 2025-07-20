'use client';

import { ReactNode } from 'react';
import { Button } from '@/ui-components/button';
import { SingleDateNavigatorReturn } from './useSingleDateNavigator';
import { RangeDateNavigatorReturn } from './useRangeDateNavigator';
import DatePickerPopover, { DatePickerPopoverViewType } from './date-picker-popover';
import { DayPickerProps } from 'react-day-picker';
import Icon from '@/ui-components/icons/Icon';

export type DateNavigatorProps = SingleDateNavigatorReturn | RangeDateNavigatorReturn;

export default function DateNavigator(
  props: DateNavigatorProps & {
    components?: DayPickerProps['components'];
    renderAdditionalContentChildren?: (viewType: DatePickerPopoverViewType) => ReactNode;
  },
) {
  const displayed = (() => {
    if (props.type === 'single') {
      if (props.navigationType === 'day') {
        return props.currentDate.toFormat('LLL d');
      } else {
        return props.month.toFormat('LLL yyyy');
      }
    }

    const rangeStartDT = props.currentDates[0];
    const rangeEndDT = props.currentDates[props.currentDates.length - 1];
    if (rangeStartDT.month === rangeEndDT.month) {
      return `${rangeStartDT.toFormat('LLL d')} - ${rangeEndDT.toFormat('d')}`;
    } else {
      return `${rangeStartDT.toFormat('LLL d')} - ${rangeEndDT.toFormat('LLL d')}`;
    }
  })();

  const prevFn =
    props.type !== 'single' || props.navigationType === 'day' ? props.prev : props.prevMonth;
  const nextFn =
    props.type !== 'single' || props.navigationType === 'day' ? props.next : props.nextMonth;

  return (
    <div>
      <NavigatorControls
        disablePrevNavigation={
          'disablePrevDayNavigation' in props ? props.disablePrevDayNavigation : false
        }
        disableNextNavigation={
          'disableNextDayNavigation' in props ? props.disableNextDayNavigation : false
        }
        onLeftClick={prevFn}
        onRightClick={nextFn}
      >
        <DatePickerPopover
          {...props}
          components={props.components}
          renderAdditionalContentChildren={props.renderAdditionalContentChildren}
          PopoverTriggerComponent={
            <Button
              dataTestId="date-navigator-main-button"
              className="min-w-fit text-neutral-1500 !px-1"
              variant="tertiary"
            >
              {displayed}
            </Button>
          }
        />
      </NavigatorControls>
    </div>
  );
}

interface NavigatorControlsProps {
  onLeftClick: () => void;
  onRightClick: () => void;
  disablePrevNavigation?: boolean;
  disableNextNavigation?: boolean;
  children: ReactNode;
}

export function NavigatorControls({
  onLeftClick,
  onRightClick,
  disablePrevNavigation,
  disableNextNavigation,
  children,
}: NavigatorControlsProps) {
  return (
    <div className="flex items-center gap-x-1">
      <Button
        disabled={disablePrevNavigation}
        className="w-8 h-8 !p-0 min-w-0"
        data-testid="date-navigator-left-button"
        onClick={onLeftClick}
        variant="quaternary"
      >
        <Icon name="chevron-left" size="lg" color="neutral" />
      </Button>
      {children}
      <Button
        disabled={disableNextNavigation}
        className="w-8 h-8 !p-0 min-w-0"
        data-testid="date-navigator-right-button"
        onClick={onRightClick}
        variant="quaternary"
      >
        <Icon name="chevron-right" size="lg" color="neutral" />
      </Button>
    </div>
  );
}
