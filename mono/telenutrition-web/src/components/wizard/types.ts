import { Dispatch, SetStateAction } from 'react';

export type WizardFormState = Record<string, any>;

export type WizardState<WizardStepName extends string, TWizardFormState extends WizardFormState> = {
  currStepKey: WizardStepName;
  currentStep: WizardStep<WizardStepName, TWizardFormState>;
  goTo: (stepKey: WizardStepName, options?: GoToOptions<TWizardFormState>) => void;
  goBack: () => void;
  loadingState: LoadingState;
  setLoadingState: (loadingState: LoadingState) => void;
  resetWizard: () => void;
  formState: WizardFormState;
  setFormState: Dispatch<SetStateAction<TWizardFormState>>;
  fireFinalAnalyticEvent: (state: WizardFormState) => void;
  assertValueDefined: <Key extends keyof TWizardFormState>(
    key: Key,
  ) => Required<TWizardFormState[Key]>;
  getFormStateWithRequiredFields<RequiredKey extends keyof TWizardFormState>(
    keys: RequiredKey[],
  ): FieldsWithRequiredProps<TWizardFormState, RequiredKey>;
};

export type LoadingState = { isLoading: false } | { isLoading: true; text?: string };
export type GoToOptions<TWizardFormState extends WizardFormState> = {
  updateState?: (oldState: TWizardFormState) => TWizardFormState;
  direction?: -1 | 1;
  ignorePostEvent?: boolean;
};
export type RenderStepParams<
  WizardStepName extends string = string,
  TWizardFormState extends WizardFormState = WizardFormState,
> = {
  goTo: (stepKey: WizardStepName, options?: GoToOptions<TWizardFormState>) => void;
  goBack: () => void;
  loadingState: LoadingState;
  setLoadingState: (loadingState: LoadingState) => void;
  resetWizard: () => void;
  formState: TWizardFormState;
  setFormState: Dispatch<SetStateAction<TWizardFormState>>;
  fireFinalAnalyticEvent: (state: WizardFormState) => void;

  /**
   * Given key of formState, throws error if this value is undefined or null.
   * Returns value
   */
  assertValueDefined: <Key extends keyof TWizardFormState>(
    key: Key,
  ) => NonNullable<TWizardFormState[Key]>;

  getFormStateWithRequiredFields<RequiredKey extends keyof TWizardFormState>(
    keys: RequiredKey[],
  ): FieldsWithRequiredProps<TWizardFormState, RequiredKey>;
};

export type WizardStep<WizardStepName extends string, TWizardFormState extends WizardFormState> = {
  title?: string | null;
  subtitle?: string | null;
  render: (params: RenderStepParams<WizardStepName, TWizardFormState>) => React.ReactNode;
};

export type WizardStepMap<
  WizardStepName extends string,
  TWizardFormState extends WizardFormState,
> = Record<WizardStepName, WizardStep<WizardStepName, TWizardFormState>>;

export type FieldsWithRequiredProps<
  Fields extends Record<string, any>,
  Required extends keyof Fields,
> = {
  [RK in Required]-?: Fields[RK];
} & Partial<Omit<Fields, Required>>;
