import { useState } from 'react';
import { FieldValues, useForm } from 'react-hook-form';
import { useStepper } from '@/modules/stepper';
import { MultiStepFormProps, UseMultiStepFormReturn } from './types';

export function useMultiStepForm<Values extends FieldValues>({
  steps,
  defaultValues,
  onComplete,
}: MultiStepFormProps<Values>): UseMultiStepFormReturn<Values> {
  const [isLoading, setIsLoading] = useState(false);
  const [completedValuesByStep, setCompletedValuesByStep] = useState<FieldValues[]>([]);
  const [prevValues, setPrevValues] = useState<FieldValues>({});
  const form = useForm<Values>({ defaultValues });
  const stepper = useStepper({
    steps,
  });

  return {
    form,
    stepper,
    onComplete,
    isLoading,
    setIsLoading,
    completedValuesByStep,
    setCompletedValuesByStep,
    prevValues,
    setPrevValues,
  };
}
