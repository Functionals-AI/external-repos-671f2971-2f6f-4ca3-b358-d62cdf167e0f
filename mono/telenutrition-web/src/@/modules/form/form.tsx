'use client';

import { createContext, ReactNode, useContext } from 'react';
import {
  FieldValues,
  UseFormProps,
  UseFormReturn,
  useForm as useReactHookForm,
} from 'react-hook-form';
import { Form } from '@/ui-components/form/form';
import { cn } from '@/utils';
import FormItem from './form-item';
import FormSelectItem from './select-item';
import FormTableItem from './form-table-item';
import FormGroupItem from './form-group-item';
import FormDateItem from './form-date-item';
import FormButtonToggle from './form-button-toggle';
import FormRadioGroupTired from './radio-group-tiered';
import RadioTableItem from './radio-table-item';
import FormTextInput from './form-text-input';
import TextArea from '@/ui-components/text-area';
import DatePickerFormItem from './form-date-picker-item';
import FormNumberInput from './form-number-input';
import FormPhoneInput from './form-phone-input';

export const getSubform = <TFieldValues extends FieldValues = FieldValues, TContext = any>(
  form: UseFormReturn<any>,
) => form as unknown as UseFormReturn<TFieldValues, TContext>;

type FormProps<Values extends FieldValues> = {
  children: ReactNode;
  onSubmit: (values: Values) => void;
  className?: string;
  form: UseFormReturn<Values>;
};

function FormV2<Values extends FieldValues>({
  onSubmit,
  className,
  form,
  children,
}: FormProps<Values>) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={cn(className, 'items-start')}>
        {children}
      </form>
    </Form>
  );
}

function useForm<Values extends FieldValues>(
  props: UseFormProps<Values> = {},
): UseFormReturn<Values> {
  // set defaults for reactHookForm
  const form = useReactHookForm<Values>({ mode: 'onChange', shouldFocusError: true, ...props });

  return form;
}

interface IFormV2Context {
  config: {
    showOptionalLabel: boolean;
  };
}

const FormV2Context = createContext<IFormV2Context>({
  config: {
    showOptionalLabel: true,
  },
});

const FormV2ContextProvider = FormV2Context.Provider;

function useFormV2Context() {
  const context = useContext(FormV2Context);
  return context;
}

FormV2.FormItem = FormItem;
FormV2.FormSelectItem = FormSelectItem;
FormV2.TableFormItem = FormTableItem;
FormV2.FormGroupItem = FormGroupItem;
FormV2.FormDateItem = FormDateItem;
FormV2.FormButtonToggle = FormButtonToggle;
FormV2.FormRadioGroupTired = FormRadioGroupTired;
FormV2.RadioTableItem = RadioTableItem;
FormV2.FormTextInput = FormTextInput;
FormV2.FormTextArea = TextArea;
FormV2.FormDatePickerItem = DatePickerFormItem;
FormV2.FormNumberInput = FormNumberInput;
FormV2.FormPhoneInput = FormPhoneInput;

export { FormV2, useForm, useFormV2Context, FormV2ContextProvider };
