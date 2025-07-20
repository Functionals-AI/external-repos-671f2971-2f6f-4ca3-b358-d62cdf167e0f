import ProgressBar from '../../../../components/layouts/basic/progress-bar';
import FlowTransition from '../../../../components/layouts/basic/transition';
import FlowEngine from '../../flow-engine';
import type { Flow } from '@mono/telenutrition/lib/types';
import FlowStep from '../../flow-engine/flow-step';
import { FlowValueBasic } from '../../flow-engine/workflow-engine/types';

interface ReferralFlowProps {
  flow: Flow;
  initialFlowState: Record<string, FlowValueBasic>;
}

export default function ReferralFlow({ flow, initialFlowState }: ReferralFlowProps) {
  return (
    <FlowEngine
      flow={flow}
      analyticsPayload={{
        flow_name: 'referral_v1',
      }}
      initialFlowState={initialFlowState}
    >
      {({ currentStepData, form, handleNext }, progress) => {
        return (
          <>
            <ProgressBar {...progress} />
            <FlowTransition divProps={{ className: 'py-12' }} transitionKey={currentStepData.key}>
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
