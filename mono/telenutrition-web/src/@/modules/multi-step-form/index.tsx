import { FormV2 } from '@/modules/form/form';
import Stepper from '@/modules/stepper';
import { ReactNode } from 'react';
import { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { FieldsWithRequiredProps } from 'components/wizard/types';
import { DeveloperError } from 'utils/errors';
import ButtonBar from '@/ui-components/button/group';
import { Button, ButtonProps } from '@/ui-components/button';
import FullScreenLoading from '@/ui-components/loading/full-screen-loading';
import { getUpdatedValues } from './helpers';
import { MultiStepFormContext, useMultiStepFormContext } from './context';
import { UseMultiStepFormReturn } from './types';
import { useMultiStepForm } from './useMultiStepForm';
import { useTranslation } from 'react-i18next';

function MultiStepForm<Values extends FieldValues>({
  stepper,
  form,
  onComplete,
  children,
  isLoading,
  setIsLoading,
  completedValuesByStep,
  setCompletedValuesByStep,
  prevValues,
  setPrevValues,
}: UseMultiStepFormReturn<Values> & { children: ReactNode }) {
  function handleUpdateData() {
    const updatedValues = getUpdatedValues(form.getValues(), prevValues);
    setPrevValues(form.getValues());
    // Have not completed this step, simply add new data and continue
    if (stepper.currStep >= completedValuesByStep.length) {
      setCompletedValuesByStep((stepsValues) => [...stepsValues, updatedValues]);
      return;
    }

    // otherwise...

    // IF NO values have changed, do not mutate data at all, simply go to next step
    if (Object.keys(updatedValues).length === 0) {
      return;
    }

    const updateCompletedValues = completedValuesByStep.slice(0, stepper.currStep);
    const stepValuesToRemove = completedValuesByStep.slice(stepper.currStep + 1);
    stepValuesToRemove.forEach((step) => {
      Object.keys(step).forEach((key) => {
        form.resetField(key as Path<Values>);
      });
    });

    // At least one value from step has changed. Need to invalidate remaining step data
    // invalidate all remaining step data
    // setCompletedStepValues((stepKeys) => [...stepKeys.slice(0, stepper.currStep), values]);
    setCompletedValuesByStep((stepKeys) => [...updateCompletedValues, updatedValues]);

    return;
  }

  function onSubmit(values: Values) {
    if (!stepper.isLastStep) {
      handleUpdateData();
      stepper.next();
    } else {
      onComplete(values, { setIsLoading });
    }
  }

  function getValuesAssertDefined<RequiredKey extends keyof Values>(
    keys: RequiredKey[],
  ): FieldsWithRequiredProps<Values, RequiredKey> {
    const values = form.getValues();
    const required = keys.reduce((acc, key) => {
      const value = values[key];
      if (!value) {
        throw new DeveloperError(`Key ${key.toString()} required for this part in the wizard`);
      }
      return { ...acc, [key]: value };
    }, {} as FieldsWithRequiredProps<Values, RequiredKey>);

    return { ...required, ...values };
  }

  return (
    <MultiStepFormContext.Provider
      value={{
        getValuesAssertDefined,
        stepper,
        form: form as UseFormReturn<FieldValues>,
        handleUpdateData,
      }}
    >
      <Stepper {...stepper}>
        <FormV2 form={form} onSubmit={onSubmit}>
          {isLoading && <FullScreenLoading />}
          {children}
        </FormV2>
      </Stepper>
    </MultiStepFormContext.Provider>
  );
}

function BasicFormFooter({
  secondaryButton,
  initialStepBack,
}: {
  secondaryButton?: ButtonProps;
  initialStepBack?: ButtonProps;
}) {
  const { t } = useTranslation();
  const {
    stepper: { isFirstStep, back, isLastStep },
    handleUpdateData,
  } = useMultiStepFormContext();

  function goBack() {
    handleUpdateData();
    back();
  }

  return (
    <ButtonBar borderTop className={'w-full h-16 px-2 py-1 items-center justify-between'}>
      <ButtonBar.Group>
        {!isFirstStep ? (
          <Button leftIcon={{ name: 'arrow-left' }} variant="tertiary" onClick={goBack}>
            Back
          </Button>
        ) : initialStepBack ? (
          <Button
            type="button"
            leftIcon={{ name: 'arrow-left' }}
            variant="tertiary"
            {...initialStepBack}
          />
        ) : null}
      </ButtonBar.Group>
      <ButtonBar.Group>
        {secondaryButton && <Button variant="secondary" {...secondaryButton} />}
        <Button type="submit" variant="primary">
          {isLastStep ? t('Finish') : t('Next')}
        </Button>
      </ButtonBar.Group>
    </ButtonBar>
  );
}

MultiStepForm.Header = Stepper.Header;
MultiStepForm.Step = Stepper.Step;
MultiStepForm.StepBar = Stepper.StepBar;
MultiStepForm.BasicFooter = BasicFormFooter;

export default MultiStepForm;
export { useMultiStepForm, useMultiStepFormContext };
