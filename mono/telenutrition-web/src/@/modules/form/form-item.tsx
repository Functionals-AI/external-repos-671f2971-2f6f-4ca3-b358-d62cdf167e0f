import { cn } from '@/utils';
import { ReactNode } from 'react';
import { ControllerRenderProps, FieldValues, UseFormReturn, Path } from 'react-hook-form';
import {
  FormField,
  FormControl,
  FormItem as RootFormItem,
  FormItemRules,
} from '../../ui-components/form/form';
import { FormItemDescription, FormItemLabelV2 } from './ui';
import FormItemError from './form-item-error';
import FormItemBox from './form-item-box';

interface FormItemProps<Values extends FieldValues, Key extends Path<Values>> {
  id: Key;
  renderItem: (field: ControllerRenderProps<Pick<Values, Key>>) => ReactNode;
  className?: string;
  label?: ReactNode;
  description?: ReactNode;
  form: UseFormReturn<Values>;
  rules?: FormItemRules<Values>;
  disabled?: boolean;
  defaultValue?: any;
}

export default function FormItem<Values extends FieldValues, Key extends Path<Values>>(
  props: FormItemProps<Values, Key>,
) {
  const { className, id, renderItem, form, defaultValue } = props;

  const isRequired = !!props.rules?.required;

  return (
    <FormField
      defaultValue={defaultValue}
      rules={props.rules}
      control={form.control}
      name={id}
      disabled={props.disabled}
      render={({ field }) => (
        <RootFormItem className={cn(className, 'bg-white')}>
          <FormItemBox isDisabled={props.disabled}>
            <FormItemLabelV2 label={props.label} required={isRequired} hideOptionalText={props.disabled}>
              <FormControl className="text-type-primary">
                {renderItem(field as any as ControllerRenderProps<Pick<Values, Key>>)}
              </FormControl>
            </FormItemLabelV2>
          </FormItemBox>
          <FormItemDescription {...props} />
          <FormItemError />
        </RootFormItem>
      )}
    ></FormField>
  );
}
