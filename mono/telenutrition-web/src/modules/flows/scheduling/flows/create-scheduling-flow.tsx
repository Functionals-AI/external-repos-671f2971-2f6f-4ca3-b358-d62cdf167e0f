import React, { useEffect } from 'react';
import Loading from '../../../../components/loading';
import _ from 'lodash';
import usePostCreateFlow from '../../../../api/usePostCreateFlow';
import SchedulingFlow from '../scheduling-flow';
import { useRouter } from 'next/router';
import InitialCheckinRequired from '../../../schedule/initial-checkin-required'
import { ApiRequestError } from 'utils/errors';
// Give patientId and create new flow
export default function CreateSchedulingFlow({ patientId }: { patientId: number }) {
  const { post: postCreateFlow, data } = usePostCreateFlow();
  const router = useRouter();

  useEffect(() => {
    postCreateFlow({ payload: { patientId } }).catch(e => {
      if (e instanceof ApiRequestError && e.code == 'initial-checkin-required') {
        return
      }
      throw e
    });
  }, []);

  if (data.error) return <InitialCheckinRequired />

  if (data.isSubmitting || !data.data) {
    return <Loading />;
  }

  // Patient id required in pre-existing flow, error out if not there.
  if (!data.data.state.patient_id) {
    router.push('/schedule/dashboard');
    return <Loading />;
  }

  return (
    <SchedulingFlow
      {...{
        flowConfig: data.data.flow,
        flowId: data.data.flowId,
        initialFlowState: data.data.state,
        patientId,
      }}
    />
  );
}
