import { SVGProps } from 'react';
import { OptionVariant } from './types';
import { cn } from '@/utils';

export default function RadioIcon({
  variant,
  ...props
}: { variant: OptionVariant | 'checked' } & SVGProps<SVGSVGElement>) {
  if (variant === 'default' || variant === 'disallowed') {
    return (
      <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
        <rect x="0.5" y="0.5" width="15" height="15" rx="7.5" fill="white" />
        <circle cx="8" cy="8" r="3" fill="white" />
        <rect x="0.5" y="0.5" width="15" height="15" rx="7.5" stroke="#AFB2B2" />
      </svg>
    );
  }

  if (variant === 'error') {
    return (
      <svg
        {...props}
        className={cn('border border-status-red-800 rounded-full', props.className)}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 12 12"
        fill="none"
      >
        <path
          className="fill-current"
          d="M6 1.5C5.51675 1.5 5.125 1.89175 5.125 2.375V6.625C5.125 7.10825 5.51675 7.5 6 7.5C6.48325 7.5 6.875 7.10825 6.875 6.625V2.375C6.875 1.89175 6.48325 1.5 6 1.5Z"
        />
        <path
          className="fill-current"
          d="M6 10.5C6.55228 10.5 7 10.0523 7 9.5C7 8.94772 6.55228 8.5 6 8.5C5.44772 8.5 5 8.94772 5 9.5C5 10.0523 5.44772 10.5 6 10.5Z"
        />
      </svg>
    );
  }

  if (variant === 'checked') {
    return (
      <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
        <rect height="100%" width="100%" rx="8" fill="#0C694B" />
        <circle cx="8" cy="8" r="3" fill="white" />
      </svg>
    );
  }

  return null;
}
