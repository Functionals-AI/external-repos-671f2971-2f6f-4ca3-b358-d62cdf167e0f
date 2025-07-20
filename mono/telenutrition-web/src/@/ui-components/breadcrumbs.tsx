import React, {Fragment} from 'react';

import { cn } from '@/utils';
import Link from 'next/link';
import Icon from './icons/Icon';

interface BreadcrumbsProps {
  items: { label: string; link?: string }[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <div className="flex items-center gap-x-2">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <Fragment key={`[${item.label}]${item.link}`}>
            {item.link ? (
              <Link
                className={cn(
                  'text-base focusable no-underline',
                  isLast ? 'text-neutral-1500' : 'text-neutral-400',
                )}
                href={item.link}
              >
                {item.label}
              </Link>
            ) : (
              <h2 className={cn('text-base', isLast ? 'text-neutral-1500' : 'text-neutral-400')}>
                {item.label}
              </h2>
            )}
            {!isLast && <Icon name="chevron-right" color="neutral" />}
          </Fragment>
        );
      })}
    </div>
  );
}
