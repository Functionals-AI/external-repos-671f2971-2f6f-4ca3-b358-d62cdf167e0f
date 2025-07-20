import useGetAddPatientFlow from '../../../../api/useGetAddPatientFlow';
import ApiGetError from '../../../../components/api-get-error';
import ProgressBar from '../../../../components/layouts/basic/progress-bar';
import FlowTransition from '../../../../components/layouts/basic/transition';
import Loading from '../../../../components/loading';
import FlowEngine from '../../flow-engine';
import FlowStep from '../../flow-engine/flow-step';
import AddPatientStep from '../custom-steps/add-patient-step';

export default function AddPatientFlow() {
  const { data, isLoading, error, refetch } = useGetAddPatientFlow();

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="py-8">
        <ApiGetError error={error} refetch={refetch} />
      </div>
    );
  }

  if (data === null) {
    return (
      <div className='py-8'><ApiGetError error={null} refetch={refetch} /></div>
    )
  }

  return (
    <FlowEngine
      analyticsPayload={{
        flow_name: 'add_patient_flow',
      }}
      customSteps={{
        'post-patients': <AddPatientStep />
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
