import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import useFlowHelpers, {
  convertFlowStepDataToFlowStateObj,
  getUpdatedFlowState,
  getValueFromFlowQuestion,
  completedQuestionIsTruthy,
  getToUrlFromRedirectAction,
} from './helpers';
import _ from 'lodash';
import type {
  UseWorkflowEngineReturn,
  FlowState,
  StepData,
  FlowValue,
  FlowValueBasic,
  FlowStateObj,
  CompletedQuestion,
} from './types';
import type { CustomStepMap } from '../flow-step/types';
import type { Flow, FlowWidget } from '@mono/telenutrition/lib/types';
import useFlowAnalytics, { AnalyticsPayload } from './useFlowAnalytics';
import { DeveloperError } from '../../../../utils/errors';
import { useRouter } from 'next/router';
import { valueIsCompletedQuestion } from '../../scheduling/helpers';
import useLogout from '../../../../hooks/useLogout';

interface UseWorkflowEngineProps {
  flow: Flow;
  customSteps?: CustomStepMap;
  initialFlowState: Record<string, FlowValueBasic>;
  onStartNewFlow?: () => void;
  // this will be sent to analytics on every request
  analyticsPayload: AnalyticsPayload;
}

export default function useWorkflowEngine({
  flow,
  customSteps,
  initialFlowState,
  onStartNewFlow,
  analyticsPayload,
}: UseWorkflowEngineProps): UseWorkflowEngineReturn {
  const flowAnalytics = useFlowAnalytics(analyticsPayload);
  const router = useRouter();
  const helpers = useFlowHelpers(flow);
  const { logout } = useLogout();
  const form = useForm({
    mode: 'onChange',
  });

  function initializeStepData() {
    const { start } = flow.workflow;
    const startStep = helpers.convertNextStepConfigToNextBasicStepConfig(start, getFlowStateValue);

    if (!startStep) throw new DeveloperError('No Start step found for flow');

    if (!('step' in startStep)) throw new DeveloperError('Start config must be a step, not action');

    return [helpers.getStepDataFromName(startStep.step)];
  }

  const [flowState, setFlowState] = useState<FlowState>([]);
  const [currentStep, setCurrentStep] = useState<number>(0);
  // all computed steps of flow - This is dynamic since it's a workflow
  const [stepData, setStepData] = useState<StepData[]>(initializeStepData);
  const [animateDirection, setAnimateDirection] = useState<1 | -1>(1);

  const currentStepData = useMemo(() => stepData[currentStep], [currentStep, stepData]);
  const flowStateObj = useMemo(() => convertFlowStepDataToFlowStateObj(flowState), [flowState]);
  const isFirstStep = useMemo(() => currentStep === 0, [currentStep]);

  useEffect(() => {
    function populateWidgetValue(widget: FlowWidget) {
      if (widget.type === 'columns') {
        widget.widgets.forEach((widget) => populateWidgetValue(widget));
        return;
      }
      if (widget.type === 'workflow') {
        Object.values(widget.steps).forEach((widget) => populateWidgetValue(widget));
        return;
      }
      if ('key' in widget) {
        const existingAnswer = getFlowStateValue(widget.key);
        if (existingAnswer) {
          form.setValue(widget.key, existingAnswer);
        }
        return;
      }
    }

    if ('widgets' in currentStepData.step) {
      currentStepData.step.widgets.forEach((widget) => populateWidgetValue(widget));
    }
  }, [currentStepData.step]);

  useEffect(() => {
    flowAnalytics.flowInitiated();
  }, []);

  useEffect(() => {
    flowAnalytics.flowStepLoaded({
      flowStepData: currentStepData,
      currentStepInd: currentStep,
    });
  }, [currentStepData.step]);

  function handleBack() {
    if (animateDirection !== -1) setAnimateDirection(-1);

    if (currentStep !== 0) {
      setCurrentStep((s) => s - 1);
      setStepData((steps) => steps.slice(0, -1));
    }
  }

  async function handleNext(data: Record<string, FlowValue>) {
    if (animateDirection !== 1) setAnimateDirection(1);
    const updatedFlowState = getUpdatedFlowState(
      data,
      flowState,
      currentStepData,
      currentStep,
      stepData,
    );
    const updatedFlowStateObj = convertFlowStepDataToFlowStateObj(updatedFlowState);

    const customGetFlowStateValueFn = customGetFlowStateValue(updatedFlowStateObj);

    const nextStepConfig = helpers.convertNextStepConfigToNextBasicStepConfig(
      currentStepData.stepConfig.next,
      customGetFlowStateValueFn,
    );

    if (!nextStepConfig) {
      throw new DeveloperError('Workflow Engine assumes there will always be a next step');
    }

    if (nextStepConfig.customAnalyticsEvent) {
      flowAnalytics.flowCustomEvent({
        eventName: nextStepConfig.customAnalyticsEvent.name,
        eventType: nextStepConfig.customAnalyticsEvent.type,
      });
    }
    if ('step' in nextStepConfig) {
      flowAnalytics.flowStepSubmitted({
        flowStepData: currentStepData,
        formStepData: data,
      });

      setFlowState(updatedFlowState);
      setCurrentStep((s) => s + 1);
      setStepData((data) => [...data, helpers.getStepDataFromName(nextStepConfig.step)]);

      return;
    }

    if ('action' in nextStepConfig) {
      if (nextStepConfig.action === 'RESET_AND_RESTART') {
        restartAndReset();
      }
      if (nextStepConfig.action == 'REDIRECT') {
        const { query } = nextStepConfig;

        let queryStr = '';
        if (query && query.length) {
          queryStr = `?${query
            .map((val) => {
              const flowValue = customGetFlowStateValue(updatedFlowStateObj)(val.flowKey);
              return `${val.asKey}=${flowValue}`;
            })
            .join('&')}`;
        }

        const toUrl = getToUrlFromRedirectAction(nextStepConfig, customGetFlowStateValueFn);

        router.push(`${toUrl}${queryStr}`);
      }
      if (nextStepConfig.action === 'CREATE_NEW_FLOW') {
        if (!onStartNewFlow) {
          throw new DeveloperError('onStartNewFlow must be defined for this action on this flow');
        }
        onStartNewFlow();
      }
      if (nextStepConfig.action === 'LOGOUT_AND_REDIRECT') {
        await logout(nextStepConfig.toUrl);
      }
      return;
    }
  }

  function goBackToStep(goBackToStepKey: string) {
    if (animateDirection !== -1) setAnimateDirection(-1);

    let stepCounter = currentStep;
    let sData = stepData;
    let checkingStep = sData[stepCounter];

    while (checkingStep.key !== goBackToStepKey && stepCounter > 0 && sData.length) {
      stepCounter -= 1;
      sData = sData.slice(0, -1);
      checkingStep = sData[stepCounter];
    }

    if (!sData.length || stepCounter === 0) {
      setCurrentStep(0);
      setStepData(initializeStepData());
    } else {
      setCurrentStep(stepCounter);
      setStepData(sData);
    }
  }

  function restartAndReset() {
    if (animateDirection !== -1) setAnimateDirection(-1);

    flowAnalytics.flowRestarted({ flowStepData: currentStepData });

    setCurrentStep(0);
    setStepData(initializeStepData());
    setFlowState([]);
  }

  function getFromFlowStateByKey(
    key: string | string[],
    stateObj: FlowStateObj,
  ): CompletedQuestion | null | FlowValueBasic {
    const foundFlowValue = _.get(stateObj, key);
    if (foundFlowValue != undefined) {
      return foundFlowValue;
    }

    const foundInitialValue: FlowValueBasic | null = _.get(initialFlowState, key);
    if (foundInitialValue != undefined) {
      return foundInitialValue;
    }

    return null;
  }

  const customGetFlowStateValue =
    (stateObj: FlowStateObj) =>
    (key: string | string[]): FlowValueBasic | null => {
      const question = getFromFlowStateByKey(key, stateObj);
      if (!completedQuestionIsTruthy(question)) return null;
      return getValueFromFlowQuestion(question) as FlowValueBasic;
    };

  function getFlowStateValue(key: string | string[]): FlowValueBasic | null {
    const question = getFromFlowStateByKey(key, flowStateObj);
    if (!completedQuestionIsTruthy(question)) return null;
    return getValueFromFlowQuestion(question) as FlowValueBasic;
  }

  function getFlowStateDisplayValue(key: string | string[]): string | null {
    const question = getFromFlowStateByKey(key, flowStateObj);
    if (!completedQuestionIsTruthy(question)) return null;
    return valueIsCompletedQuestion(question)
      ? question.displayValue ?? String(question.value)
      : String(question);
  }

  // Get object of all flow values + initial values, no nesting, everything as flat key-value.
  function getFlowStateValuesFlat(): Record<string, FlowValueBasic> {
    const flowObjValues = Object.entries(flowStateObj).reduce(
      (acc: Record<string, FlowValueBasic>, [key, value]) => {
        const v = getValueFromFlowQuestion(value);
        if (_.isObject(v) && !_.isArray(v)) {
          return { ...acc, ...v };
        }
        return { ...acc, [key]: v };
      },
      {} as Record<string, FlowValueBasic>,
    );

    // Important: If a "null" or "undefined" value exists in flowObjValues, it will overwrite initialFlowStateValue
    // This is expected and desired (particularly for workflow widget)
    const allValues = { ...initialFlowState, ...flowObjValues };
    return Object.entries(allValues).reduce(
      (acc, [key, value]) =>
        value != null && value !== ''
          ? {
              ...acc,
              [key]: value,
            }
          : acc,
      {},
    );
  }

  return {
    currentStep,
    currentStepData,
    form,
    isFirstStep,
    handleBack,
    handleNext,
    flowStateObj,
    restartAndReset,
    goBackToStep,
    customSteps,
    flow,
    animateDirection,
    getFlowStateValue,
    customGetFlowStateValue,
    getFlowStateDisplayValue,
    getFlowStateValuesFlat,
  };
}
