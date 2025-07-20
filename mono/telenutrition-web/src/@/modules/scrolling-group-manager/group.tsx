import { ReactNode, useEffect, useRef } from 'react';
import { useScrollingGroupContext } from './context';
import { cn } from '@/utils';

interface ScrollingGroupProps {
  name: string;
  className?: string;
  children: ReactNode;
}

export default function ScrollingGroup({ name, className, children }: ScrollingGroupProps) {
  const ref = useRef<HTMLDivElement>(null);
  const context = useScrollingGroupContext();

  useEffect(() => {
    if (ref.current && context) {
      context.addRef({ element: ref.current, name });
    }
  }, [ref.current]);

  return (
    <div className={cn(className)} ref={ref}>
      {children}
    </div>
  );
}
