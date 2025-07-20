import * as React from 'react';

import { cn } from '@/utils';
import _ from 'lodash';
import { Button } from './button';
import Icon, { IconProps } from './icons/Icon';
import Dot from '@/icons/dot';

export type BadgeVariant =
  | 'neutral'
  | 'blue'
  | 'statusGreen'
  | 'statusAmber'
  | 'statusRed'
  | 'teal'
  | 'purple'
  | 'orange'
  | 'paleGreen'
  | 'clear';

const classMap: Record<
  BadgeVariant,
  { text: string; badge: string; iconColor: IconProps['color'] }
> = {
  neutral: {
    text: 'text-type-primary',
    badge: 'bg-neutral-100 border-neutral-150 text-neutral-400',
    iconColor: 'neutral-150',
  },
  blue: {
    text: 'text-blue-1000',
    badge: 'bg-blue-100 border-blue-200 text-blue-400',
    iconColor: 'blue',
  },
  statusGreen: {
    text: 'text-status-green-700',
    badge: 'bg-status-green-100 border-status-green-200 text-status-green-200',
    iconColor: 'statusGreen',
  },
  statusAmber: {
    text: 'text-status-amber-700',
    badge: 'bg-status-amber-100 border-status-amber-200 text-status-amber-150',
    iconColor: 'statusAmber',
  },
  statusRed: {
    text: 'text-status-red-800',
    badge: 'bg-status-red-100 border-status-red-600 text-status-red-400',
    iconColor: 'statusRed',
  },
  teal: {
    text: 'text-teal-700',
    badge: 'bg-teal-100 border-teal-150 text-teal-400',
    iconColor: 'teal',
  },
  purple: {
    text: 'text-purple-1000',
    badge: 'bg-purple-100 border-purple-300 text-purple-600',
    iconColor: 'purple',
  },
  orange: {
    text: 'text-orange-900',
    badge: 'bg-orange-100 border-orange-200 text-orange-300',
    iconColor: 'orange',
  },
  paleGreen: {
    text: 'text-type-secondary',
    badge: 'bg-fs-pale-green-100 border-pale-green-130 text-type-secondary',
    iconColor: 'fsGreen',
  },
  clear: {
    text: 'text-type-primary',
    badge: 'bg-transparent text-type-secondary',
    iconColor: 'neutral',
  },
};

type DismissableType = { dismissable?: false } | { dismissable: true; onDismiss: () => void };

export type BadgeProps = React.HTMLAttributes<HTMLDivElement> &
  DismissableType & {
    key?: string | number;
    variant?: BadgeVariant;
    leftIconName?: IconProps['name'] | 'dot';
    rightIconName?: IconProps['name'] | 'dot';
    children: React.ReactNode;
  };

function Badge({
  className,
  leftIconName,
  rightIconName,
  variant = 'neutral',
  children,
  ...props
}: BadgeProps) {
  const classes = classMap[variant];

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full text-sm border px-2 py-1 font-normal transition-colors',
        'focus:ring-offset-2 min-h-6 h-fit gap-x-1',
        classes.badge,
        className,
      )}
      {..._.omit(props, 'children', 'buttonProps', 'dismissable', 'onDismiss')}
    >
      {leftIconName && (
        <span className="flex">
          {leftIconName === 'dot' ? (
            <Dot />
          ) : (
            <Icon size="xs" name={leftIconName} color={classes.iconColor} />
          )}
        </span>
      )}
      <span className={classes.text}>{children}</span>
      {props.dismissable && (
        <Button
          type="button"
          variant="quaternary"
          style={{ height: '16px', width: '16px' }}
          onClick={(e) => {
            e.preventDefault();
            props.onDismiss();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              props.onDismiss();
            }
          }}
        >
          <Icon name="x" size="xs" color="neutral" />
        </Button>
      )}
      {rightIconName && (
        <span className="flex">
          {rightIconName === 'dot' ? (
            <Dot />
          ) : (
            <Icon size="xs" name={rightIconName} color={classes.iconColor} />
          )}
        </span>
      )}
    </div>
  );
}

export { Badge };
