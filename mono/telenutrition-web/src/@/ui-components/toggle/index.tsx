import { cn } from '@/utils';
import { Switch } from '@headlessui/react';
import Icon from '../icons/Icon';

interface ToggleProps extends React.HTMLAttributes<HTMLDivElement> {
  setEnabled: (e: boolean) => void;
  enabled: boolean;
  title?: string;
  description?: string;
  disabled?: boolean;
  dataCy?: string;
}

export default function Toggle({
  enabled,
  setEnabled,
  title,
  description,
  disabled = false,
  dataCy
}: ToggleProps) {
  return (
    <Switch.Group as="div" className="flex gap-x-2">
      <Switch
        checked={enabled}
        onChange={setEnabled}
        className={cn(
          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-fs-green-300 focus:ring-offset-2 transition-all',
          enabled
            ? 'bg-fs-green-600 border-fs-green-600 hover:bg-fs-green-300 hover:border-fs-green-300 focus:border-fs-green-300 active:border-fs-green-300 focus:bg-fs-green-300'
            : 'bg-neutral-200 border-neutral-200 hover:bg-neutral-400 focus:bg-neutral-400 focus:border-neutral-400 active:border-neutral-400 hover:border-neutral-400 disabled:bg-neutral-150',
          disabled
            ? 'pointer-events-none cursor-not-allowed bg-neutral-150 border-neutral-150'
            : '',
        )}
        disabled={disabled}
        data-cy={dataCy}
      >
        <span className="sr-only">Use setting</span>
        <span
          aria-hidden="true"
          className={cn(
            '!flex items-center justify-center',
            enabled ? 'translate-x-5' : 'translate-x-0',
            'pointer-events-none disabled:bg-neutral-100 inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-all duration-200 ease-in-out',
            disabled ? 'bg-neutral-100 shadow-none' : '',
          )}
        >
          <Icon name={enabled ? 'check' : 'x'} size="xs" color={enabled ? 'fsGreen' : disabled ? 'neutral-150' : 'neutral'} />
        </span>
      </Switch>
      <span className="flex flex-grow flex-col">
        <Switch.Label className={cn('text-base', disabled ? 'text-neutral-150' : '')} passive>
          {title}
        </Switch.Label>
        <Switch.Description className={cn('text-sm', disabled ? 'text-neutral-150' : '')}>
          {description}
        </Switch.Description>
      </span>
    </Switch.Group>
  );
}
