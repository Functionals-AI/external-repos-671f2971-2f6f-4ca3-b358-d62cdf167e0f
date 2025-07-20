import React, { ReactNode } from 'react';
import { UseFormReturn, FieldValues, Path } from 'react-hook-form';
import RadioGroup from '@/ui-components/radio-and-checkbox/radio';
import type { RadioGroupTieredOption } from '@mono/telenutrition/lib/types';
import FormItem from '@/modules/form/form-item';
import { Input as BaseInput } from '@/ui-components/form/input';
import { FormItemRules, FormLabel } from '@/ui-components/form/form';
import { cn } from '@/utils';

export type RadioGroupTieredValue = {
  [k: string]: string | RadioGroupTieredValue;
};

interface RadioGroupTieredProps<
  Key extends Path<FieldValues>,
  Values extends FieldValues & { [k in Key]: RadioGroupTieredValue },
> {
  id: Key;
  form: UseFormReturn<Values>;
  label: ReactNode;
  options: RadioGroupTieredOption[];
  rules?: FormItemRules<Values>;
}

interface RadioGroupTieredCompProps<
  Key extends Path<FieldValues>,
  Values extends FieldValues & { [k in Key]: RadioGroupTieredValue },
> {
  form: UseFormReturn<Values>;
  name: Key;
  options: RadioGroupTieredOption[];
  depth?: number;
  rules?: FormItemRules<Values>;
}

function RadioGroupTieredComp<
  Key extends Path<FieldValues>,
  Values extends FieldValues & { [k in Key]: RadioGroupTieredValue },
>({ form, name, options, rules, depth = 0 }: RadioGroupTieredCompProps<Key, Values>) {
  const selectedOption = form.watch(name as unknown as Path<Values>) as RadioGroupTieredValue;

  return (
    <div className={cn(depth && 'ml-7')}>
      <RadioGroup id={name as unknown as Path<Values>} form={form} rules={rules}>
        {options.map((option) => {
          const areChildrenVisible =
            selectedOption &&
            (typeof selectedOption === 'string'
              ? selectedOption === option.value
              : Object.keys(selectedOption).includes(option.value));

          return (
            <React.Fragment key={option.value}>
              <RadioGroup.Item
                data-testid={`${name}_${option.value}-radio`}
                value={option.value}
                title={`${option.label}`}
                disabled={option.disabled}
              />
              {areChildrenVisible && option.type === 'text-input' && (
                <FormItem
                  className="ml-7 mt-1"
                  form={form}
                  label={option.label}
                  id={`${name}.${option.value}` as unknown as Path<Values>}
                  renderItem={(field) => (
                    <BaseInput
                      {...field}
                      data-testid={`${name}_${option.value}-radio-text`}
                      value={field.value as string}
                      type={'text'}
                      placeholder={option.placeholder ?? 'More details'}
                      onKeyDown={(e) => {
                        if (e.key === ' ') {
                          // @ts-ignore
                          field.onChange(e.target.value + ' ');
                          e.preventDefault();
                        }
                      }}
                    />
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </RadioGroup>
    </div>
  );
}

function RadioGroupTiered<
  Key extends Path<FieldValues>,
  Values extends FieldValues & { [k in Key]: RadioGroupTieredValue },
>({ form, id, label, options, rules }: RadioGroupTieredProps<Key, Values>) {
  return (
    <div className="flex flex-col gap-y-2">
      <FormLabel className="text-neutral-1500 text-lg mb-2 leading-4">{label}</FormLabel>
      <RadioGroupTieredComp form={form} name={id} options={options} rules={rules} />
    </div>
  );
}

export default RadioGroupTiered;
