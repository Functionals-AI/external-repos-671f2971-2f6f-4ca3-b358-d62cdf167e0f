import React, { useEffect, useMemo, useState } from 'react';
import { DeveloperError } from '../../utils/errors';
import {
  WizardState,
  LoadingState,
  WizardFormState,
  WizardStepMap,
  GoToOptions,
  FieldsWithRequiredProps,
} from './types';
import { getWizardProvider } from './context';
import { v4 as uuidv4 } from 'uuid';
import usePostEvent from '../../api/usePostEvent';
import _ from 'lodash';

/**
 * Converts form data to camel case and removes sensitive fields
 */
export function transformAndSecureData(data: WizardFormState) {
  return Object.entries(data).reduce((acc, [key, value]) => {
    if (key === 'password' || key === 'challenge') return acc;
    return { ...acc, [_.snakeCase(key)]: value };
  }, {});
}

type WizardProps<
  WizardStepName extends string,
  TWizardFormState extends WizardFormState,
  WizardStepStartName extends WizardStepName,
> = {
  steps: WizardStepMap<WizardStepName, TWizardFormState>;
  start: WizardStepStartName;
  initialState: TWizardFormState;
  flowName: string;
  ignorePostEvent?: boolean;
  pathname?: string;
  children:
    | React.ReactNode
    | ((wizardState: WizardState<WizardStepName, TWizardFormState>) => React.ReactNode);
};

export default function Wizard<
  WizardStepName extends string,
  TWizardFormState extends WizardFormState,
  WizardStepStartName extends WizardStepName,
>({
  steps,
  start,
  initialState,
  flowName,
  children,
  pathname,
  ignorePostEvent = false,
}: WizardProps<WizardStepName, TWizardFormState, WizardStepStartName>) {
  const [flowId] = useState(() => uuidv4());
  const { post: postEvent } = usePostEvent({
    ignorePost: ignorePostEvent,
    pathname: pathname ?? 'unknown',
  });
  const [formState, setFormState] = useState<TWizardFormState>(initialState);
  const [currStepKey, setCurrStepKey] = useState<WizardStepName>(start);
  const [loadingState, setLoadingState] = useState<LoadingState>({ isLoading: false });
  const [WizardProvider] = useState(() => getWizardProvider<WizardStepName, TWizardFormState>());
  const currentStep = useMemo(() => steps[currStepKey], [currStepKey]);
  const [stepList, setStepList] = useState([currStepKey]);

  useEffect(() => {
    postEvent({
      type: 'view',
      name: `flow_page_view_${currStepKey}`,
      data: { flow_id: flowId, flow_name: flowName },
    });
  }, [currStepKey]);

  const goTo = (stepKey: WizardStepName, options?: GoToOptions<TWizardFormState>) => {
    const next = steps[stepKey];
    if (!next) throw new DeveloperError('Next logic does not work for Wizard');

    const newState =
      options !== undefined && options.updateState !== undefined
        ? options.updateState(formState)
        : formState;
    setCurrStepKey(stepKey);
    setFormState(newState);
    setStepList((list) => [...list, stepKey]);

    if (options?.ignorePostEvent !== true) {
      postEvent({
        type: 'form_submission',
        name: `flow_page_submit_${currStepKey}`,
        data: {
          flow_id: flowId,
          flow_name: flowName,
          ...transformAndSecureData(newState),
        },
      });
    }
  };

  const resetWizard = () => {
    goTo(start);
    setLoadingState({ isLoading: false });
    postEvent({
      type: 'flow_restarted',
      name: flowName,
    });
  };

  const fireFinalAnalyticEvent = (data: WizardFormState) => {
    postEvent({
      type: 'form_submission',
      name: `flow_page_submit_${currStepKey}`,
      data: {
        flow_id: flowId,
        flow_name: flowName,
        ...transformAndSecureData(data),
      },
    });
  };

  const goBack = () => {
    const last = stepList.at(-2);

    if (!last) throw new DeveloperError('Cannot go back on first step');

    setStepList((list) => list.slice(0, -1));
    setCurrStepKey(last);
  };

  function assertValueDefined<Key extends keyof TWizardFormState>(
    key: Key,
  ): NonNullable<TWizardFormState[Key]> {
    const value = formState[key];
    if (!value) {
      throw new DeveloperError(`Key ${key.toString()} required for this part in the wizard`);
    }
    return formState[key];
  }

  /**
   * Given list of keys, will return the formState with these fields enforced as required.
   * Throws error if any of the required keys haven't been set in the wizard thus far.
   */
  function getFormStateWithRequiredFields<RequiredKey extends keyof TWizardFormState>(
    keys: RequiredKey[],
  ): FieldsWithRequiredProps<TWizardFormState, RequiredKey> {
    const required = keys.reduce((acc, key) => {
      const value = formState[key];
      if (!value) {
        throw new DeveloperError(`Key ${key.toString()} required for this part in the wizard`);
      }
      return { ...acc, [key]: value };
    }, {} as FieldsWithRequiredProps<TWizardFormState, RequiredKey>);

    return { ...required, ...formState };
  }

  const wizardState: WizardState<WizardStepName, TWizardFormState> = {
    currentStep,
    currStepKey,
    goTo,
    goBack,
    loadingState,
    setLoadingState,
    resetWizard,
    formState,
    setFormState,
    fireFinalAnalyticEvent,
    assertValueDefined,
    getFormStateWithRequiredFields,
  };

  return (
    <WizardProvider value={wizardState}>
      {typeof children === 'function' ? children(wizardState) : children}
    </WizardProvider>
  );
}
