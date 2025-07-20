'use client';

import * as React from 'react';

import { Command, CommandGroup, CommandItem, CommandList } from '@/ui-components/command';
import { Command as CommandPrimitive, useCommandState } from 'cmdk';
import { useEffect, forwardRef } from 'react';
import { Badge } from '@/ui-components/badge';
import { cn } from '@/utils';
import { Trans } from 'react-i18next';
import { FormItemBoxUi, FormItemLabel, FormItemLabelV2 } from '@/modules/form/ui';
import { GroupTagInputOption, TagInputOption } from './types';
import { removePickedOption, transToGroupOption, useDebounce } from './helpers';

type CommandProps = React.ComponentPropsWithoutRef<typeof Command>;

interface TagInputProps {
  isError?: boolean;
  id: string;
  value?: TagInputOption[];
  defaultOptions?: TagInputOption[];
  /** manually controlled options */
  options: TagInputOption[];
  placeholder?: string;
  /** Loading component. */
  loadingIndicator?: React.ReactNode;
  /** Empty component. */
  emptyText?: React.ReactNode;
  /** Debounce time for async search. Only work with `onSearch`. */
  delay?: number;
  /**
   * Only work with `onSearch` prop. Trigger search when `onFocus`.
   * For example, when user click on the input, it will trigger the search to get initial options.
   **/
  triggerSearchOnFocus?: boolean;
  /** async search */
  onSearch?: (value: string) => Promise<TagInputOption[]>;
  onChange?: (options: TagInputOption[]) => void;
  /** Limit the maximum number of selected options. */
  maxSelected?: number;
  /** When the number of selected options exceeds the limit, the onMaxSelected will be called. */
  onMaxSelected?: (maxLimit: number) => void;
  /** Hide the placeholder when there are options selected. */
  hidePlaceholderWhenSelected?: boolean;
  disabled?: boolean;
  /** Group the options base on provided key. */
  groupBy?: string;
  className?: string;
  badgeClassName?: string;
  /**
   * First item selected is a default behavior by cmdk. That is why the default is true.
   * This is a workaround solution by add a dummy item.
   *
   * @reference: https://github.com/pacocoursey/cmdk/issues/171
   */
  selectFirstItem?: boolean;
  /** Allow user to create option when there is no option matched. */
  creatable?: boolean;
  /** Props of `Command` */
  commandProps?: CommandProps;
  /** Props of `CommandInput` */
  inputProps?: Omit<
    React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>,
    'value' | 'placeholder' | 'disabled'
  >;
  inputLabel: string;
  required?: boolean;
  dataTestId?: string;
}

export interface TagInputRef {
  selectedValue: TagInputOption[];
  input: HTMLInputElement;
}

/**
 * The `CommandEmpty` of shadcn/ui will cause the cmdk empty not rendering correctly.
 * So we create one and copy the `Empty` implementation from `cmdk`.
 *
 * @reference: https://github.com/hsuanyi-chou/shadcn-ui-expansions/issues/34#issuecomment-1949561607
 **/
const CommandEmpty = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof CommandPrimitive.Empty>
>(({ className, ...props }, forwardedRef) => {
  const render = useCommandState((state) => state.filtered.count === 0);

  if (!render) return null;

  return (
    <div
      ref={forwardedRef}
      className={cn('py-6 text-center text-sm', className)}
      cmdk-empty=""
      role="presentation"
      {...props}
    />
  );
});

CommandEmpty.displayName = 'CommandEmpty';

const TagInput = React.forwardRef<TagInputRef, TagInputProps>(
  (
    {
      value,
      onChange,
      placeholder,
      defaultOptions: arrayDefaultOptions = [],
      options: arrayOptions,
      delay,
      onSearch,
      loadingIndicator,
      emptyText,
      maxSelected = Number.MAX_SAFE_INTEGER,
      onMaxSelected,
      hidePlaceholderWhenSelected,
      disabled,
      groupBy,
      className,
      badgeClassName,
      selectFirstItem = true,
      creatable = false,
      triggerSearchOnFocus = false,
      commandProps,
      inputProps,
      inputLabel,
      id,
      required,
      isError,
      dataTestId,
    }: TagInputProps,
    ref: React.Ref<TagInputRef>,
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [open, setOpen] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);

    const [selected, setSelected] = React.useState<TagInputOption[]>(value || []);
    const [options, setOptions] = React.useState<GroupTagInputOption>(
      transToGroupOption(arrayDefaultOptions, groupBy),
    );
    const [inputValue, setInputValue] = React.useState('');
    const debouncedSearchTerm = useDebounce(inputValue, delay || 500);

    React.useImperativeHandle(
      ref,
      () => ({
        selectedValue: [...selected],
        input: inputRef.current as HTMLInputElement,
      }),
      [selected],
    );

    const handleUnselect = React.useCallback(
      (option: TagInputOption) => {
        const newOptions = selected.filter((s) => s.value !== option.value);
        setSelected(newOptions);
        onChange?.(newOptions);
      },
      [selected],
    );

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        const input = inputRef.current;
        if (input) {
          if (e.key === 'Delete' || e.key === 'Backspace') {
            if (input.value === '' && selected.length > 0) {
              handleUnselect(selected[selected.length - 1]);
            }
          }
          // This is not a default behaviour of the <input /> field
          if (e.key === 'Escape') {
            input.blur();
          }
        }
      },
      [selected],
    );

    useEffect(() => {
      if (value) {
        setSelected(value);
      }
    }, [value]);

    useEffect(() => {
      /** If `onSearch` is provided, do not trigger options updated. */
      if (!arrayOptions || onSearch) {
        return;
      }
      const newOption = transToGroupOption(arrayOptions || [], groupBy);
      if (JSON.stringify(newOption) !== JSON.stringify(options)) {
        setOptions(newOption);
      }
    }, [arrayDefaultOptions, arrayOptions, groupBy, onSearch, options]);

    useEffect(() => {
      const doSearch = async () => {
        setIsLoading(true);
        const res = await onSearch?.(debouncedSearchTerm);
        setOptions(transToGroupOption(res || [], groupBy));
        setIsLoading(false);
      };

      const exec = async () => {
        if (!onSearch || !open) return;

        if (triggerSearchOnFocus) {
          await doSearch();
        }

        if (debouncedSearchTerm) {
          await doSearch();
        }
      };

      void exec();
    }, [debouncedSearchTerm, open]);

    const CreatableItem = () => {
      if (!creatable) return undefined;

      const Item = (
        <CommandItem
          data-testid="tag-input-creatable-item"
          value={inputValue}
          className="cursor-pointer"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onSelect={(value: string) => {
            if (selected.length >= maxSelected) {
              onMaxSelected?.(selected.length);
              return;
            }
            setInputValue('');
            const newOptions: TagInputOption[] = [
              ...selected,
              { value, label: value, type: 'custom' },
            ];
            setSelected(newOptions);
            onChange?.(newOptions);
          }}
        >
          <Trans>Add</Trans> {`${inputValue}`}
        </CommandItem>
      );

      // For normal creatable
      if (!onSearch && inputValue.length > 0) {
        return Item;
      }

      // For async search creatable. avoid showing creatable item before loading at first.
      if (onSearch && debouncedSearchTerm.length > 0 && !isLoading) {
        return Item;
      }

      return undefined;
    };

    const EmptyItem = React.useCallback(() => {
      const emptyIndicator = emptyText ?? (
        <div data-testid="tag-input-no-results">
          <Trans>No results</Trans>
        </div>
      );

      // For async search that showing emptyIndicator
      if (onSearch && !creatable && Object.keys(options).length === 0) {
        return (
          <CommandItem value="-" disabled>
            {emptyIndicator}
          </CommandItem>
        );
      }

      return <CommandEmpty>{emptyIndicator}</CommandEmpty>;
    }, [creatable, emptyText, onSearch, options]);

    const selectables = React.useMemo<GroupTagInputOption>(
      () => removePickedOption(options, selected),
      [options, selected],
    );

    /** Avoid Creatable Selector freezing or lagging when paste a long string. */
    const commandFilter: () => CommandProps['filter'] = React.useCallback(() => {
      if (commandProps?.filter) {
        return commandProps.filter;
      }

      if (creatable) {
        return (value: string, search: string) => {
          return value.toLowerCase().includes(search.toLowerCase()) ? 1 : -1;
        };
      }
      return (value, search, keywords) => {
        const extendValue =
          value.toLocaleLowerCase +
          ' ' +
          (arrayOptions.find((option) => option.value === value)?.label ?? '');
        if (extendValue.toLocaleLowerCase().includes(search.toLocaleLowerCase())) return 1;
        return 0;
      };
    }, [creatable, commandProps?.filter]);

    return (
      <Command
        {...commandProps}
        onKeyDown={(e) => {
          handleKeyDown(e);
          commandProps?.onKeyDown?.(e);
        }}
        className={cn('overflow-visible bg-transparent', commandProps?.className)}
        shouldFilter={
          commandProps?.shouldFilter !== undefined ? commandProps.shouldFilter : !onSearch
        } // When onSearch is provided, we don't want to filter the options. You can still override it.
        filter={commandFilter()}
        data-testid={dataTestId}
      >
        <FormItemBoxUi isError={isError} className={cn(className)} isDisabled={disabled}>
          <FormItemLabelV2 label={inputLabel} required={required} />
          <div className="mt-1 flex flex-wrap gap-1 items-center">
            {/*  If want to add "Fixed" badges, do it here */}
            {selected.map((option) => {
              return (
                <Badge
                  data-testid="tag-input-badge"
                  key={option.value}
                  variant="neutral"
                  dismissable={true}
                  className={cn(
                    'focusable',
                    'data-[fixed=true]:bg-status-green-100 data-[fixed]:text-neutral-400 data-[fixed]:hover:bg-status-green-100',
                    'flex items-center justify-center',
                    badgeClassName,
                  )}
                  onDismiss={() => {
                    handleUnselect(option);
                  }}
                  data-disabled={disabled}
                >
                  {option.label}
                </Badge>
              );
            })}
            {/* Avoid having the "Search" Icon */}
            <CommandPrimitive.Input
              {...inputProps}
              data-testid="tag-input-input"
              ref={inputRef}
              value={inputValue}
              disabled={disabled}
              onValueChange={(value) => {
                setInputValue(value);
                inputProps?.onValueChange?.(value);
              }}
              onBlur={(event) => {
                setOpen(false);
                inputProps?.onBlur?.(event);
              }}
              onFocus={(event) => {
                setOpen(true);
                triggerSearchOnFocus && onSearch?.(debouncedSearchTerm);
                inputProps?.onFocus?.(event);
              }}
              placeholder={hidePlaceholderWhenSelected && selected.length !== 0 ? '' : placeholder}
              className={cn(
                'p-0',
                'flex-1 text-base bg-transparent outline-none placeholder:text-neutral-400 ring-0 border-0 hover:border-0 hover:ring-0 focus:border-0 focus:ring-0',
                inputProps?.className,
              )}
            />
          </div>
        </FormItemBoxUi>
        <div className="relative mt-2">
          {open && (
            <CommandList className="absolute top-0 z-10 w-full rounded-md bg-white text-neutral-700 shadow-md outline-none animate-in">
              {isLoading ? (
                <>{loadingIndicator}</>
              ) : (
                <>
                  {EmptyItem()}
                  {CreatableItem()}
                  {!selectFirstItem && <CommandItem value="-" className="hidden" />}
                  {Object.entries(selectables).map(([key, dropdowns]) => (
                    <CommandGroup key={key} heading={key} className="h-full overflow-auto">
                      <>
                        {dropdowns.map((option) => {
                          return (
                            <CommandItem
                              data-testid="tag-input-item"
                              key={option.value}
                              value={option.value}
                              disabled={option.disabled}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              onSelect={() => {
                                if (selected.length >= maxSelected) {
                                  onMaxSelected?.(selected.length);
                                  return;
                                }
                                setInputValue('');
                                const newOptions: TagInputOption[] = [
                                  ...selected,
                                  { ...option, type: 'predefined' },
                                ];
                                setSelected(newOptions);
                                onChange?.(newOptions);
                              }}
                              className={cn(
                                'cursor-pointer',
                                option.disabled && 'cursor-default text-muted-foreground',
                              )}
                            >
                              {option.label}
                            </CommandItem>
                          );
                        })}
                      </>
                    </CommandGroup>
                  ))}
                </>
              )}
            </CommandList>
          )}
        </div>
      </Command>
    );
  },
);

TagInput.displayName = 'TagInput';
export default TagInput;
