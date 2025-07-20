import { FormControl, FormField, FormItemRules } from '@/ui-components/form/form';
import { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { ReactNode, useEffect, useMemo } from 'react';
import Combobox, { ComboBoxOption, findOption } from '@/ui-components/combobox';
import { FormItem as RootFormItem } from '../../ui-components/form/form';
import FormItemError from './form-item-error';
import _ from 'lodash';
import type { ComboboxQuestionOption as ConfigurableFormComboboxOption } from '@mono/telenutrition/lib/types';
import { areConditionalsSatisfied } from '../widgets/helpers';
import jmespath from 'jmespath';

interface FormComboBoxItemProps<Values extends FieldValues, Key extends Path<Values>> {
  form: UseFormReturn<Values>;
  id: Key;
  rules?: FormItemRules<Values>;
  label?: ReactNode;
  options: ConfigurableFormComboboxOption[];
  NoResults?: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
  disabledAutoComplete?: boolean;
}

export default function FormComboBoxItem<Values extends FieldValues, Key extends Path<Values>>({
  options,
  NoResults,
  placeholder,
  form,
  id,
  rules,
  label,
  disabled,
  disabledAutoComplete = false,
}: FormComboBoxItemProps<Values, Key>) {
  const isRequired = !!rules?.required;

  const formWatch = form.watch();

  const calculatedOptions = useMemo(
    () =>
      options.reduce((acc, option) => {
        if (option.type === 'conditional') {
          if (
            areConditionalsSatisfied(option.conditions, (key) => {
              const values = form.getValues();
              return jmespath.search(values, key);
            })
          ) {
            return [...acc, ...option.then.options];
          } else {
            return acc;
          }
        }

        return [...acc, option];
      }, [] as ComboBoxOption[]),
    [formWatch],
  );

  useEffect(() => {
    const currValue = formWatch[id];
    if (!currValue) return;

    const found = findOption(currValue, calculatedOptions);
    if (!found) {
      form.setValue(id, undefined as any);
    }
  }, [calculatedOptions]);

  return (
    <FormField
      control={form.control}
      name={id}
      rules={rules}
      disabled={disabled}
      render={({ field, formState }) => {
        const keys = id.split('.');
        const error = _.get(formState.errors, keys);

        return (
          <RootFormItem>
            <FormControl>
              <Combobox
                disabledAutoComplete={disabledAutoComplete}
                disabled={disabled}
                dataTestId={`${id}-input`}
                inputLabel={label}
                NoResults={NoResults}
                options={calculatedOptions}
                placeholder={placeholder}
                value={(field.value as string) ?? null}
                onSelect={(option) => {
                  field.onChange(option?.value ?? null);
                }}
                required={isRequired}
                isError={!!error}
              />
            </FormControl>
            <FormItemError />
          </RootFormItem>
        );
      }}
    />
  );
}
