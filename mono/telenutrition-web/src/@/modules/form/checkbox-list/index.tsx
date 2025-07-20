import { FormV2 } from '../form';
import {
  FormControl,
  FormDescription,
  FormItem,
  FormItemRules,
  FormLabel,
} from '@/ui-components/form/form';
import { Checkbox } from '@/ui-components/checkbox';
import { cn } from '@/utils';
import { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { CheckedState } from '@radix-ui/react-checkbox';
import { ReactNode } from 'react';
import TextInputOption from './text-input-option';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';

export type CheckboxState = string | string[] | boolean | undefined;

export type CheckboxListOption = {
  type?: 'basic' | 'text-input';
  label: string;
  value: string;
  disabled?: boolean;
};

interface CheckboxListProps<
  Key extends Path<FieldValues>,
  FieldValue extends Record<string, CheckboxState>,
  Values extends FieldValues & { [k in Key]: FieldValue },
> {
  label?: ReactNode;
  description?: string;
  rules: FormItemRules<Values>;
  form: UseFormReturn<Values>;
  id: Key;
  options: CheckboxListOption[];
}

export default function CheckboxList<
  Key extends Path<FieldValues>,
  FieldValue extends Record<string, CheckedState>,
  Values extends FieldValues & { [k in Key]: FieldValue },
>({ label, description, form, rules, id, options }: CheckboxListProps<Key, FieldValue, Values>) {
  const { t } = useTranslation();

  return (
    <div>
      {(label || description) && (
        <div>
          {label && <FormLabel className="text-neutral-1500 text-sm leading-4">{label}</FormLabel>}
          {description && (
            <FormDescription className="text-neutral-700 mb-2 text-sm leading-4">
              {description}
            </FormDescription>
          )}
        </div>
      )}
      <div className="flex flex-col gap-y-2">
        {options.map((option) => (
          <FormV2.FormGroupItem
            key={option.value}
            form={form}
            rules={{
              ..._.omit(rules, 'required'),
              validate: {
                required: (values) => {
                  if (!rules.required) return true;

                  if (values === undefined) return false;

                  let hasValidValue = false;
                  Object.entries(values as Record<string, CheckboxState>).forEach(
                    ([key, value]) => {
                      if (typeof value === 'boolean') {
                        if (value === true) {
                          hasValidValue = true;
                        }
                      } else if (typeof value === 'object') {
                        if (value.length > 0) {
                          hasValidValue = true;
                        }
                      }
                    },
                  );

                  return hasValidValue ?? t('Must have at least one option selected.');
                },
              },
            }}
            id={id}
            render={({ getValue, onChange }) => {
              const value = getValue(option.value) as CheckboxState;
              return (
                <FormItem
                  className={cn(
                    'flex flex-row items-center space-x-3 space-y-0 rounded-md',
                    option.disabled && 'opacity-50 pointer-default',
                  )}
                  {...(option.disabled && { inert: '' })}
                >
                  {(!option.type || option.type === 'basic') && (
                    <>
                      <FormControl>
                        <Checkbox
                          data-testid={`checkbox-option-${option.value}-button`}
                          disabled={option.disabled}
                          className="cursor-pointer text-green-300"
                          checked={!!value}
                          onCheckedChange={(checked) =>
                            // Transform false to undefined
                            onChange(option.value, checked === false ? undefined : checked)
                          }
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="cursor-pointer text-base font-normal text-neutral-1500">
                          {option.label}
                        </FormLabel>
                      </div>
                    </>
                  )}
                  {option.type === 'text-input' && (
                    <TextInputOption option={option} onChange={onChange} value={value} />
                  )}
                </FormItem>
              );
            }}
          />
        ))}
      </div>
    </div>
  );
}
