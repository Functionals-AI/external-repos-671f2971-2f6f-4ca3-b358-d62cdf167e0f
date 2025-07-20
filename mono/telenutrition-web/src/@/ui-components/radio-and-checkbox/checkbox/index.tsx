import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormDescription,
  FormItemRules,
} from '@/ui-components/form/form';
import { Checkbox } from '@/ui-components/checkbox';
import { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { cn } from '@/utils';
import FormItemError from '@/modules/form/form-item-error';
import { ReactNode } from 'react';

export default function CheckBox<Values extends FieldValues>({
  id,
  label,
  description,
  form,
  className,
  rules,
  disabled,
}: {
  id: Path<Values>;
  label: ReactNode;
  description?: ReactNode;
  form: UseFormReturn<Values>;
  className?: string;
  rules?: FormItemRules<Values>;
  disabled?: boolean;
}) {
  return (
    <FormField
      disabled={disabled}
      rules={rules}
      control={form.control}
      name={id}
      render={({ field }) => (
        <FormItem className={className}>
          <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md">
            <FormControl>
              <Checkbox
                data-testid={`${id}-checkbox`}
                disabled={disabled}
                className="cursor-pointer text-fs-green-300"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel
                className={cn('cursor-pointer', disabled && 'cursor-default text-neutral-400')}
              >
                {label} {rules?.required && <span className="text-status-red-800">*</span>}
              </FormLabel>
              {description && <FormDescription>{description}</FormDescription>}
            </div>
          </div>
          <FormItemError />
        </FormItem>
      )}
    />
  );
}
