import { ReactNode, useEffect, useRef, useState } from 'react';
import { FormItemRules } from './form/form';
import { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { cn } from '@/utils';
import FormItem from '@/modules/form/form-item';

interface TextAreaProps<Values extends FieldValues> {
  label?: ReactNode;
  form: UseFormReturn<Values>;
  showCharacterCount?: boolean;
  maxCount?: number;
  id: Path<Values>;
  rules?: FormItemRules<Values>;
  placeholder?: string;
  disabled?: boolean;
  description?: string;
  className?: string;
}

export default function TextArea<Values extends FieldValues>({
  label,
  showCharacterCount = false,
  maxCount = 2500,
  id,
  form,
  rules,
  placeholder,
  disabled,
  description,
  className,
}: TextAreaProps<Values>) {
  const [count, setCount] = useState(() => form.getValues()[id]?.length ?? 0);
  const [localValue, setLocalValue] = useState<string>(() => form.getValues(id));

  const debouncedCallback = useRef<NodeJS.Timeout>();
  const watch = form.watch(id);

  useEffect(() => {
    setLocalValue((current) => {
      if (current !== watch) {
        setCount(watch.length);
        return watch;
      }
      return current;
    });
  }, [watch]);

  function localDebounce(newValue: string, fn: () => void) {
    setLocalValue(newValue);

    if (debouncedCallback.current) {
      clearTimeout(debouncedCallback.current);
    }

    debouncedCallback.current = setTimeout(() => fn(), 50);
  }

  if (showCharacterCount && maxCount && !rules?.maxLength) {
    rules = {
      ...rules,
      maxLength: { value: maxCount, message: 'Character limit exceeded' },
    };
  }

  return (
    <FormItem
      form={form}
      id={id}
      className={className}
      rules={rules}
      disabled={disabled}
      description={description}
      label={
        <>
          {label}
          {showCharacterCount && (
            <p>
              {count}/{maxCount}
            </p>
          )}
        </>
      }
      renderItem={(field) => {
        return (
          <textarea
            disabled={disabled}
            data-testid={`${id}-input`}
            placeholder={placeholder}
            style={{ resize: 'vertical' }}
            // If we are not showing the character count, limit the input characters.
            // Otherwise we will allow it to surpass the limit but show a validation error
            maxLength={!showCharacterCount ? maxCount : undefined}
            value={localValue}
            onChange={(event) => {
              const value = event.target.value;
              localDebounce(value, () => field.onChange(event));
              setCount(value.length);
            }}
            className={cn(
              'bg-transparent',
              'min-h-[6rem] h-fit p-0 outline-none ring-0 border-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0',
              'w-full',
            )}
          />
        );
      }}
    />
  );
}
