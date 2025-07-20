import { FieldValues, UseFormReturn, Path } from 'react-hook-form';
import FormItem from './form-item';
import { FormItemRules } from '@/ui-components/form/form';
import { cn } from '@/utils';

interface FormTimeInputProps<Values extends FieldValues> {
  form: UseFormReturn<Values>;
  id: Path<Values>;
  rules?: FormItemRules<Values>;
  disabled?: boolean;
  label?: string;
}

export default function FormTimeInput<Values extends FieldValues>({
  form,
  id,
  label,
  rules,
  disabled,
}: FormTimeInputProps<Values>) {
  return (
    <FormItem
      form={form}
      id={id}
      label={label}
      rules={rules}
      disabled={disabled}
      renderItem={(field) => (
        <>
          <style>
            {`
            /* Wrapper around the hour, minute, second, and am/pm fields as well as 
            the up and down buttons and the 'X' button */
            input[type=time]::-webkit-datetime-edit-fields-wrapper {
              display: flex;
              align-items: center;
            }
            
            /* The space between the fields - between hour and minute, the minute and 
            second, second and am/pm */
            input[type=time]::-webkit-datetime-edit-text {
            }

            /* Hour */
            input[type=time]::-webkit-datetime-edit-hour-field {
              display: flex;
              align-items: center;
            }

            /* Minute */
            input[type=time]::-webkit-datetime-edit-minute-field {
              display: flex;
              align-items: center;
            }

            /* AM/PM */
            input[type=time]::-webkit-datetime-edit-ampm-field {
              display: flex;
              align-items: center;
            }

            /* 'X' button for resetting/clearing time */
            input[type=time]::-webkit-clear-button {
              display: none;
            }

            /* Up/Down arrows for incrementing/decrementing the value */
            input[type=time]::-webkit-inner-spin-button {
              display: none;
            }
          `}
          </style>
          <input
            data-testid={`${id}-input`}
            type="time"
            value={field.value as string}
            onChange={field.onChange}
            className={cn(
              'text-base p-0',
              'border-none outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 hover:ring-offset-0',
              'w-full',
            )}
          />
        </>
      )}
    />
  );
}
