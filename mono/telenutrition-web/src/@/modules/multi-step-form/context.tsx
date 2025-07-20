import { createContext, useContext } from 'react';
import { FieldValues } from 'react-hook-form';
import { DeveloperError } from 'utils/errors';
import { MultiStepFormContextType } from './types';

export const MultiStepFormContext = createContext<MultiStepFormContextType<FieldValues> | null>(
  null,
);

export const useMultiStepFormContext = <
  Values extends FieldValues,
>(): MultiStepFormContextType<Values> => {
  const context = useContext(MultiStepFormContext);
  if (!context) {
    throw new DeveloperError('MultiStepFormContext must be used within a MultiStepForm');
  }
  return context as MultiStepFormContextType<Values>;
};
