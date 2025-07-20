import { Button, type ButtonSize } from '.';
import { ReactNode } from 'react';
import { cn } from '@/utils';
import Icon, { IconProps } from '../icons/Icon';

export type LinkButtonProps = {
  size?: ButtonSize;
  onClick?: () => void;
  iconName?: IconProps['name'] | null;
  children?: ReactNode;
  className?: string;
};

const sizeMap: Record<ButtonSize, string> = {
  default: 'text-base leading-6',
  sm: 'text-sm leading-4',
  lg: 'text-lg leading-6',
};

export default function LinkButton({
  size = 'default',
  iconName = 'arrow-right',
  children,
  // onClick,
  className = 'px-1',
  ...props
}: LinkButtonProps) {
  return (
    <Button
      className={cn(
        sizeMap[size],
        'ring-offset-0 rounded-sm border-transparent border-b-1 py-0 border-b-blue-400 border-dashed self-center',
        'text-blue-400 bg-transparent',
        'hover:bg-blue-100 ring-0 hover:ring-0 focus:ring-0 active:ring-0 active:bg-blue-100 active:border-blue-400 hover:border-blue-400 focus:border-blue-400 focus:bg-blue-100 transition-all',
        'border-r-0 border-t-0 border-l-0',
        className,
      )}
      {...props}
    >
      {children}
      {iconName && <Icon name={iconName} color={'blue'} size={size === 'sm' ? 'xs' : 'sm'} />}
    </Button>
  );
}
