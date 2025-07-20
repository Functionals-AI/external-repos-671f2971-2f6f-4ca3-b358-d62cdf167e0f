import { FormButtonToggleOption } from '@/modules/form/form-button-toggle';
import { cn } from '@/utils';

import { Tooltip, TooltipArrow, TooltipContent, TooltipProvider, TooltipTrigger } from '../tooltip';
import { Button } from '../button';

export type FormButtonToggleValue = string | number;

interface ButtonToggleProps<T extends FormButtonToggleValue> {
  dataTestId?: string;
  className?: string;
  disabled?: boolean;
  options: FormButtonToggleOption<T>[];
  isError?: boolean;
  value: T;
  onChange: (v: T) => void;
  buttonClassName?: string;
}

export default function ButtonToggle<T extends FormButtonToggleValue>({
  dataTestId,
  className,
  isError,
  options,
  disabled,
  value,
  onChange,
  buttonClassName,
}: ButtonToggleProps<T>) {
  return (
    <div
      data-testid={dataTestId}
      className={cn(
        'space-y-0 flex rounded-lg p-1 gap-x-1 border-neutral-115 border w-fit',
        className,
        isError
          ? 'border-status-red-600 text-status-red-600'
          : 'border-neutral-200 text-neutral-700',
      )}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <TooltipProvider key={option.value}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  data-cy={`selected-${isSelected ? 'true' : 'false'}`}
                  data-testid="form-button-toggle-option"
                  data-test={`form-button-toggle-option-${option.value}`}
                  disabled={disabled || option.disabled}
                  className={cn(
                    'transition-colors border-0 !ring-0 !ring-offset-0 px-4 py-2 flex- min-w-fit flex-1',
                    isError && 'text-status-red-600',
                    disabled && 'text-type-disallowed',
                    buttonClassName,
                  )}
                  size="sm"
                  variant={isSelected ? 'primary' : 'tertiary'}
                  onClick={() => {
                    onChange(option.value);
                  }}
                  leftIcon={
                    option.iconName
                      ? {
                          name: option.iconName,
                          color: disabled ? 'neutral' : isSelected ? 'white' : 'fsGreen',
                          size: 'xs',
                        }
                      : undefined
                  }
                >
                  {option.name}
                </Button>
              </TooltipTrigger>
              {option.tooltip && (
                <TooltipContent className="bg-gray-600 border-0" sideOffset={3}>
                  {option.tooltip}
                  <TooltipArrow className="fill-gray-600" />
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}
