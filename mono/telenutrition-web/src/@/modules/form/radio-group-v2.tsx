import React, { Fragment, ReactNode } from 'react';
import { UseFormReturn, FieldValues, Path } from 'react-hook-form';
import type { RadioGroupV2Option } from '@mono/telenutrition/lib/types';
import { FormControl, FormField, FormItemRules, FormLabel } from '@/ui-components/form/form';
import { cn } from '@/utils';
import Combobox from '@/ui-components/combobox';
import FormItemError from './form-item-error';
import RadioOption from '@/ui-components/radio-and-checkbox/radio/radio-option';
import { FormItemLabelV2 } from './ui';

function findOption(
  options: RadioGroupV2Option[],
  value: string,
): { label: string; value: string; type: 'basic' | 'combobox' } | undefined {
  for (const option of options) {
    if (!option.type || option.type === 'basic') {
      if (option.value === value) {
        return { type: 'basic', value: option.value, label: option.label };
      }
    }
    if (option.type === 'combobox') {
      const found = option.options.find((o) => o.value === value);
      if (found) return { ...found, type: 'basic' };
    }
  }
}

type RadioGroupV2Value = string;

interface RadioGroupV2Props<
  Key extends Path<FieldValues>,
  Values extends FieldValues & { [k in Key]: RadioGroupV2Value },
> {
  id: Key;
  form: UseFormReturn<Values>;
  label?: ReactNode;
  options: RadioGroupV2Option[];
  rules?: FormItemRules<Values>;
}

export default function RadioGroupV2<
  Key extends Path<FieldValues>,
  Values extends FieldValues & { [k in Key]: RadioGroupV2Value },
>({ form, id, label, options, rules }: RadioGroupV2Props<Key, Values>) {
  return (
    <FormField
      name={id as string as Path<Values>}
      rules={{
        // ensure "combobox" option isn't selected
        validate: (value) => {
          if (
            options.find((option) => option.value === value)?.type === 'combobox' &&
            form.formState.submitCount > 0
          ) {
            return 'Must select an option';
          }
          if (rules?.required && !value) {
            return false;
          }
          if (!value) return true;

          return true;
        },
      }}
      control={form.control}
      render={({ field }) => {
        const isError = !!form.formState.errors[id];
        const isRadioError =
          isError && findOption(options, field.value as string)?.type !== 'combobox';

        return (
          <>
            <FormControl>
              <div className="flex flex-col gap-y-2">
                <FormItemLabelV2 label={label} required={!!rules?.required}>
                  <div className={cn('flex flex-col gap-y-2')}>
                    {options.map((option) => {
                      const { label, disabled } = option;
                      const sublabel = 'sublabel' in option ? option.sublabel : '';

                      const checked = (() => {
                        if (!option.type || option.type === 'basic') {
                          return option.value === field.value;
                        }

                        if (option.type === 'combobox')
                          return (
                            option.value === field.value ||
                            option.options.map((o) => o.value).includes(field.value as string)
                          );

                        return false;
                      })();

                      return (
                        <Fragment key={`${option.label}.${option.value}`}>
                          <RadioOption
                            label={label}
                            sublabel={sublabel}
                            disabled={disabled}
                            checked={checked}
                            isError={isRadioError}
                            onChecked={() => field.onChange(option.value)}
                            dataTestId={`radio-option-${id}-${option.value}`}
                          />
                          {option.type === 'combobox' && checked && (
                            <div className="px-4">
                              <Combobox
                                dataTestId={`radio-option-${id}-combobox-${option.value}`}
                                isError={isError}
                                disabled={disabled}
                                inputLabel={option.inputLabel}
                                options={option.options}
                                placeholder={option.placeholder}
                                value={
                                  field.value === option.value
                                    ? null
                                    : (field.value as string | null)
                                }
                                onSelect={(option) => {
                                  field.onChange(option?.value ?? null);
                                }}
                                required={true}
                              />
                            </div>
                          )}
                        </Fragment>
                      );
                    })}
                  </div>
                </FormItemLabelV2>
              </div>
            </FormControl>
            <FormItemError />
          </>
        );
      }}
    />
  );
}
