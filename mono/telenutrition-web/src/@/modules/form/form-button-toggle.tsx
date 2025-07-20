import { ReactNode } from 'react';
import {
  FieldPath,
  FieldValues,
  Path,
  PathValue,
  RegisterOptions,
  UseFormReturn,
} from 'react-hook-form';
import { FormField, FormItem as RootFormItem } from '@/ui-components/form/form';
import ButtonToggle, { FormButtonToggleValue } from '@/ui-components/form/button-toggle';
import FormItemError from './form-item-error';
import { IconProps } from '@/ui-components/icons/Icon';

export type FormButtonToggleOption<T extends FormButtonToggleValue> = {
  value: T;
  name?: string;
  iconName?: IconProps['name'];
  tooltip?: ReactNode;
  disabled?: boolean;
};

type FormButtonToggleProps<Values extends FieldValues, T extends FormButtonToggleValue> = {
  form: UseFormReturn<Values>;
  id: Path<Values>;
  dataTestId?: string;
  rules?: Omit<
    RegisterOptions<Values, FieldPath<Values>>,
    'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'disabled'
  >;
  className?: string;
  disabled?: boolean;
  options: FormButtonToggleOption<T>[];
  defaultValue?: PathValue<Values, Path<Values>>;
};

export default function FormButtonToggle<
  Values extends FieldValues,
  T extends FormButtonToggleValue,
>(props: FormButtonToggleProps<Values, T>) {
  const { form, id, rules, className, options, disabled, defaultValue } = props;
  const error = form.formState.errors[id];

  return (
    <FormField
      defaultValue={defaultValue}
      rules={rules}
      control={form.control}
      name={id}
      render={({ field }) => (
        <>
          <RootFormItem>
            <ButtonToggle
              options={options}
              value={field.value}
              onChange={field.onChange}
              dataTestId={props.dataTestId}
              isError={!!error}
              disabled={disabled}
              className={className}
            />
            <FormItemError />
          </RootFormItem>
        </>
      )}
    />
  );
}
