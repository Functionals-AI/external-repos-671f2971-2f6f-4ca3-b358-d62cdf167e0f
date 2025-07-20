import { cn } from '@/utils';
import { ReactNode } from 'react';

export default function Container({
  className,
  children,
  dataTestId,
}: {
  className?: string;
  dataTestId?: string;
  children: ReactNode;
}) {
  return (
    <div data-testid={dataTestId} className={cn('px-2 py-2 md:px-4 md:py-4', className)}>
      {children}
    </div>
  );
}
