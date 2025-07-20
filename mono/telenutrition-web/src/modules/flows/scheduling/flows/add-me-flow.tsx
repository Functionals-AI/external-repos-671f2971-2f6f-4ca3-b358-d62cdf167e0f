import useGetAddMeFlow from '../../../../api/useGetAddMeFlow';
import ApiGetError from '../../../../components/api-get-error';
import ProgressBar from '../../../../components/layouts/basic/progress-bar';
import FlowTransition from '../../../../components/layouts/basic/transition';
import Loading from '../../../../components/loading';
import FlowEngine from '../../flow-engine';
import FlowStep from '../../flow-engine/flow-step';

export default function AddMeFlow() {
  const { data, isLoading, error, refetch } = useGetAddMeFlow();

  if (isLoading || !data) {
    return <Loading />;
  }

  if (error) {
    return <ApiGetError error={error} refetch={refetch} />;
  }

  return (
    <FlowEngine
      analyticsPayload={{
        flow_name: 'add_me_flow',
      }}
      flow={data.flow}
      initialFlowState={data.flowState}
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
