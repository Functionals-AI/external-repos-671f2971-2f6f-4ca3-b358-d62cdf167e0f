import _ from 'lodash';
import React, { useRef } from 'react';
import { DeveloperError } from '../../../../utils/errors';
import FlowBasicStep from './flow-basic-step';
import { useWorkflowEngineContext } from '../workflow-engine/context';
import FlowApiStep from './flow-api-step';

export default function FlowStep() {
  const workflowEngine = useWorkflowEngineContext();

  // We do this because the step will not change data without being re-rendered. There
  // was a bug with animations and showing a glimpse of the next page on transitions.
  const { currentStepData, customSteps } = useRef(workflowEngine).current;

  if (currentStepData.step.type === 'basic') return <FlowBasicStep stepData={currentStepData} />;

  if (currentStepData.step.type === 'custom') {
    const foundComponent = _.get(customSteps, currentStepData.key);
    if (!foundComponent) {
      throw new DeveloperError(`Flow custom step is not implemented: ${currentStepData.key}`);
    }

    return <>{foundComponent}</>;
  }

  if (currentStepData.step.type === 'api') {
    return <FlowApiStep stepData={currentStepData} />;
  }

  throw new DeveloperError(
    `Flow step type not implemented: ${JSON.stringify(currentStepData.step)}`,
  );
}
