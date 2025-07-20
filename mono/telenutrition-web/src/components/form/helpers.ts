import { RegisterOptions } from 'react-hook-form';
import classNames from '../../utils/classNames';

export const inputClasses = classNames(
  'text-base',
  'py-2 px-2 !mt-0',
  'border border-solid border-neutral-150',
  'rounded-md',
  'focusable',
  'w-full'
);

export const isFieldRequired = (registerOptions: RegisterOptions) => !!registerOptions.required;
