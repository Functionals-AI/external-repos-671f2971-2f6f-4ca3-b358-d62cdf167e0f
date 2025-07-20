import _ from 'lodash';
import type {
  CompletedQuestion,
  FlowState,
  FlowStateObj,
  FlowStepData,
  StepData,
  FlowValue,
  FlowValueBasic,
} from './types';
import type {
  FlowWidget,
  FlowWidgetBaseWithKey,
  FlowWidgetType,
  Flow,
  FlowStep,
  Condition,
  FlowStepNextBasicConfig,
  FlowStepConfig,
  FlowStepNextConfig,
  FlowStepNextRedirectAction,
} from '@mono/telenutrition/lib/types';
import { DeveloperError } from '../../../../utils/errors';

function valueIsCompletedQuestion(
  value: CompletedQuestion | FlowValue,
): value is CompletedQuestion {
  return value !== null && typeof value === 'object' && 'value' in value;
}

export function isStepNextConfigBasic(
  stepNextConfig: FlowStepNextConfig,
): stepNextConfig is FlowStepNextBasicConfig {
  return 'step' in stepNextConfig || 'action' in stepNextConfig;
}

export function getValueFromFlowQuestion(flowQuestion: CompletedQuestion | FlowValue): FlowValue {
  if (valueIsCompletedQuestion(flowQuestion)) {
    return flowQuestion.value;
  }

  return flowQuestion;
}

export const getStepFromName = <T extends { step: string }>(
  config: Record<string, T>,
  name: string,
): T => {
  const found = Object.values(config).find((step) => step.step === name);
  if (!found) throw new Error('Unable to find step in config from name');
  return found;
};

export const getStepFromRepo = <T>(steps: Record<string, T>, name: string): T => {
  const step = steps[name];
  if (!step) throw new DeveloperError('Flow step not defined in custom or basic');

  return step;
};

export const getStepDataFromName = (
  workflow: Flow['workflow'],
  steps: Record<string, FlowStep>,
  stepName: string,
): StepData => {
  const workflowConfig = workflow.config as { [k: string]: FlowStepConfig<string> };
  const stepConfig = getStepFromName(workflowConfig, stepName);
  const step = getStepFromRepo(steps, stepName);
  return { step, stepConfig, key: stepName };
};

// Flat list of all data from flow, disregarding steps.
// Important: Keys later in the flow will override any duplicate keys that exist earlier in flow
export const convertFlowStepDataToFlowStateObj = (flowState: FlowState): FlowStateObj => {
  return flowState.reduce((acc, stepData) => {
    return { ...acc, ...stepData.data };
  }, {});
};

// Take out conditionals and return basic
export function convertNextStepConfigToNextBasicStepConfig(
  stepNextConfig: FlowStepNextConfig,
  getFlowStateValue: (key: string | string[]) => FlowValueBasic | null,
): FlowStepNextBasicConfig | null {
  if (isStepNextConfigBasic(stepNextConfig)) {
    return stepNextConfig;
  }

  for (const { condition, then } of stepNextConfig) {
    if (condition) {
      const calculated = calculateConditional(condition, then, getFlowStateValue);
      if (calculated) return calculated;
    } else if (then) {
      return then;
    } else {
      throw new DeveloperError('Could not find next step');
    }
  }

  return null;
}

export function getToUrlFromRedirectAction(
  redirectAction: FlowStepNextRedirectAction,
  getFlowStateValue: (key: string | string[]) => FlowValueBasic | null,
): string {
  if (typeof redirectAction.toUrl === 'string') {
    return redirectAction.toUrl;
  }

  for (const { condition, then } of redirectAction.toUrl) {
    if (condition) {
      const calculated = calculateConditional(condition, then, getFlowStateValue);
      if (calculated) return calculated;
    } else if (then) {
      return then;
    } else {
      throw new DeveloperError('Could not get toURL from conditionals');
    }
  }

  throw new DeveloperError('Could not get redirect url after flow');
}

export function calculateConditional<T>(
  condition: Condition,
  then: T,
  getFlowStateValue: (key: string | string[]) => FlowValueBasic | null,
): T | undefined {
  const [conditionType] = condition;
  if (conditionType === 'stringIn') {
    const [_condition, stateKey, values] = condition;
    if (values.some((value) => value === getFlowStateValue(stateKey))) {
      return then;
    }
  } else if (conditionType === 'stringEquals') {
    const [_condition, stateKey, value] = condition;
    if (getFlowStateValue(stateKey) === value) {
      return then;
    }
  } else if (conditionType === 'numericEquals') {
    const [_condition, stateKey, value] = condition;
    const stateval = getFlowStateValue(stateKey);
    if ((!!stateval && typeof stateval === 'string') || typeof stateval === 'number') {
      const stateValAsNum = typeof stateval === 'string' ? parseInt(stateval, 10) : stateval;
      if (stateValAsNum === value) {
        return then;
      }
    }
  } else if (conditionType === 'and') {
    const [_condition, conditions] = condition;
    if (conditions.every(c => calculateConditional(c, true, getFlowStateValue))) {
      return then;
    }
  } else if (conditionType === 'or') {
    const [_condition, conditions] = condition;
    if (conditions.some(c => calculateConditional(c, true, getFlowStateValue))) {
      return then;
    }
  } else if (conditionType === 'booleanEquals') {
    const [_condition, stateKey, value] = condition;

    if (getFlowStateValue(stateKey) === value) return then;
  } else if (conditionType === 'numericIn') {
    const [_condition, stateKey, values] = condition;

    const foundStateValue = Number(getFlowStateValue(stateKey));
    if (!_.isNaN(foundStateValue)) {
      if (values.some((value) => value === foundStateValue)) {
        return then;
      }
    }
  } else if (conditionType === 'notNull') {
    const [_condition, stateKey] = condition;
    if (!!getFlowStateValue(stateKey)) return then;
  } else {
    throw new Error('Developer error: Cannot handle condition type.');
  }
}

export function findWidget(
  widgets: FlowWidget[],
  key: string,
): FlowWidgetBaseWithKey<FlowWidgetType> | undefined {
  for (const widget of widgets) {
    if (widget.type === 'columns') {
      const found = findWidget(widget.widgets, key);
      if (found) return found;
    }

    if (widget.type === 'workflow') {
      const found = findWidget(Object.values(widget.steps), key);
      if (found) return found;
    }

    if ('key' in widget) {
      if (widget.key === key) {
        return widget;
      }
    }
  }
}

export function getDisplayValueForWidget(widget: FlowWidget, value: FlowValue): string | undefined {
  if (widget.type === 'conditional-select') {
    const foundDisplayValue = widget.options.find(
      (option) => String(option.then.value) === String(value),
    );
    return foundDisplayValue?.then.label;
  }
  if (widget.type === 'select') {
    const foundDisplayValue = widget.options.find(
      (option) => String(option.value) === String(value),
    );
    return foundDisplayValue?.label;
  }
  if (widget.type === 'buttons-options') {
    const foundDisplayValue = widget.buttons.find(
      (button) => String(button.value) === String(value),
    );
    return foundDisplayValue?.label;
  }
  if (widget.type === 'two-tiered-list') {
    if (typeof value !== 'object') return undefined;

    // TODO: This widget returns an array of strings for value, so you must
    // map these values to their label in the two-tiered-list.
    // This will be needed to display icd10codes for referral.
  }
}

export function convertFormDataToCompletedQuestions(
  formData: Record<string, FlowValue>,
  flowStep: FlowStep,
): Record<string, CompletedQuestion> {
  return Object.entries(formData).reduce((acc, [key, value]) => {
    // only finding undefined here, not null values
    if (value === undefined) return acc;
    if (!('widgets' in flowStep)) return { ...acc, [key]: value };

    const foundWidget = findWidget(flowStep.widgets, key);

    if (foundWidget) {
      const displayValue = getDisplayValueForWidget(foundWidget as FlowWidget, value);
      return displayValue
        ? { ...acc, [key]: { value, displayValue } }
        : { ...acc, [key]: { value } };
    }

    return { ...acc, [key]: { value } };
  }, {});
}

export function getUpdatedFlowState(
  formData: Record<string, FlowValue>,
  prevFlowState: FlowState,
  currentStepData: StepData,
  currentStepInd: number,
  allStepData: StepData[],
): FlowState {
  const currentStepKey = currentStepData.key;
  const dataAsCompletedQuestions = convertFormDataToCompletedQuestions(
    formData,
    currentStepData.step,
  );

  const nextStep: FlowStepData = {
    stepKey: currentStepKey,
    data: dataAsCompletedQuestions,
  };

  const foundPreviouslyCompletedStepInd = prevFlowState.findIndex(
    (stepData) => stepData.stepKey === currentStepKey,
  );

  if (foundPreviouslyCompletedStepInd === -1) return [...prevFlowState, nextStep];

  // Check if same question has already been answered and do nothing if it is same answer.
  const foundPreviousCompletedStep = prevFlowState[foundPreviouslyCompletedStepInd];
  if (
    foundPreviousCompletedStep &&
    _.isEqual(foundPreviousCompletedStep.data, dataAsCompletedQuestions)
  ) {
    return prevFlowState;
  }

  // Some steps occur multiple times in the flow (i.e. review and book-appointment)
  // so we must check current index to see if we are continuing on in the flow
  // or user has gone back to a previous step and is re-doing an answer
  if (currentStepInd < allStepData.length - 2) {
    return [...prevFlowState.slice(0, foundPreviouslyCompletedStepInd), nextStep];
  }
  return [...prevFlowState, nextStep];
}

export const completedQuestionIsTruthy = <T extends CompletedQuestion | FlowValueBasic | null>(
  question: T,
): question is NonNullable<T> => {
  if (question == null) return false;
  if (typeof question === 'object' && 'value' in question && question.value == null) return false;

  return true;
};

export default function useFlowHelpers(flow: Flow) {
  const allSteps = flow.steps;

  return {
    getStepFromName: (name: string) =>
      getStepFromName(flow.workflow.config as { [k: string]: FlowStepConfig<string> }, name),
    getStepFromRepo: (name: string) => getStepFromRepo(allSteps, name),
    getStepDataFromName: (name: string) => getStepDataFromName(flow.workflow, allSteps, name),
    convertNextStepConfigToNextBasicStepConfig,
  };
}
