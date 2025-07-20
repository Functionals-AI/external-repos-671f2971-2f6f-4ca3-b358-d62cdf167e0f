import useGetAuthReferrerFlow from '../../../../api/useGetAuthReferrerFlow';
import ApiGetError from '../../../../components/api-get-error';
import ProgressBar from '../../../../components/layouts/basic/progress-bar';
import FlowTransition from '../../../../components/layouts/basic/transition';
import Loading from '../../../../components/loading';
import FlowEngine from '../../flow-engine';
import FlowStep from '../../flow-engine/flow-step';

interface AuthReferrerFlowProps {
  flowType: 'coordinator' | 'referrer';
}

export default function AuthReferrerFlow({ flowType }: AuthReferrerFlowProps) {
  const { isLoading, error, data, refetch } = useGetAuthReferrerFlow({ flowType });

  if (isLoading || !data) {
    return <Loading />;
  }

  if (error != null) {
    return <ApiGetError error={error} refetch={refetch} />;
  }

  return (
    <FlowEngine
      analyticsPayload={{
        flow_name: 'auth_referrer_flow',
      }}
      flow={data.flow}
      initialFlowState={data.flowState}
    >
      {({ currentStepData, form, handleNext, animateDirection }, progress) => (
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
      )}
    </FlowEngine>
  );
}
