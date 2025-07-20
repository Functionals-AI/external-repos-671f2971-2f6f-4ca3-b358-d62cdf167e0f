import { cn } from '@/utils';
import RadioIcon from '../radio-icon';

interface RadioOptionProps {
  label?: string;
  isError?: boolean;
  sublabel?: string;
  disabled?: boolean;
  checked: boolean;
  onChecked: () => void;
  dataTestId?: string;
}

export default function RadioOption({
  label,
  sublabel,
  disabled,
  checked,
  onChecked,
  isError,
  dataTestId,
}: RadioOptionProps) {
  return (
    <div className={cn('flex flex-col gap-y-2')}>
      <label className="flex gap-x-2 cursor-pointer">
        <button
          disabled={disabled}
          data-testid={dataTestId}
          data-state={checked ? 'checked' : 'unchecked'}
          type="button"
          onClick={() => onChecked()}
          {...(disabled && { inert: '' })}
          className={cn(
            'group',
            'ring-0 ring-offset-0 outline-none',
            'flex gap-x-3 items-center',
            disabled && 'opacity-40',
          )}
        >
          <RadioIcon
            variant={isError ? 'error' : disabled ? 'disallowed' : checked ? 'checked' : 'default'}
            className={cn(
              'h-4 w-4 cursor-pointer',
              'group-focus:ring-2 ring-offset-2 ring-fs-green-300 transition-all rounded-full',
            )}
          />
        </button>
        {(label || sublabel) && (
          <div className="flex flex-col items-start">
            <p
              className={cn(
                'text-neutral-1500 text-base',
                disabled && 'text-neutral-400',
                isError && '!text-status-red-800',
              )}
            >
              {label}
            </p>
            {sublabel && (
              <p
                className={cn(
                  'cursor-pointer text-sm text-neutral-400',
                  disabled && 'text-neutral-400',
                  isError && '!text-status-red-800',
                )}
              >
                {sublabel}
              </p>
            )}
          </div>
        )}
      </label>
    </div>
  );
}
