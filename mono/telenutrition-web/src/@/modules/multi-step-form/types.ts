import { FieldsWithRequiredProps } from 'components/wizard/types';
import { Dispatch, SetStateAction } from 'react';
import { FieldValues, UseFormReturn, DefaultValues } from 'react-hook-form';
import { useStepper } from '@/modules/stepper';
import { IStepperContext, StepperProps } from '@/modules/stepper/types';

export interface MultiStepFormContextType<Values extends FieldValues> {
  form: UseFormReturn<Values>;
  stepper: IStepperContext;
  handleUpdateData: () => void;
  getValuesAssertDefined: <RequiredKey extends keyof Values>(
    keys: RequiredKey[],
  ) => FieldsWithRequiredProps<Values, RequiredKey>;
}

export type OnCompleteFn<Values extends FieldValues> = (
  values: Values,
  extra: { setIsLoading: (isLoading: boolean) => void },
) => void;

export type MultiStepFormProps<Values extends FieldValues> = {
  defaultValues?: DefaultValues<Values>;
  steps: StepperProps['steps'];
  onComplete: OnCompleteFn<Values>;
  finalSubmitButtonLabel?: string;
};

export interface UseMultiStepFormReturn<Values extends FieldValues> {
  form: UseFormReturn<Values>;
  stepper: ReturnType<typeof useStepper>;
  onComplete: OnCompleteFn<Values>;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  prevValues: FieldValues;
  setPrevValues: (values: FieldValues) => void;
  completedValuesByStep: FieldValues[];
  setCompletedValuesByStep: Dispatch<SetStateAction<FieldValues[]>>;
}
