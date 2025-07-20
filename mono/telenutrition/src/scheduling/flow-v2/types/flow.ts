import { FlowStepConfig, FlowStepNextConfig } from "./flow-step-config";
import { FlowWidget } from "./widgets";

export interface Flow<FlowStepName extends string = string> {
  steps: Record<FlowStepName, FlowStep>;
  workflow: {
    maxTotalSteps: number;
    start: FlowStepNextConfig<FlowStepName>;
    config: { [key in FlowStepName]?: FlowStepConfig<FlowStepName> };
  };
}

export type FlowStep = FlowBasicStep | FlowCustomStep | FlowApiStep;

export type FlowBasicStep = {
  type: "basic";
  widgets: FlowWidget[];
};

export type FlowCustomStep = {
  type: "custom";
  description: string;
};

export type FlowApiStep = {
  type: "api";
  path: string;
  method: "post";
};
