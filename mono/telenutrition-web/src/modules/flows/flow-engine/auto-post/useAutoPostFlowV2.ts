import _ from 'lodash';
import { useEffect, useState } from 'react';
import { UseWorkflowEngineReturn } from '../workflow-engine/types';

interface UseAutoPostFlowV2Props {
  workflowEngine: UseWorkflowEngineReturn;
  onFlowStateUpdate?: (params: {
    getFlowStateValue: UseWorkflowEngineReturn['getFlowStateValue'];
    getFlowStateValuesFlat: UseWorkflowEngineReturn['getFlowStateValuesFlat'];
  }) => Promise<any>;
}

/**
 *
 * Run "onFlowStateUpdate" every time the flowStateObj updates. Does not send updates
 * that have the same data as last submission
 *
 */
export function useAutoPostFlowV2({
  onFlowStateUpdate,
  workflowEngine: { getFlowStateValue, flowStateObj, getFlowStateValuesFlat },
}: UseAutoPostFlowV2Props) {
  const [lastFlowStateObj, setLastFlowStateObj] = useState<any | null>(null);

  useEffect(() => {
    const shouldNotUpdate = _.isEmpty(flowStateObj) || _.isEqual(lastFlowStateObj, flowStateObj);

    if (shouldNotUpdate) {
      return;
    }

    setLastFlowStateObj(flowStateObj);
    if (onFlowStateUpdate) {
      onFlowStateUpdate({ getFlowStateValue, getFlowStateValuesFlat }).catch((err) => {
        console.error('Error with onFlowStateUpdate function: ', err);
      });
    }
  }, [flowStateObj]);
}
