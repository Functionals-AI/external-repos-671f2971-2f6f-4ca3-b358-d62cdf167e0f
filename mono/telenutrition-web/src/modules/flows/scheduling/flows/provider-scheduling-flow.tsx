import { useTranslation } from 'react-i18next';
import useGetProviderSchedulingFlow from '../../../../api/useGetProviderSchedulingFlow';
import ApiGetError from '../../../../components/api-get-error';
import ProgressBar from '../../../../components/layouts/basic/progress-bar';
import FlowTransition from '../../../../components/layouts/basic/transition';
import Loading from '../../../../components/loading';
import { useAppStateContext } from '../../../../state/context';
import FlowEngine from '../../flow-engine';
import FlowStep from '../../flow-engine/flow-step';
import { useEffect } from 'react';
import { useFetchCache } from 'hooks/useFetch/context';
import { FETCH_PROVIDER_APPOINTMENTS_QUERY_KEY } from 'api/provider/useGetProviderAppointments';

interface ProviderSchedulingFlowProps {
  appointmentIds: string[];
  patientId: string;
  providerId?: string;
}

export default function ProviderSchedulingFlow({
  appointmentIds,
  patientId,
  providerId,
}: ProviderSchedulingFlowProps) {
  const { getAppState } = useAppStateContext();
  const { isLoading, error, data, refetch } = useGetProviderSchedulingFlow({
    appointmentIds: appointmentIds.join(','),
    patientId,
    cid: getAppState().cid!,
    ...(providerId && { providerId: parseInt(providerId) }),
  });
  const { t } = useTranslation();
  const fetchCache = useFetchCache();

  // on unload, manually trigger invalidation of providerAppointments query
  useEffect(() => {
    return () => fetchCache.invalidateCacheKey(FETCH_PROVIDER_APPOINTMENTS_QUERY_KEY);
  }, []);

  if (error != null) {
    if (error.status === 'booked') {
      return (
        <div className="flex flex-col justify-center items-center py-8">
          <h3>
            {t(
              'ThisAppointmentHasAlreadyBeenScheduled',
              'This appointment has already been scheduled',
            )}
          </h3>
        </div>
      );
    } else {
      return <ApiGetError error={error} refetch={refetch} />;
    }
  }

  if (isLoading || !data) {
    return <Loading />;
  }

  return (
    <FlowEngine
      analyticsPayload={{
        flow_name: 'provider_scheduling_flow',
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
