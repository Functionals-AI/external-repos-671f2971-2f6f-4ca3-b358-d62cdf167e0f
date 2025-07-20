import { PropsWithChildren } from 'react';
import { cn } from '@/utils';

export default function CellSkeleton({
  className,
  children,
  dataTestId,
  ...props
}: PropsWithChildren<{
  dataTestId?: string;
  className?: string;
}>) {
  return (
    <div
      data-testid={dataTestId}
      className={cn('w-full h-full flex px-3 py-3 gap-x-2 text-sm', className)}
      {...props}
    >
      {children}
    </div>
  );
}
