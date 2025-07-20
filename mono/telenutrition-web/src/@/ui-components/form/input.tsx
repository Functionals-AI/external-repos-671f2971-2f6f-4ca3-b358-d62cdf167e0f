import * as React from 'react';

import { cn } from '@/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const inputClasses = [
  'flex w-full border-0 p-0 bg-background text-base ring-offset-none file:border-0 file:bg-transparent ' +
    'file:text-base file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 ' +
    'focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50',
];

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return <input type={type} className={cn(...inputClasses, className)} ref={ref} {...props} />;
  },
);
Input.displayName = 'Input';

export { Input };
