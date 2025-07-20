import { cn } from '@/utils';
import { ReactNode } from 'react';

export type ElementSize = 'sm' | 'md' | 'lg' | 'xl';

interface DataDisplayProps {
  label?: ReactNode;
  content: string | ReactNode;
  footer?: ReactNode;
  dataTestId?: string;
  className?: string;
  size?: ElementSize;
}

export const elementSizeClassMap: Record<ElementSize, string> = {
  sm: 'w-32',
  md: 'w-48',
  lg: 'w-64',
  xl: 'w-full',
};

export default function DataDisplay({
  label,
  content,
  footer,
  dataTestId,
  className,
  size,
}: DataDisplayProps) {
  return (
    <div
      className={cn('flex flex-col gap-y-0', elementSizeClassMap[size ?? 'lg'], className)}
      data-testid="data-display"
    >
      {label && <label className="text-sm text-type-secondary leading-4">{label}</label>}
      {typeof content === 'object' && typeof content === 'function' ? (
        <p className="text-base text-type-primary" data-testid={dataTestId}>
          {content}
        </p>
      ) : (
        <span data-test="content" data-testid={dataTestId}>
          {content}
        </span>
      )}
      {!!footer && footer}
    </div>
  );
}
