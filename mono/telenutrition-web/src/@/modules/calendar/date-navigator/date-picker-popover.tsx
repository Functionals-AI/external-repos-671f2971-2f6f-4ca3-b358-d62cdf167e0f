import { Button } from '@/ui-components/button';
import { DateNavigatorProps, NavigatorControls } from '.';
import { Trans } from 'react-i18next';
import { DayPicker, DayPickerProps } from '@/ui-components/calendar/day-picker';
import { ReactNode, useContext, useMemo, useState } from 'react';
import { DateTime } from 'luxon';
import { cn } from '@/utils';
import ButtonBar from '@/ui-components/button/group';
import { Popover, PopoverContent, PopoverTrigger } from '@/ui-components/popover';
import { TimezoneContext } from '@/modules/dates/context';
import { Matcher } from 'react-day-picker';

export type DatePickerPopoverViewType = 'day' | 'month';

type DatePickerPopoverProps = DateNavigatorProps & {
  PopoverTriggerComponent: ReactNode;
  components?: DayPickerProps['components'];
  renderAdditionalContentChildren?: (viewType: DatePickerPopoverViewType) => ReactNode;
  popoverContentClassName?: string;
};

export default function DatePickerPopover({
  PopoverTriggerComponent,
  components,
  renderAdditionalContentChildren,
  popoverContentClassName,
  ...props
}: DatePickerPopoverProps) {
  const [view, setView] = useState<DatePickerPopoverViewType>('day');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const timezoneContext = useContext(TimezoneContext);
  const timezone = timezoneContext?.timezone ?? undefined;
  const { setCurrentDate } = props;

  return (
    <Popover open={isPopoverOpen} onOpenChange={(open) => setIsPopoverOpen(open)}>
      <Popover open={isPopoverOpen} onOpenChange={(open) => setIsPopoverOpen(open)}>
        <PopoverTrigger asChild>{PopoverTriggerComponent}</PopoverTrigger>
        <PopoverContent
          data-testid="date-picker-popover"
          className={cn('translate-x-16 w-[20rem]', popoverContentClassName)}
        >
          {view === 'month' ? (
            <MonthYearViewSelector
              {...props}
              onComplete={(newMonthDate) => {
                newMonthDate && props.setMonth(newMonthDate);
                setView('day');
                if (props.type === 'single') {
                  const { currentDate } = props;

                  if (newMonthDate && currentDate) {
                    let finalDate = newMonthDate.set({ day: currentDate.day });
                    if (finalDate.month !== newMonthDate.month) {
                      finalDate = newMonthDate.endOf('month').startOf('day');
                    }
                    setCurrentDate(finalDate.setZone(timezone));
                  }
                }
              }}
            />
          ) : (
            <DayViewSelector
              {...props}
              components={components}
              timezone={timezone}
              setView={setView}
            />
          )}
          {renderAdditionalContentChildren?.(view)}
        </PopoverContent>
      </Popover>
    </Popover>
  );
}

function MonthYearViewSelector({
  month,
  onComplete,
  ...props
}: DateNavigatorProps & {
  onComplete: (newMonth: DateTime | null) => void;
}) {
  const [updatingMonth, setUpdatingMonth] = useState(month);
  const [updatingYear, setUpdatingYear] = useState(month.year);

  const months = useMemo(() => {
    const min = 'min' in props && props.min ? props.min : DateTime.fromObject({ year: 1910 });
    const max = 'max' in props && props.max ? props.max : DateTime.now().plus({ year: 1 });

    return Array.from({ length: 12 })
      .map((_, i) => {
        const date = DateTime.fromObject({ month: i + 1, year: updatingYear });
        if (date >= min && date <= max) {
          return date;
        } else {
          return null;
        }
      })
      .filter((m) => !!m) as DateTime[];
  }, [updatingYear]);

  const years = useMemo(() => {
    const min = 'min' in props && props.min ? props.min : DateTime.fromObject({ year: 1910 });
    let max = 'max' in props && props.max ? props.max : DateTime.now().plus({ year: 1 });

    const years = [];
    while (max.year >= min.year) {
      years.push(max.year);
      max = max.minus({ year: 1 });
    }

    return years;
  }, []);

  function onMonthChange(month: DateTime) {
    setUpdatingMonth(month);
  }

  function onYearChange(year: number) {
    setUpdatingYear(year);
    setUpdatingMonth((m) => m.set({ year }));
  }

  function onConfirm() {
    onComplete(updatingMonth);
  }
  function onCancel() {
    onComplete(null);
  }

  return (
    <div className="flex flex-col">
      <h4>
        <Trans>Change month</Trans>
      </h4>
      <div className="flex gap-x-7 p-2 h-[16rem]">
        <div className="flex-1 flex flex-col overflow-y-scroll px-2 py-1">
          {months.map((m) => (
            <Button
              key={m.toISO()}
              onClick={() => onMonthChange(m)}
              className={cn(
                'w-fit p-2',
                'text-neutral-700 justify-start',
                updatingMonth.month === m.month &&
                  'bg-fs-green-600 text-white hover:bg-green-300 focus:bg-green-300 active:bg-green-300',
              )}
              variant="tertiary"
            >
              {m.toFormat('LLLL')}
            </Button>
          ))}
        </div>
        <div className="flex flex-col overflow-y-scroll px-2 py-1">
          {years.map((year) => (
            <Button
              key={year}
              onClick={() => onYearChange(year)}
              className={cn(
                'w-fit p-2',
                'text-neutral-700 justify-start',
                updatingYear === year &&
                  'bg-fs-green-600 text-white hover:bg-green-300 focus:bg-green-300 active:bg-green-300',
              )}
              variant="tertiary"
            >
              {year}
            </Button>
          ))}
        </div>
      </div>
      <ButtonBar className="justify-end !p-0 mt-2">
        <ButtonBar.Group>
          <Button onClick={onCancel} variant="tertiary">
            <Trans>Go back</Trans>
          </Button>
          <Button onClick={onConfirm}>
            <Trans>Select</Trans>
          </Button>
        </ButtonBar.Group>
      </ButtonBar>
    </div>
  );
}

function DayViewSelector({
  month,
  prevMonth,
  nextMonth,
  today,
  setCurrentDate,
  setView,
  timezone,
  components,
  ...props
}: DateNavigatorProps & {
  timezone?: string;
  components: DayPickerProps['components'];
  setView: (view: DatePickerPopoverViewType) => void;
}) {
  const restraints = (): Matcher[] => {
    const min = 'min' in props && props.min ? props.min : DateTime.fromObject({ year: 1910 });
    const max = 'max' in props && props.max ? props.max : DateTime.now().plus({ year: 1 });
    return [
      {
        after: max.toJSDate(),
        before: min.toJSDate(),
      },
    ];
  };

  return (
    <>
      <div className="flex gap-x-2 justify-between">
        <NavigatorControls
          onLeftClick={prevMonth}
          onRightClick={nextMonth}
          disablePrevNavigation={
            'min' in props && !!props.min ? month.startOf('month') <= props.min : undefined
          }
          disableNextNavigation={
            'max' in props && !!props.max ? month.endOf('month') >= props.max : undefined
          }
        >
          <Button
            onClick={() => setView('month')}
            size="sm"
            variant="quaternary"
            className="!text-base"
          >
            {month.toFormat('LLL yyyy')}
          </Button>
        </NavigatorControls>
        <Button
          onClick={today}
          variant="quaternary"
          leftIcon={{ name: 'calendar-arrow', color: 'fsGreen', size: 'sm' }}
        >
          <Trans>Today</Trans>
        </Button>
      </div>
      {props.type === 'single' && (
        <DayPicker
          mode="single"
          timeZone={timezone}
          hidden={restraints()}
          month={month.toJSDate()}
          selected={props.currentDate.toJSDate()}
          onSelect={(_, date) => {
            if (!date) return;

            const dateStr = DateTime.fromJSDate(date).startOf('day').toFormat('LL/dd/yyyy');
            const dateInTz = DateTime.fromFormat(dateStr, 'LL/dd/yyyy', { zone: timezone }).startOf(
              'day',
            );

            setCurrentDate(dateInTz);
          }}
          styles={{ caption: { display: 'none' } }}
          hideNavigation
          showOutsideDays={false}
          components={components}
          disabledDates={props.disabledDates}
        />
      )}
      {props.type === 'range' && (
        <DayPicker
          mode="multiple"
          month={month.toJSDate()}
          hidden={restraints()}
          timeZone={timezone}
          selected={props.currentDates.map((date) => date.toJSDate())}
          onSelect={(_dates, date) => {
            if (!date) return;

            const dateStr = DateTime.fromJSDate(date).startOf('day').toFormat('LL/dd/yyyy');
            const dateInTz = DateTime.fromFormat(dateStr, 'LL/dd/yyyy', { zone: timezone }).startOf(
              'day',
            );

            setCurrentDate(dateInTz);
          }}
          styles={{ caption: { display: 'none' } }}
          hideNavigation
          components={components}
          disabledDates={props.disabledDates}
        />
      )}
    </>
  );
}
