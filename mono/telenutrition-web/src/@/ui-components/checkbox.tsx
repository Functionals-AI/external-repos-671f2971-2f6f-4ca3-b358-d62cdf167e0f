'use client';

import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';

import { cn } from '@/utils';

function CheckIcon({ className }: { className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="10"
      height="8"
      viewBox="0 0 10 8"
      className={cn('', className)}
    >
      <path d="M9.4867 0.792787C9.67418 0.980314 9.77949 1.23462 9.77949 1.49979C9.77949 1.76495 9.67418 2.01926 9.4867 2.20679L4.4867 7.20679C4.29918 7.39426 4.04487 7.49957 3.7797 7.49957C3.51454 7.49957 3.26023 7.39426 3.0727 7.20679L1.0727 5.20679C0.890546 5.01818 0.789752 4.76558 0.79203 4.50339C0.794308 4.24119 0.899477 3.99038 1.08489 3.80497C1.27029 3.61956 1.52111 3.51439 1.7833 3.51211C2.0455 3.50983 2.2981 3.61063 2.4867 3.79279L3.7797 5.08579L8.0727 0.792787C8.26023 0.605316 8.51454 0.5 8.7797 0.5C9.04487 0.5 9.29918 0.605316 9.4867 0.792787Z" />
    </svg>
  );
}

function IndeterminateIcon({ className }: { className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="11"
      height="2"
      viewBox="0 0 11 2"
      className={cn('', className)}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0.385742 1C0.385742 0.734784 0.459492 0.48043 0.590767 0.292893C0.722043 0.105357 0.900091 0 1.08574 0H9.48574C9.67139 0 9.84944 0.105357 9.98072 0.292893C10.112 0.48043 10.1857 0.734784 10.1857 1C10.1857 1.26522 10.112 1.51957 9.98072 1.70711C9.84944 1.89464 9.67139 2 9.48574 2H1.08574C0.900091 2 0.722043 1.89464 0.590767 1.70711C0.459492 1.51957 0.385742 1.26522 0.385742 1Z"
      />
    </svg>
  );
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & {
    checkType?: 'indeterminate' | 'checkbox';
  }
>(({ className, checkType = 'checkbox', ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      'flex items-center justify-center',
      'border border-neutral-200',
      'data-[state=checked]:border-fs-green-200 data-[state=checked]:bg-fs-green-200',
      checkType === 'indeterminate' && 'border-fs-green-200 bg-fs-green-200',
      'h-4 w-4 shrink-0 rounded-md',
      'focusable',
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className={cn('flex items-center justify-center text-current')}>
      {checkType === 'checkbox' ? (
        <CheckIcon className="h-[10px] w-[8px] fill-white" />
      ) : (
        <IndeterminateIcon className="h-[10px] w-[8px] fill-white" />
      )}
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
