import React, { useContext } from 'react';
import { WizardFormState, WizardState } from './types';

export const WizardContext = React.createContext<WizardState<string, WizardFormState> | null>(null);

export const useWizardContext = <
  WizardStepName extends string,
  TWizardFormState extends WizardFormState,
>(): WizardState<WizardStepName, TWizardFormState> => {
  const context = useContext(WizardContext);
  if (!context) throw new Error('You must have a Wizard Context Provider');

  return context as unknown as WizardState<WizardStepName, TWizardFormState>;
};

export function getWizardProvider<
  WizardStepName extends string,
  TWizardFormState extends WizardFormState,
>(): React.Provider<WizardState<WizardStepName, TWizardFormState>> {
  return WizardContext.Provider as unknown as React.Provider<
    WizardState<WizardStepName, TWizardFormState>
  >;
}
