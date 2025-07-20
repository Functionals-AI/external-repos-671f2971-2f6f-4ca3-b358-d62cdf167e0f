import { cn } from '@/utils';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
} from '@/ui-components/form/select';
import { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import {
  FormField,
  FormControl,
  FormItem as RootFormItem,
  FormItemRules,
} from '@/ui-components/form/form';
import { FormItemLabel, FormItemDescription } from './ui';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import FormItemError from './form-item-error';
import type { SelectQuestionOption } from '@mono/telenutrition/lib/types';

export type SelectFormOption = SelectQuestionOption;

interface SelectFormItemProps<Values extends FieldValues> {
  id: Path<Values>;
  className?: string;
  description?: string;
  label?: ReactNode;
  placeholder?: string;
  form: UseFormReturn<Values>;
  dataTestId?: string;
  disabled?: boolean;
  defaultValue?: string;
  options: SelectFormOption[];
  rules?: FormItemRules<Values>;
}

export default function SelectFormItem<Values extends FieldValues>(
  props: SelectFormItemProps<Values>,
) {
  const { t } = useTranslation();

  const { id, className, options, form } = props;
  const error = form.formState.errors[id];
  const isRequired = !!props.rules?.required;

  function getLabel(fieldValue: string): ReactNode {
    const option = options.find((option) =>
      option.type === 'group'
        ? option.options.some((o) => o.value === fieldValue)
        : option.value === fieldValue,
    );

    if (!option) return <p className="text-neutral-600">Not specified</p>;

    if (option.type === 'group') {
      return `${option.groupLabel}: ${option.options.find((o) => o.value === fieldValue)?.label}`;
    }

    return option.label;
  }

  return (
    <FormField
      disabled={props.disabled}
      rules={props.rules}
      control={form.control}
      name={id}
      render={({ field }) => (
        <RootFormItem
          data-testid={props.dataTestId ?? `${props.id}-input`}
          className={cn('bg-white !h-[58px]', className, props.disabled && '!text-neutral-400')}
        >
          <Select
            disabled={props.disabled}
            onValueChange={(val) => field.onChange(val)}
            value={field.value?.length ? field.value : props.defaultValue}
          >
            <FormControl>
              <SelectTrigger
                className={cn(
                  'data-[placeholder]:text-neutral-400 border',
                  error ? 'border-status-red-600' : 'border-neutral-200',
                  props.disabled && '!text-neutral-400 !bg-neutral-150 border-neutral-150',
                )}
              >
                <div className="flex flex-col items-start h-full">
                  <FormItemLabel
                    id={props.id}
                    label={props.label}
                    required={isRequired}
                    className="text-neutral-700"
                  />
                  <SelectValue
                    asChild
                    className="text-base !h-6"
                    placeholder={
                      <p className="text-base !h-6">{props.placeholder ?? t('Not specified')}</p>
                    }
                  >
                    <p className="text-base !h-6">{getLabel(field.value)}</p>
                  </SelectValue>
                </div>
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {!isRequired && (
                <SelectItem
                  data-testid={`select-option-unset`}
                  value={null as unknown as string}
                  className="h-8 text-neutral-600"
                >
                  {t('Not specified')}
                </SelectItem>
              )}
              {options.map((option) => {
                if (option.type === 'group') {
                  return (
                    <SelectGroup key={option.groupLabel} className="">
                      <SelectLabel className="ml-0 pl-2 text-neutral-400 font-normal">
                        {option.groupLabel}
                      </SelectLabel>
                      {option.options.map((groupOption) => (
                        <SelectItem
                          className="pl-4"
                          data-cy="select-option"
                          data-test={groupOption.disabled ? 'disabled' : 'enabled'}
                          data-testid={`select-option-${groupOption.value}`}
                          key={groupOption.value}
                          value={groupOption.value}
                          disabled={groupOption.disabled}
                        >
                          {groupOption.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  );
                }
                return (
                  <SelectItem
                    key={option.value}
                    data-cy="select-option"
                    data-test={option.disabled ? 'disabled' : 'enabled'}
                    data-testid={`select-option-${option.value}`}
                    value={option.value}
                    disabled={option.disabled}
                  >
                    {option.label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <FormItemDescription {...props} />
          <FormItemError />
        </RootFormItem>
      )}
    ></FormField>
  );
}
