import Link from 'next/link';
import React from 'react';
import LinkButton from '../button/link';

import { cn } from '@/utils';

export default function SeeMore({
  title,
  children,
  className,
}: {
  title: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const [visible, setVisible] = React.useState(false);
  return (
    <div className={cn('w-full', className)}>
      {!visible && (
        <LinkButton
          onClick={() => {
            setVisible(true);
          }}
        >
          {title}
        </LinkButton>
      )}
      {visible && children}
    </div>
  );
}
