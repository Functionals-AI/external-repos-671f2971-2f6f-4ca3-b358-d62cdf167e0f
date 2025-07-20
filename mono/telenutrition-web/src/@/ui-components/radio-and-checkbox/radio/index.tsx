import { RadioGroup as HeadlessRadioGroup } from '@headlessui/react';
import { ReactNode } from 'react';
import { cn } from '@/utils';
import { FieldPath, FieldValues, Path, RegisterOptions, UseFormReturn } from 'react-hook-form';
import { FormField, FormControl, FormLabel, FormItem } from '@/ui-components/form/form';

import ItemDefault from './radio-group-item-default';
import ItemCard from './radio-group-item-card';
import FormItemError from '@/modules/form/form-item-error';

type RadioGroupProps<Values extends FieldValues> = {
  form: UseFormReturn<Values>;
  label?: ReactNode;
  id: Path<Values>;
  rules?: Omit<
    RegisterOptions<Values, FieldPath<Values>>,
    'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'disabled'
  >;
  wrapperClassName?: string;
  children: ReactNode;
  direction?: 'horizontal' | 'vertical';
};

function RadioGroup<Values extends FieldValues>({
  label,
  id,
  form,
  children,
  wrapperClassName,
  rules,
  direction = 'vertical',
}: RadioGroupProps<Values>) {
  return (
    <FormField
      rules={rules}
      control={form.control}
      name={id}
      render={({ field }) => (
        <FormItem>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <HeadlessRadioGroup {...field}>
              <div
                className={cn(
                  'flex',
                  direction === 'vertical' ? 'flex-col gap-y-2' : ' flex-row gap-x-4',
                  wrapperClassName,
                )}
              >
                {children}
              </div>
            </HeadlessRadioGroup>
          </FormControl>
          <FormItemError />
        </FormItem>
      )}
    />
  );
}

RadioGroup.Item = ItemDefault;
RadioGroup.Card = ItemCard;

export default RadioGroup;
