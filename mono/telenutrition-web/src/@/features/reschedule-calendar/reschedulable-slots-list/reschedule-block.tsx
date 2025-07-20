import { Fragment, PropsWithChildren } from 'react';
import { RadioGroup as HeadlessRadioGroup } from '@headlessui/react';
import { TimezoneDisplayValue, useRescheduleCalendarContext } from '../context';
import RadioIcon from '@/ui-components/radio-and-checkbox/radio-icon';
import { TimeSlot } from '@/selectors/calendarItemsSelector/helpers';
import { cn } from '@/utils';

function RescheduleBlock({ children }: PropsWithChildren<{}>) {
  return <div className="flex flex-col border-b border-b-neutral-200 w-full">{children}</div>;
}

function Row({ children }: PropsWithChildren<{}>) {
  return <div className="flex">{children}</div>;
}

interface LabelProps {
  timeslot: TimeSlot;
  checked?: boolean;
  disabled?: boolean;
}

function Label({ timeslot, disabled, checked }: LabelProps) {
  const {
    form,
    rescheduleAppointment: {
      patient: { timezone: patientTimezone },
    },
  } = useRescheduleCalendarContext();
  const dataTestId = `reschedule-option-${timeslot.dateTime.toFormat('HH:mm')}`;
  const displayInPatientTimezone = timeslot.dateTime
    .setZone(patientTimezone)
    .toFormat('h:mma ZZZZ');

  const displayTime =
    form.getValues().timezoneDisplay === TimezoneDisplayValue.LOCAL
      ? timeslot.display
      : displayInPatientTimezone;

  return (
    <HeadlessRadioGroup.Option value={timeslot.dateTime.toISO()} as={Fragment}>
      <div
        data-test={disabled && 'disabled'}
        data-testid={dataTestId}
        className={cn(
          'border-r border-r-neutral-200 min-w-[10rem]',
          disabled && 'text-neutral-400',
          !disabled && 'cursor-pointer',
        )}
        {...(disabled && { inert: '' })}
      >
        <div className={cn('flex gap-x-2 items-center pl-4 h-12')}>
          <div className="h-4 w-4">
            <RadioIcon
              variant={disabled ? 'disallowed' : checked ? 'checked' : 'default'}
              className="h-4 w-4 disabled cursor-pointer"
            />
          </div>
          {displayTime}
        </div>
      </div>
    </HeadlessRadioGroup.Option>
  );
}

function Content({
  children,
  disallowed,
  highlighted,
  className,
}: PropsWithChildren<{
  disallowed?: boolean;
  highlighted?: boolean;
  className?: string;
}>) {
  return (
    <div
      className={cn(
        'w-full flex justify-between items-center p-2 min-h-[2.5rem]',
        disallowed && 'bg-neutral-115 text-neutral-400 [&>p]:text-neutral-400',
        highlighted && 'border-l-4 border-l-fs-green-300 -ml-[2px] bg-fs-green-50',
        className,
      )}
    >
      {children}
    </div>
  );
}

RescheduleBlock.Row = Row;
RescheduleBlock.Label = Label;
RescheduleBlock.Content = Content;

export default RescheduleBlock;
