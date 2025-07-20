import { Input as BaseInput } from '@/ui-components/form/input';
import FormItem from './form-item';
import { FormItemRules } from '@/ui-components/form/form';
import { FieldValues, UseFormReturn, Path } from 'react-hook-form';

interface FormTextInputProps<Values extends FieldValues> {
  form: UseFormReturn<Values>;
  id: Path<Values>;
  label?: string;
  rules?: FormItemRules<Values>;
  disabled?: boolean;
  min?: number;
  max?: number;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
}

export default function FormTextInput<Values extends FieldValues>({
  form,
  id,
  label,
  disabled,
  rules,
  min,
  max,
  defaultValue,
  placeholder,
  className,
}: FormTextInputProps<Values>) {
  return (
    <FormItem
      className={className}
      defaultValue={defaultValue}
      form={form}
      id={id}
      label={label}
      rules={rules}
      disabled={disabled}
      renderItem={(field) => (
        <BaseInput
          {...field}
          value={field.value as string}
          data-testid={`${id}-input`}
          type={'text'}
          min={min}
          max={max}
          placeholder={placeholder}
        />
      )}
    />
  );
}
