import { FieldValues, UseFormReturn } from 'react-hook-form';
import { ReactNode } from 'react';
import { FormV2 } from '../form/form';
import type { Widget } from '@mono/telenutrition/lib/types';
import { getFormattedValues } from './helpers';
import _ from 'lodash';

interface SubmitWidgetFormFnParams<Values extends FieldValues> {
  formattedValues: Record<string, any>;
  rawValues: Values;
}

export type SubmitWidgetFormFn<Values extends FieldValues> = (
  params: SubmitWidgetFormFnParams<Values>,
) => void;

type FormProps<Values extends FieldValues> = {
  children: ReactNode;
  onSubmit: SubmitWidgetFormFn<Values>;
  className?: string;
  form: UseFormReturn<Values>;
  widgets: Widget[];
};

export default function WidgetForm<Values extends FieldValues>({
  onSubmit,
  className,
  form,
  children,
  widgets,
}: FormProps<Values>) {
  function handleSubmit(values: Values) {
    const formatted = getFormattedValues(values, widgets);

    onSubmit({
      formattedValues: formatted,
      rawValues: values,
    });
  }

  return (
    <FormV2 form={form} onSubmit={handleSubmit} className={className}>
      {children}
    </FormV2>
  );
}
