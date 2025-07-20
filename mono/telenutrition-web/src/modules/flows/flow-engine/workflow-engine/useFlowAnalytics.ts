import _ from 'lodash';
import { useState } from 'react';
import usePostEvent from '../../../../api/usePostEvent';
import { FlowValue, StepData } from './types';
import { useRouter } from 'next/router';

export type AnalyticsPayload = {
  flow_name: string;
  flow_id?: number;
};

export default function useFlowAnalytics(analyticsPayload: AnalyticsPayload) {
  const router = useRouter();
  const { post: postEvent } = usePostEvent({ pathname: router.pathname });

  // Counter that counts how many times a single user goes through the flow
  const [flowCounter, setFlowCounter] = useState<number>(1);

  // Map of step key to count to track how many times the user passes this particular step
  const [stepTracker, setStepTracker] = useState<Record<string, { count: number }>>({});

  function flowStepSubmitted({
    flowStepData,
    formStepData,
  }: {
    flowStepData: Pick<StepData, 'key'>;
    formStepData: Record<string, FlowValue>;
  }) {
    const flowStepKey = flowStepData.key;

    const getFullKey = (key: string, keyPrefix: string): string =>
      !!keyPrefix ? `${keyPrefix}_${_.snakeCase(key)}` : _.snakeCase(key);

    // convert nestted flow value to one-level with key formatted
    function flattenAndFormatData(
      formData: Record<string, FlowValue>,
      keyPrefix: string,
    ): Record<string, string> {
      return Object.entries(formData).reduce((acc, [key, value]) => {
        if (value == null) return acc;

        const fullKey = getFullKey(key, keyPrefix);

        if (typeof value === 'object' && !_.isArray(value)) {
          return { ...acc, ...flattenAndFormatData(value, fullKey) };
        }

        return { ...acc, [fullKey]: String(value) };
      }, {});
    }

    const formattedData = flattenAndFormatData(formStepData, '');

    postEvent({
      type: 'form_submission',
      name: `flow_page_submit_${flowStepKey}`,
      data: {
        ...analyticsPayload,
        ...formattedData,
      },
    });
  }

  function flowStepLoaded({
    flowStepData,
    currentStepInd,
  }: {
    flowStepData: Pick<StepData, 'key'>;
    currentStepInd: number;
  }) {
    const flowStepKey = flowStepData.key;
    const completedStep = stepTracker[flowStepKey];
    const newCount = completedStep ? completedStep.count + 1 : 1;
    if (!completedStep) {
      setStepTracker((stepTracker) => ({ ...stepTracker, [flowStepKey]: { count: newCount } }));
    } else {
      setStepTracker((stepTracker) => ({
        ...stepTracker,
        [flowStepKey]: { ...completedStep, count: newCount },
      }));
    }

    postEvent({
      type: 'view',
      name: `flow_page_view_${flowStepKey}`,
      data: {
        ...analyticsPayload,
        current_step_index: currentStepInd + 1,
        count_on_this_unique_step: newCount,
        flow_count: flowCounter,
      },
    });
  }

  function flowRestarted({ flowStepData }: { flowStepData: Pick<StepData, 'key'> }) {
    const newFlowCount = flowCounter + 1;
    setFlowCounter(newFlowCount);
    postEvent({
      type: 'flow_restarted',
      name: analyticsPayload.flow_name,
      data: {
        ...analyticsPayload,
        flow_count: newFlowCount,
        restarted_from_page: flowStepData.key,
      },
    });
  }

  function flowInitiated() {
    postEvent({
      type: 'flow_initialized',
      name: analyticsPayload.flow_name,
      data: {
        ..._.pick(analyticsPayload, ['flow_id']),
      },
    });
  }

  function flowCustomEvent({ eventName, eventType }: { eventName: string; eventType: string }) {
    postEvent({
      type: eventType as any,
      name: eventName,
      data: {
        ...analyticsPayload,
      },
    });
  }

  return {
    flowStepSubmitted,
    flowStepLoaded,
    flowRestarted,
    flowInitiated,
    flowCustomEvent,
  };
}
