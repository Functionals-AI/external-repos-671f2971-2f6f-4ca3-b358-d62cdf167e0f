import { useMemo, useState } from 'react';

import { FormItemBoxUi } from '@/modules/form/ui';
import Icon from '@/ui-components/icons/Icon';
import FilterOption from './filter-option';
import Button from '../../../components/button';
import { Input } from '@/ui-components/form/input';
import FormItemBox from '@/modules/form/form-item-box';
import { Badge } from '@/ui-components/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from '../dropdown-menu';
import { Trans } from 'react-i18next';

export interface FilterSelectOption {
  label: string;
  value: string | number;
}

type FilterValue = string | number;

type SingleProps = {
  multiple?: false;
  value: FilterValue;
};

type MultipleProps = {
  multiple: true;
  value: FilterValue[];
};

type CommonProps = {
  label: string;
  options: FilterSelectOption[];
  onSelect: (value: FilterValue | FilterValue[] | null) => void;
  showSearch?: boolean;
  disabled?: boolean;
  isError?: boolean;
  className?: string;
};

type Props = (SingleProps & CommonProps) | (MultipleProps & CommonProps);

export default function FilterSelect({
  label,
  value,
  multiple,
  options,
  onSelect,
  showSearch,
  isError,
  className,
}: Props) {
  const [filterText, setFilterText] = useState('');

  const optionElements = useMemo(
    () =>
      options
        .filter((option) => !filterText || option.label.includes(filterText))
        .map((option) => {
          let selected = false;
          if (multiple) {
            selected = value?.includes(option.value);
          } else {
            selected = value === option.value;
          }

          return (
            <FilterOption
              key={option.value}
              label={option.label}
              selected={selected}
              value={option.value}
              multiple={multiple}
              onClick={() => {
                if (multiple) {
                  const newValues = selected
                    ? (value ?? []).filter((v) => v !== option.value)
                    : [...(value ?? []), option.value];
                  onSelect(newValues);
                } else {
                  onSelect(option.value);
                }
              }}
            />
          );
        }),
    [options, filterText, value],
  );
  let labelElement;
  if (multiple) {
    labelElement = (
      <span>
        {label} {value?.length > 0 && <Badge variant="statusGreen">{value.length}</Badge>}
      </span>
    );
  } else {
    const option = options.find((o) => o.value === value);
    labelElement = (
      <span>
        {option?.label || label} {value && <Badge variant="statusGreen">1</Badge>}
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <FormItemBoxUi className="flex flex-row gap-2" as="button" isError={isError}>
          {labelElement}
          <Icon name="chevron-down" />
        </FormItemBoxUi>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        onKeyDown={(e) => {
          e.stopPropagation();
        }}
        onInteractOutside={() => {
          setTimeout(() => {
            setFilterText('');
          }, 500);
        }}
        className="w-80"
        align="start"
      >
        {showSearch && (
          <div className="p-2">
            <FormItemBox className="flex flex-row">
              <Icon name="search" className="inline" />
              <Input
                value={filterText}
                onChange={(e) => {
                  setFilterText(e.target.value);
                  e.preventDefault();
                  e.stopPropagation();
                }}
              />
            </FormItemBox>
          </div>
        )}
        {value && (
          <div className="border-b-2 border-neutral-150">
            <Button
              variant="tertiary"
              size="small"
              className="p-1 m-2"
              onClick={() => {
                if (multiple) {
                  onSelect([]);
                } else {
                  onSelect(null);
                }
              }}
            >
              <Trans>Clear selection</Trans>
            </Button>
          </div>
        )}
        <DropdownMenuGroup className="max-h-96 h-full overflow-y-auto">
          {optionElements}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
