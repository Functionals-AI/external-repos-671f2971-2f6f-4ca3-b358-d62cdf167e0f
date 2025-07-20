import { useEffect, useState } from 'react';
import useGetFlow from '../../../../api/useGetFlow';
import Loading from '../../../../components/loading';
import SchedulingFlow from '../scheduling-flow';
import { useRouter } from 'next/router';
import ApiGetError from '../../../../components/api-get-error';

interface FlowByIdProps {
  flowId: number;
}

// Give flowId and resume existing scheduling flow
export default function ResumeScheudlingFlow({ flowId }: FlowByIdProps) {
  const { isLoading, error, data, refetch } = useGetFlow({ flowId });
  const [isValidFlow, setIsValidFlow] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !!data) {
      // Check if appointment has already been booked for this flow. If so, route to dashboard
      if (data.flowRecord.appointmentId != null) {
        router.push('/schedule/dashboard');
      } else {
        setIsValidFlow(true);
      }
    }
  }, [isLoading, data]);

  if (isLoading || !data || !isValidFlow) {
    return <Loading />;
  }

  if (error != null) return <ApiGetError error={error} refetch={refetch} />;

  return (
    <SchedulingFlow
      {...{
        flowConfig: data.flowConfig,
        flowId: data.flowRecord.flowId,
        initialFlowState: data.flowRecord.state,
        patientId: parseInt(data.flowRecord.state.patient_id as string),
      }}
    />
  );
}
