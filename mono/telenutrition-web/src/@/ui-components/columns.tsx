import { cn } from '@/utils';
import { ReactNode } from 'react';

export default function Columns({ cols, children }: { cols: number; children: ReactNode }) {
  return (
    <div
      className={cn(
        `grid gap-4 px-4 py-4`,
        cols === 8
          ? 'grid-cols-8'
          : cols === 7
          ? 'grid-cols-7'
          : cols === 6
          ? 'grid-cols-6'
          : cols === 5
          ? 'grid-cols-5'
          : cols === 4
          ? 'grid-cols-4'
          : cols === 3
          ? 'grid-cols-3'
          : cols === 2
          ? 'grid-cols-2'
          : 'grid-cols-1',
      )}
    >
      {children}
    </div>
  );
}
