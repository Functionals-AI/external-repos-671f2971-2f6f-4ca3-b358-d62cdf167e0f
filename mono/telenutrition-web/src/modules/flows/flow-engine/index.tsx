import useWorkflowEngine from './workflow-engine';
import type { Flow as IFlow } from '@mono/telenutrition/lib/types';
import { WorkflowEngineContext } from './workflow-engine/context';
import CustomFormProvider from '../../../components/form/custom-form-provider';
import { CustomStepMap } from './flow-step/types';
import { useAutoPostFlowV2 } from './auto-post/useAutoPostFlowV2';
import { FlowValueBasic, UseWorkflowEngineReturn } from './workflow-engine/types';
import { AnalyticsPayload } from './workflow-engine/useFlowAnalytics';
import { ProgressValues, calculateProgressValues } from '../scheduling/helpers';

interface FlowProps {
  flow: IFlow;
  analyticsPayload: AnalyticsPayload;
  customSteps?: CustomStepMap;
  onFlowStateUpdate?: (params: {
    getFlowStateValue: UseWorkflowEngineReturn['getFlowStateValue'];
    getFlowStateValuesFlat: UseWorkflowEngineReturn['getFlowStateValuesFlat'];
  }) => Promise<any>;
  initialFlowState: Record<string, FlowValueBasic>;
  children: (
    workflowEngineState: UseWorkflowEngineReturn,
    progress: ProgressValues,
  ) => React.ReactNode;
  onStartNewFlow?: () => void;
}

export default function Flow({
  flow,
  analyticsPayload,
  customSteps,
  onFlowStateUpdate,
  initialFlowState,
  children,
  onStartNewFlow,
}: FlowProps) {
  const workflowEngineState = useWorkflowEngine({
    flow,
    customSteps,
    initialFlowState,
    onStartNewFlow,
    analyticsPayload,
  });
  const { form } = workflowEngineState;

  useAutoPostFlowV2({ onFlowStateUpdate, workflowEngine: workflowEngineState });

  const progress = calculateProgressValues(
    flow.workflow,
    workflowEngineState.currentStepData.stepConfig,
  );

  return (
    <WorkflowEngineContext.Provider value={workflowEngineState}>
      <CustomFormProvider form={form}>
        <>{children(workflowEngineState, progress)}</>
      </CustomFormProvider>
    </WorkflowEngineContext.Provider>
  );
}
