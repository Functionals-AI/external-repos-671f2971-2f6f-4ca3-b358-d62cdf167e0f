import { cn } from '@/utils';
import { ReactNode } from 'react';

export interface ButtonBarProps {
  borderTop?: boolean;
  className?: string;
  children: ReactNode;
}

function ButtonBar({ className, children, borderTop }: ButtonBarProps) {
  return (
    <div
      className={cn(
        'p-4 md:p-4 flex justify-between',
        borderTop ? 'border-t border-t-neutral-200' : '',
        className,
      )}
    >
      {children}
    </div>
  );
}

function Group({ children }: { children: ReactNode }) {
  return <div className="flex gap-x-4">{children}</div>;
}

ButtonBar.Group = Group;

export default ButtonBar;
