import { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import FormItem from './form-item';
import { FormItemRules } from '@/ui-components/form/form';
import { NumericFormat } from 'react-number-format';
import { Input as BaseInput } from '@/ui-components/form/input';
import { ChangeEventHandler, ReactNode, useEffect, useRef } from 'react';

interface FormNumberInputProps<Values extends FieldValues> {
  form: UseFormReturn<Values>;
  id: Path<Values>;
  label?: ReactNode;
  rules?: FormItemRules<Values>;
  disabled?: boolean;
  allowScroll?: boolean;
  decimalScale?: number;
  max?: number;
  min?: number;
  className?: string;
}

export default function FormNumberInput<Values extends FieldValues>({
  form,
  id,
  label,
  rules,
  disabled,
  allowScroll = false,
  decimalScale = 0,
  max,
  min,
  className,
}: FormNumberInputProps<Values>) {
  const baseInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (allowScroll) {
      return;
    }

    const preventDefaultFn = (event: WheelEvent) => event.preventDefault();
    baseInputRef?.current?.addEventListener('wheel', preventDefaultFn);

    return () => baseInputRef?.current?.removeEventListener('wheel', preventDefaultFn);
  }, [allowScroll, baseInputRef?.current]);

  return (
    <FormItem
      className={className}
      form={form}
      id={id}
      label={label}
      rules={rules}
      disabled={disabled}
      renderItem={(field) => {
        if (!decimalScale || decimalScale < 1) {
          return (
            <BaseInput
              ref={baseInputRef}
              type="number"
              min={min}
              max={max}
              onChange={field.onChange}
              data-testid={`${id}-input`}
              value={field.value as string}
            />
          );
        }
        return (
          <NumberFormatInput
            onChange={field.onChange}
            dataTestId={`${id}-input`}
            min={min}
            max={max}
            value={field.value as string}
            decimalScale={decimalScale}
          />
        );
      }}
    />
  );
}

export function NumberFormatInput({
  dataTestId,
  min,
  max,
  value,
  decimalScale,
  onChange,
}: {
  dataTestId?: string;
  min?: number;
  max?: number;
  value: string;
  decimalScale?: number;
  onChange: ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <NumericFormat
      onBlur={() => {
        if (value === '-') {
          onChange({ target: { value: null } } as any);
        }
      }}
      onChange={onChange}
      data-testid={dataTestId}
      max={max}
      min={min}
      value={value}
      customInput={BaseInput}
      decimalScale={decimalScale}
      isAllowed={(values) => {
        const { floatValue } = values;
        if (floatValue === undefined) {
          return true;
        }

        let isValid = true;

        if (min != undefined) {
          if (floatValue < min) {
            isValid = false;
          }
        }
        if (max != undefined && floatValue > max) {
          isValid = false;
        }

        return isValid;
      }}
    />
  );
}
