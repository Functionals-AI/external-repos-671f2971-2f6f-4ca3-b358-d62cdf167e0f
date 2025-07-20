import { RadioGroup as HeadlessRadioGroup } from '@headlessui/react';
import { cn } from '@/utils';
import RadioIcon from '../radio-icon';
import { Fragment } from 'react';
import { OptionVariant, Option } from '../types';
import { useFormField } from '@/ui-components/form/form';

const classMap: Record<OptionVariant, { option: string }> = {
  default: {
    option: 'border-neutral-200 ring-fs-green-600',
  },
  disallowed: {
    option: 'border-neutral-150 bg-neutral-100',
  },
  error: {
    option:
      'border-status-red-800 text-status-red-800 cursor-not-allowed ring-status-red-800 children:pointer-events-none',
  },
};

type RadioGroupItemCardProps = Option & { dataTestId?: string };

export default function RadioGroupItemCard({
  value,
  title,
  description,
  dataTestId,
  variant = 'default',
  disabled,
}: RadioGroupItemCardProps) {
  const item = useFormField();
  const classes = classMap[!!item.error ? 'error' : variant];

  return (
    <HeadlessRadioGroup.Option key={value} value={value} as={Fragment} disabled={disabled}>
      {({ checked, active }) => (
        <div
          {...(disabled && { inert: '' })}
          data-testid={dataTestId}
          className={cn(
            'relative flex cursor-pointer rounded-lg border border-neutral-200 hover:border-neutral-400 bg-white p-4 shadow-sm transition-all focus:ring-2 outline-none ring-offset-2 ring-current gap-x-2',
            classes.option,
            checked ? 'text-fs-green-600 bg-status-green-100 border-fs-green-600 ' : '',
            disabled && 'border-transparent shadow-none',
          )}
        >
          <RadioIcon
            variant={disabled ? 'disallowed' : checked ? 'checked' : variant}
            className="h-4 w-4 mt-1"
          />
          <div>
            <HeadlessRadioGroup.Label
              as="h3"
              className={cn(
                'text-neutral-1500 text-lg font-semibold',
                disabled && 'text-neutral-400',
              )}
            >
              {title}
            </HeadlessRadioGroup.Label>
            {description && (
              <HeadlessRadioGroup.Description
                className={cn('text-neutral-700 text-base', disabled && 'text-neutral-400')}
              >
                {description}
              </HeadlessRadioGroup.Description>
            )}
          </div>
        </div>
      )}
    </HeadlessRadioGroup.Option>
  );
}
