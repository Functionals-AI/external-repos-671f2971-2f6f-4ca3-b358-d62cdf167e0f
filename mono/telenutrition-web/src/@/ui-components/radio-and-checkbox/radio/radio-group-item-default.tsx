import { Option } from '../types';
import { RadioGroup as HeadlessRadioGroup } from '@headlessui/react';
import RadioIcon from '../radio-icon';
import { Fragment } from 'react';
import { cn } from '@/utils';
import { useFormField } from '@/ui-components/form/form';

type RadioGroupItemDefaultProps = Option;

export default function RadioGroupItemDefault({
  value,
  title,
  description,
  variant = 'default',
  direction = 'horizontal',
  disabled,
  ...props
}: RadioGroupItemDefaultProps) {
  const item = useFormField();
  const isError = !!item.error || variant === 'error';

  return (
    <HeadlessRadioGroup.Option key={value} value={value} as={Fragment} disabled={disabled}>
      {({ checked, active }) => (
        <div
          data-test={`radio-group-item-${value}`}
          {...(variant === 'disallowed' && { inert: '' })}
          className={cn(
            'w-fit',
            'cursor-pointer',
            'flex gap-x-3 focusable items-center',
            variant === 'disallowed' ? 'opacity-40' : 'focusable',
            direction === 'horizontal' ? 'gap-x-3' : 'flex-col-reverse gap-y-1',
          )}
          {...(disabled && { inert: '' })}
          {...props}
        >
          <RadioIcon
            variant={isError ? 'error' : disabled ? 'disallowed' : checked ? 'checked' : variant}
            className={cn('h-4 w-4 mt-1 cursor-pointer')}
          />
          {(title || description) && (
            <div>
              <HeadlessRadioGroup.Label
                className={cn(
                  'cursor-pointer',
                  'text-base font-normal text-neutral-600',
                  disabled && 'text-neutral-400',
                  isError && 'text-status-red-800',
                )}
              >
                {title}
              </HeadlessRadioGroup.Label>
              {description && (
                <HeadlessRadioGroup.Description
                  className={cn('cursor-pointer', disabled && 'text-neutral-400')}
                >
                  {description}
                </HeadlessRadioGroup.Description>
              )}
            </div>
          )}
        </div>
      )}
    </HeadlessRadioGroup.Option>
  );
}
