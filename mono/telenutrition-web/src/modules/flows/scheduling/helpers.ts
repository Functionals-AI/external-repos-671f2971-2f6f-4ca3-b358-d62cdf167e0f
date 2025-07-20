import _ from 'lodash';
import type { Flow, FlowStepConfig } from '@mono/telenutrition/lib/types';
import type { CompletedQuestion, FlowValue } from '../flow-engine/workflow-engine/types';

export type ProgressValues = {
  total: number;
  progress: number;
};

export function calculateProgressValues(
  workflow: Pick<Flow['workflow'], 'maxTotalSteps'>,
  currentStepConfig: FlowStepConfig<string>,
): ProgressValues {
  const total = workflow.maxTotalSteps - 1;
  const progress =
    'isEnd' in currentStepConfig ? total : total - currentStepConfig.maxRemainingSteps;

  return { total, progress };
}

export function valueIsCompletedQuestion(
  value: CompletedQuestion | FlowValue,
): value is CompletedQuestion {
  return value !== null && typeof value === 'object' && 'value' in value;
}

export function getValueFromFlowQuestion(flowQuestion: CompletedQuestion | FlowValue): FlowValue {
  if (valueIsCompletedQuestion(flowQuestion)) {
    return flowQuestion.value;
  }

  return flowQuestion;
}
