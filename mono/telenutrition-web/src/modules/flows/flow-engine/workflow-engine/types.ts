import type { UseFormReturn } from 'react-hook-form';
import type { Flow, FlowStep, FlowStepConfig } from '@mono/telenutrition/lib/types';
import type { CustomStepMap } from '../flow-step/types';

export type StepData = {
  step: FlowStep;
  stepConfig: FlowStepConfig<string>;
  key: string;
};

export type FlowValueBasic = string | number | string[] | boolean | number[] | null;

// Allows double-nested objects
export type FlowValue = FlowValueBasic | Record<string, FlowValueBasic>;

export type CompletedQuestion = {
  value: FlowValue;
  displayValue?: string;
};

export type FlowStepData = {
  stepKey: string;
  data: Record<string, CompletedQuestion>;
};

export type FlowState = FlowStepData[];

export type FlowStateObj = Record<string, CompletedQuestion>;

export type UseWorkflowEngineReturn = {
  currentStep: number;
  currentStepData: StepData;
  form: UseFormReturn<any>;
  isFirstStep: boolean;
  handleBack: () => void;
  handleNext: (data: Record<string, any>) => void;
  flowStateObj: FlowStateObj;
  restartAndReset: () => void;
  goBackToStep: (stepKey: string) => void;
  customSteps?: CustomStepMap;
  flow: Flow;
  animateDirection: 1 | -1;
  getFlowStateValue: (key: string | string[]) => FlowValueBasic | null;
  customGetFlowStateValue: (
    stateObj: FlowStateObj,
  ) => (key: string | string[]) => FlowValueBasic | null;
  getFlowStateDisplayValue: (key: string | string[]) => string | null;
  getFlowStateValuesFlat: () => Record<string, FlowValueBasic>;
};
