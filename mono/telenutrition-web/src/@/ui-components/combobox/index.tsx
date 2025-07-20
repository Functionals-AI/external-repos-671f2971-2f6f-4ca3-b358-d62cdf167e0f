import { cn } from '@/utils';
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Transition,
} from '@headlessui/react';
import { Fragment, ReactNode, useState } from 'react';
import Icon from '../icons/Icon';
import { FormItemBoxUi, FormItemLabelV2 } from '@/modules/form/ui';
import { inputClasses } from '../form/input';
import { Button } from '../button';
import { Trans } from 'react-i18next';

export function findOption(
  value: string | null,
  options: ComboBoxOption[],
): ComboBoxBasicOption | null {
  for (const option of options) {
    if (option.type === 'group') {
      const found = option.options.find((o) => o.value === value);
      if (found) {
        return found;
      }
    } else if (option.value === value) {
      return option;
    }
  }
  return null;
}

export type ComboBoxOption = ComboBoxBasicOption | ComboBoxGroupOption;

export type ComboBoxBasicOption = {
  type?: 'basic';
  label: string;
  // This is not part of the query
  subtext?: string;
  value: string;
  disabled?: boolean;
};

type ComboBoxGroupOption = {
  type: 'group';
  groupLabel: string;
  options: ComboBoxBasicOption[];
};

interface ComboBoxProps {
  inputLabel?: ReactNode;
  value: string | null;
  onSelect: (option: ComboBoxBasicOption | null) => void;
  options: ComboBoxOption[];
  required?: boolean;
  placeholder?: string;
  NoResults?: ReactNode;
  dataTestId?: string;
  isError?: boolean;
  disabled?: boolean;
  className?: string;
  disabledAutoComplete?: boolean;
}

export default function ComboBox({
  options,
  onSelect,
  value,
  inputLabel,
  required,
  placeholder,
  NoResults,
  dataTestId,
  disabled,
  isError,
  className,
  disabledAutoComplete = false,
}: ComboBoxProps) {
  const [query, setQuery] = useState('');

  const filteredOptions =
    query === ''
      ? options
      : options
          .filter((option) => {
            if (option.type === 'group') {
              return true;
            }
            return (
              option.label.toLowerCase().includes(query.toLowerCase()) ||
              option.value.toLowerCase().includes(query.toLowerCase())
            );
          })
          .map((option) => {
            if (option.type === 'group') {
              const filteredOptions = option.options.filter((o) => {
                return (
                  o.label.toLowerCase().includes(query.toLowerCase()) ||
                  o.value.toLowerCase().includes(query.toLowerCase())
                );
              });

              return { ...option, options: filteredOptions };
            } else {
              return option;
            }
          });

  return (
    <Combobox
      disabled={disabled}
      immediate
      value={findOption(value, options)}
      onChange={(v) => onSelect(v)}
    >
      <FormItemBoxUi isError={isError} className={cn('flex-row text-neutral-600', className)}>
        <FormItemLabelV2 label={inputLabel} required={required}>
          <ComboboxInput
            {...(disabledAutoComplete ? { autoComplete: 'off' } : {})}
            data-testid={dataTestId}
            placeholder={placeholder}
            className={cn('overflow-ellipsis', inputClasses)}
            displayValue={(option: ComboBoxBasicOption) => option?.label}
            onChange={(event) => {
              const value = event.target.value;
              if (value === '') {
                onSelect(null);
              }
              setQuery(value);
            }}
          />
        </FormItemLabelV2>
        <ComboboxButton as={Fragment}>
          <Button className="focusable" tabIndex={0} variant="tertiary" size="sm">
            <Icon name="chevron-down" />
          </Button>
        </ComboboxButton>
      </FormItemBoxUi>
      <Transition
        leave="transition ease-in duration-200"
        leaveFrom="opacity-200"
        leaveTo="opacity-0"
        afterLeave={() => setQuery('')}
      >
        <ComboboxOptions
          anchor="bottom start"
          className="bg-white shadow-md [--anchor-gap:12px] w-[var(--input-width)]"
        >
          {filteredOptions.length === 0 ? (
            <div
              className={cn(
                'group flex cursor-default items-center gap-2 rounded-lg py-2.5 px-2 select-none',
                'text-sm',
              )}
            >
              {NoResults ?? (
                <p>
                  <Trans>No results</Trans>
                </p>
              )}
            </div>
          ) : (
            filteredOptions.map((option) =>
              option.type === 'group' ? (
                <div key={option.groupLabel} className="flex flex-col">
                  <h4 className="text-neutral-400 font-normal px-4 py-2">{option.groupLabel}</h4>
                  <div>
                    {option.options.map((o) => (
                      <BasicComboboxOption className="pl-8" key={o.value} option={o} />
                    ))}
                  </div>
                </div>
              ) : (
                <BasicComboboxOption key={option.value} option={option} />
              ),
            )
          )}
        </ComboboxOptions>
      </Transition>
    </Combobox>
  );
}

function BasicComboboxOption({
  option,
  className,
}: {
  option: ComboBoxBasicOption;
  className?: string;
}) {
  return (
    <ComboboxOption
      data-cy="combobox-option"
      data-test={option.disabled ? 'disabled' : 'enabled'}
      data-testid={`combobox-option-${option.value}`}
      disabled={option.disabled}
      value={option}
      className={cn(
        'group flex cursor-pointer items-center gap-2 py-1.5 px-2 select-none',
        'data-[focus]:bg-fs-green-100 data-[selected]:!bg-fs-green-600 data-[selected]:!text-white',
        'data-[disabled]:opacity-50 cursor-pointer',
        className,
      )}
    >
      <div className="text-sm/6 flex gap-x-2">
        <p className="group-data-[selected]:text-white text-neutral-1500">{option.label}</p>
        {option.subtext && (
          <p className="group-data-[selected]:text-white text-neutral-600">{option.subtext}</p>
        )}
      </div>
    </ComboboxOption>
  );
}
