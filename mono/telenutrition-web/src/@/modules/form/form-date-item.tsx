import { DayPicker } from '@/ui-components/calendar/day-picker';
import { FormField, FormItemRules } from '@/ui-components/form/form';
import { useEffect } from 'react';
import { FieldValues, Path, UseFormReturn } from 'react-hook-form';

interface FormDateItemProps<Values extends FieldValues, Key extends Path<Values>> {
  form: UseFormReturn<Values>;
  id: Key;
  rules?: FormItemRules<Values>;
}

export default function FormDateItem<Values extends FieldValues, Key extends Path<Values>>({
  form,
  id,
  rules,
}: FormDateItemProps<Values, Key>) {
  useEffect(() => void form.watch(), [form]);

  const values = form.getValues();
  const date = values[id];

  return (
    <FormField
      name={id}
      control={form.control}
      rules={rules}
      render={({ field }) => {
        return (
          <DayPicker
            selected={field.value}
            mode="single"
            onSelect={(newDate) => {
              field.onChange(newDate);
            }}
          />
        );
      }}
    />
  );
}
