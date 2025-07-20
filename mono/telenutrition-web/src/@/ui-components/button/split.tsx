'use client';

import React, { forwardRef, ReactNode, useContext, useState } from 'react';
import { Button, ButtonProps, ButtonSize, ButtonTheme, ButtonVariant } from '.';
import { DeveloperError } from 'utils/errors';
import { cn } from '@/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '../dropdown-menu';

interface ISplitButtonContext {
  variant: ButtonVariant;
  size: ButtonSize;
  theme: ButtonTheme;
}

const SplitButtonContext = React.createContext<ISplitButtonContext | null>(null);

interface SplitButtonProps {
  variant?: Exclude<ButtonVariant, 'tertiary'>;
  size?: ButtonSize;
  theme?: ButtonTheme;
}

function SplitButton({
  children,
  variant = 'primary',
  size = 'default',
  theme = 'primary',
  ...props
}: SplitButtonProps & { children: ReactNode }) {
  const [state] = useState(() => ({ ...props, variant, size, theme }));

  return (
    <SplitButtonContext.Provider value={state}>
      <div className="flex">{children}</div>
    </SplitButtonContext.Provider>
  );
}

type SplitButtonItemProps = Omit<ButtonProps, 'size'>;

const SplitButtonItem = forwardRef<HTMLButtonElement, SplitButtonItemProps>(function SplitButtonItem(
  { className, ...props },
  ref,
) {
  const context = useContext(SplitButtonContext);
  if (!context) {
    throw new DeveloperError('Must have SplitButtonItem wrapped in element SplitButton');
  }

  const variant = props.variant ?? context.variant;

  const buttonClass =
    variant === 'primary'
      ? 'border-r border-t-0 border-b-0 !border-r-white !border-l-0 last:!border-r-0'
      : 'border-neutral-150 first:border-l-2 border-l-0';

  return (
    <Button
      ref={ref}
      className={cn(
        'focusable',
        'rounded-none first:!rounded-l-md last:!rounded-r-md min-w-min',
        'focus:!border-transparent focus:!z-50',
        buttonClass,
        className,
      )}
      variant={variant}
      size={context.size}
      theme={context.theme}
      {...props}
    />
  );
});

function SplitButtonDropdownItem({ trigger, content }: { trigger: ReactNode; content: ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SplitButtonItem>{trigger}</SplitButtonItem>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">{content}</DropdownMenuContent>
    </DropdownMenu>
  );
}

export { SplitButton, SplitButtonItem, SplitButtonDropdownItem };
