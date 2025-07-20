import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';

import { cn } from '@/utils';

import Icon, { colorVariant, IconProps } from '../icons/Icon';

export type ButtonTheme = 'primary' | 'destructive';
export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'quaternary';
export type ButtonSize = 'default' | 'sm' | 'lg';

const colorMap: Record<
  ButtonTheme,
  Record<ButtonVariant, { className: string; iconColor: colorVariant }> & { all: string }
> = {
  primary: {
    all: 'border-fs-green-600 ring-fs-green-300 focusable',
    primary: {
      className:
        'bg-fs-green-600 text-white fill-white hover:bg-fs-green-300 focus:bg-fs-green-300 hover:border-fs-green-300 ' +
        'active:border-fs-green-300 focus:border-fs-green-300 disabled:bg-neutral-115 disabled:text-type-disallowed group ' +
        'disabled:border-neutral-115',
      iconColor: 'white',
    },
    secondary: {
      className:
        'bg-transparent text-type-secondary fill-fs-green-600 hover:text-fs-green-600 focus:text-fs-green-600 ' +
        'active:text-fs-green-600 hover:bg-fs-pale-green-100 focus:bg-fs-pale-green-100 active:bg-fs-pale-green-100 ' +
        'border-neutral-200 disabled:text-type-disallowed disabled:border-color-neutral-115 group',
      iconColor: 'neutral',
    },
    tertiary: {
      className:
        'bg-transparent text-fs-green-600 fill-fs-green-300 hover:bg-fs-pale-green-100 focus:bg-fs-pale-green-100 ' +
        'active:bg-fs-pale-green-100 border-none fs-pale-green-100 disabled:text-type-disallowed group',
      iconColor: 'fsGreen',
    },
    quaternary: {
      className:
        'bg-transparent text-neutral-700 fill-neutral-700 focus:fill-neutral-1500 hover:bg-neutral-115 ' +
        'focus:bg-neutral-115 border-none p-0 disabled:text-type-disallowed group',
      iconColor: 'neutral',
    },
  },
  destructive: {
    all: 'border-status-red-800 ring-status-red-600 focusable-error',
    primary: {
      className:
        'bg-status-red-800 text-white fill-white focus:bg-status-red-600 hover:bg-status-red-600 active:bg-status-red-600 ' +
        'focus:border-status-red-600 hover:border-status-red-600 active:border-status-red-600 disabled:bg-neutral-115 disabled:text-type-disallowed',
      iconColor: 'white',
    },
    secondary: {
      className:
        'bg-transparent border-status-red-600 text-status-red-800 fill-status-red-800 focus:bg-status-red-100 ' +
        'hover:bg-status-red-100 active:bg-status-red-100 disabled:text-type-disallowed',
      iconColor: 'statusRed',
    },
    tertiary: {
      className:
        'bg-transparent text-status-red-800 fill-status-red-800 border-none focus:bg-status-red-100 ' +
        'hover:bg-status-red-100 active:bg-status-red-100 disabled:text-type-disallowed',
      iconColor: 'statusRed',
    },
    quaternary: {
      className:
        'border-none hover:bg-status-red-100 active:bg-status-red-100 disabled:text-type-disallowed',
      iconColor: 'statusRed',
    },
  },
};

export const sizeClassMap: Record<ButtonSize, { button: string; icon: string }> = {
  default: { icon: 'h-6 w-6', button: 'text-base leading-6 py-2 px-4 gap-x-2' },
  sm: { icon: 'h-4 w-4', button: 'text-sm leading-4 py-1 px-2 gap-x-1' },
  lg: { icon: 'h-6 w-6', button: 'text-lg leading-8 py-2 px-6 gap-x-2' },
};

export const iconButtonSizeClassMap: Record<ButtonSize, { button: string; icon: string }> = {
  default: { icon: 'h-6 w-6', button: 'text-base leading-6 py-2 px-2 gap-x-2' },
  sm: { icon: 'h-4 w-4', button: 'text-sm leading-4 p-1 gap-x-1' },
  lg: { icon: 'h-6 w-6', button: 'text-lg leading-8 py-[12px] px-3 gap-x-2' },
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  theme?: ButtonTheme;
  variant?: ButtonVariant;
  leftIcon?: IconProps;
  size?: ButtonSize;
  dataTestId?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      size = 'default',
      theme = 'primary',
      variant = 'primary',
      leftIcon,
      asChild = false,
      children,
      dataTestId,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';
    const found = colorMap[theme];
    const all = found.all;
    const varClassName = found[variant].className;
    const { button } = sizeClassMap[size];

    return (
      <Comp
        data-testid={dataTestId}
        className={cn(
          'group',
          'inline-flex items-center justify-center rounded-[4px] text-fs-white text-base transition-all disabled:pointer-events-none',
          'border border-solid transition-all',
          button,
          all,
          varClassName,
          className,
        )}
        ref={ref}
        type="button"
        {...props}
      >
        {leftIcon && (
          <Icon
            size={size === 'default' ? 'md' : size === 'lg' ? 'lg' : 'sm'}
            color={found[variant].iconColor}
            {...leftIcon}
            className={cn('group-disabled:!text-neutral-400', leftIcon.className)}
          />
        )}
        {children}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

export { Button };
