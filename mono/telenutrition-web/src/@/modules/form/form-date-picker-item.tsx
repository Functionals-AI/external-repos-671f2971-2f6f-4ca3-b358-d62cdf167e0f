import { FieldValues, UseFormReturn, Path } from 'react-hook-form';
import { FormField, FormItem as RootFormItem, FormItemRules } from '../../ui-components/form/form';
import { FormItemLabelV2 } from './ui';
import { DateTime } from 'luxon';
import DatePickerPopover from '../calendar/date-navigator/date-picker-popover';
import { useSingleDateNavigator } from '../calendar/date-navigator/useSingleDateNavigator';
import { cn } from '@/utils';
import { inputClasses } from '@/ui-components/form/input';
import FormItemError from './form-item-error';
import FormItemBox from './form-item-box';
import Icon from '@/ui-components/icons/Icon';
import { Button } from '@/ui-components/button';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DisabledDate } from '@/ui-components/calendar/day-picker';

interface FormDatePickerItemProps<Values extends FieldValues, Key extends Path<Values>> {
  form: UseFormReturn<Values>;
  id: Key;
  inputLabel?: string;
  rules?: FormItemRules<Values>;
  // ISO
  min?: string;
  // ISO
  max?: string;
  disabled?: boolean;
  className?: string;
  disabledDates?: DisabledDate[];
}

export default function FormDatePickerItem<Values extends FieldValues, Key extends Path<Values>>({
  form,
  id,
  inputLabel,
  rules,
  min,
  max,
  disabled,
  className,
  disabledDates,
}: FormDatePickerItemProps<Values, Key>) {
  const isRequired = !!rules?.required;

  return (
    <FormField
      control={form.control}
      name={id}
      rules={rules}
      render={({ field }) => (
        <DatePickerComponent
          className={className}
          min={min}
          max={max}
          id={id}
          inputLabel={inputLabel}
          isRequired={isRequired}
          disabled={disabled}
          value={field.value}
          disabledDates={disabledDates}
          onError={(errorMessage) => {
            form.setError(id, { type: 'validate', message: errorMessage });
          }}
          onChange={(isoDate) => {
            if (!!form.formState.errors[id]) {
              form.clearErrors(id);
            }
            field.onChange(isoDate);
          }}
        />
      )}
    />
  );
}

export function DatePickerComponent<Values extends FieldValues, Key extends Path<Values>>({
  min,
  max,
  id,
  inputLabel,
  value,
  isRequired,
  onChange,
  disabled,
  className,
  disabledDates,
  onError,
}: {
  min?: string;
  max?: string;
  id: Key;
  inputLabel?: string;
  isRequired?: boolean;
  value: string | null;
  onChange: (isoDateStr: string | null) => void;
  disabled?: boolean;
  className?: string;
  disabledDates?: DisabledDate[];
  onError: (msg: string) => void;
}) {
  const { t } = useTranslation();
  const [manualInputValue, setManualInputValue] = useState<string | null>(null);
  const dateNavigator = useSingleDateNavigator({
    navigationType: 'day',
    min: min ? DateTime.fromISO(min) : undefined,
    max: max ? DateTime.fromISO(max) : undefined,
    disabledDates: disabledDates,
    onChange: (value) => {
      if (!value) {
        onChange(null);
      } else {
        onChange(value.toISODate());
        setManualInputValue(null);
      }
    },
  });

  const inputValue = (() => {
    if (manualInputValue) return manualInputValue;

    if (!value) return '';

    const asDT = DateTime.fromISO(value);

    if (!asDT.isValid) return '';

    return asDT.toFormat('LL/dd/yyyy');
  })();

  return (
    <RootFormItem className={cn('flex flex-col text-neutral-700 w-full', className)}>
      <FormItemBox
        {...(disabled && { inert: '' })}
        isDisabled={disabled}
        className={cn('w-full flex flex-row items-center justify-between')}
      >
        <FormItemLabelV2 label={inputLabel} required={isRequired}>
          <input
            disabled={disabled}
            placeholder={'MM/DD/YYYY'}
            data-testid={`${id}-input`}
            className={cn(inputClasses)}
            value={inputValue}
            onChange={(e) => {
              const value = e.target.value;

              if (value === '') {
                onChange(null);
                setManualInputValue(null);
                return;
              }

              const asDateTime = DateTime.fromFormat(value, 'LL/dd/yyyy');

              if (asDateTime.isValid) {
                const foundDisabledDate = disabledDates?.find(({ date }) => {
                  return date.toFormat('dd LLL yyyy') === asDateTime.toFormat('dd LLL yyyy');
                });
                if (foundDisabledDate) {
                  setManualInputValue(null);
                  onError(foundDisabledDate.tooltipMessage ?? t('Date is disabled'));

                  return;
                }

                if (!!min && asDateTime < DateTime.fromISO(min)) {
                  setManualInputValue(null);
                  onError(
                    t('Minimum date is {{minDate}}', {
                      minDate: DateTime.fromISO(min).toFormat('LL/dd/yyyy'),
                    }),
                  );

                  return;
                }
                if (!!max && asDateTime > DateTime.fromISO(max)) {
                  setManualInputValue(null);
                  onError(
                    t('Maximum date is {{maxDate}}', {
                      maxDate: DateTime.fromISO(max).toFormat('LL/dd/yyyy'),
                    }),
                  );

                  return;
                }

                setManualInputValue(null);
                dateNavigator.setCurrentDate(asDateTime);
                dateNavigator.setMonth(asDateTime);
              } else {
                setManualInputValue(value);
              }
            }}
            onBlur={() => {
              if (manualInputValue) {
                setManualInputValue(null);
              }
            }}
          />
        </FormItemLabelV2>
        <DatePickerPopover
          {...dateNavigator}
          popoverContentClassName="!-translate-x-32"
          PopoverTriggerComponent={
            <Button dataTestId="date-picker-trigger-button" variant="quaternary" className="p-2">
              <Icon name="calendar" color="neutral" size={'sm'} />
            </Button>
          }
        />
      </FormItemBox>
      <FormItemError />
    </RootFormItem>
  );
}
