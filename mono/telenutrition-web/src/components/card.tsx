import { HTMLAttributes } from 'react';
import classNames from '../utils/classNames';

export type CardProps = HTMLAttributes<HTMLElement> & {
  as?: 'div' | 'button';
};

export default function Card({ className, as = 'div', ...props }: CardProps) {
  const Element: 'div' | 'button' = as;
  return (
    <Element
      className={classNames(
        'bg-white rounded-lg shadow px-5 py-6 md:py-10 sm:px-6 content-center',
        className,
      )}
      {...props}
    />
  );
}
