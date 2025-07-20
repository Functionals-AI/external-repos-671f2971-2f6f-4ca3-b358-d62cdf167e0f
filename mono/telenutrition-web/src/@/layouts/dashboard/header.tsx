import { ReactNode } from 'react';

interface HeaderProps {
  children: ReactNode;
}

export default function HeaderBar({ children }: HeaderProps) {
  return (
    <div className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-neutral-200 bg-white pl-2 pr-4 shadow-sm">
      {children}
    </div>
  );
}
