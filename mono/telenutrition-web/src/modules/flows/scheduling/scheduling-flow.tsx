import { useRouter } from 'next/router';
import usePostUpdateSchedulingFlow from '../../../api/usePostUpdateSchedulingFlow';
import ProgressBar from '../../../components/layouts/basic/progress-bar';
import FlowTransition from '../../../components/layouts/basic/transition';
import FlowEngine from '../flow-engine';
import type { Flow } from '@mono/telenutrition/lib/types';
import FlowStep from '../flow-engine/flow-step';
import { FlowValueBasic } from '../flow-engine/workflow-engine/types';
import BookAppointmentStep from './custom-steps/book-appointment-step';
import CalendarFlowStep from './custom-steps/calendar-flow-step';
import { useMemo } from 'react';
import PaymentStep from './custom-steps/payment-step';
import CalendarByTimeStep from './custom-steps/calendar-by-time-step';

interface SchedulingFlowProps {
  flowConfig: Flow;
  flowId: number;
  initialFlowState: Record<string, FlowValueBasic>;
  patientId: number;
}

export default function SchedulingFlow({
  flowConfig,
  flowId,
  initialFlowState,
  patientId,
}: SchedulingFlowProps) {
  const { post: postUpdateSchedulingFlow } = usePostUpdateSchedulingFlow();
  const router = useRouter();

  const customSteps: Record<string, React.ReactNode> = useMemo(
    () => ({
      payment: <PaymentStep />,
      calendar: <CalendarFlowStep />,
      'book-appointment': <BookAppointmentStep flowId={flowId} />,
      by_time_calendar: <CalendarByTimeStep />,
    }),
    [flowId],
  );

  const onStartNewFlow = () => {
    router.push(`/schedule/redirect-to-schedule-flow?patient_id=${patientId}`);
  };

  return (
    <FlowEngine
      analyticsPayload={{
        flow_name: 'scheduling_flow',
        flow_id: flowId,
      }}
      flow={flowConfig}
      customSteps={customSteps}
      initialFlowState={initialFlowState}
      onStartNewFlow={onStartNewFlow}
      onFlowStateUpdate={async ({ getFlowStateValuesFlat }) => {
        return postUpdateSchedulingFlow({ payload: { flowId, state: getFlowStateValuesFlat() } });
      }}
    >
      {({ currentStepData, form, handleNext, animateDirection }, progress) => {
        return (
          <>
            <ProgressBar {...progress} />
            <FlowTransition
              divProps={{ className: 'py-12' }}
              direction={animateDirection}
              transitionKey={currentStepData.key}
            >
              <form onSubmit={form.handleSubmit(handleNext)} className="m-auto">
                <FlowStep />
              </form>
            </FlowTransition>
          </>
        );
      }}
    </FlowEngine>
  );
}
