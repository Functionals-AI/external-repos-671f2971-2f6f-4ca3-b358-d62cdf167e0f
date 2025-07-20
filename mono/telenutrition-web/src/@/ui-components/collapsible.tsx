'use client';

import { cn } from '@/utils';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import Icon from './icons/Icon';

const Collapsible = CollapsiblePrimitive.Root;

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger;

const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent;

const BasicCollapsibleTrigger = ({
  disabled,
  className,
  label,
  dataTestId,
}: {
  disabled?: boolean;
  className?: string;
  label: string;
  dataTestId?: string;
}) => {
  return (
    <CollapsibleTrigger
      disabled={disabled}
      className={cn('flex items-center gap-x-1 group py-2', className)}
      data-testid={dataTestId}
    >
      <Icon
        name="chevron-right"
        size="sm"
        className={cn(
          "group-data-[state='open']:rotate-90 transition-transform text-neutral-600 text-xl",
          disabled && 'text-neutral-200',
        )}
      />
      <p className={cn(disabled && 'text-neutral-200')}>{label}</p>
    </CollapsibleTrigger>
  );
};

export { Collapsible, CollapsibleTrigger, CollapsibleContent, BasicCollapsibleTrigger };
