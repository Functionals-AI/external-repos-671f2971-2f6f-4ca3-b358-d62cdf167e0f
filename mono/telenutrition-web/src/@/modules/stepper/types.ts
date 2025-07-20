import { ReactNode } from 'react';

export interface Step {
  name?: string;
  render: (props: IStepperContext) => ReactNode;
}

export interface IStepperContext {
  steps: Step[];
  currStep: number;
  next: () => void;
  back: () => void;
  goTo: (step: number) => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export interface StepperProps {
  steps: Step[];
  start?: number;
}
