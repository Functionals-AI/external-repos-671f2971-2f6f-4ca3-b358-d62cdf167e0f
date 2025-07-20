import _ from 'lodash';
import { useRouter } from 'next/router';
import ScheduleUserAppointmentFlow from '../../../modules/flows/scheduling/flows/create-scheduling-flow';
import RequireUserIdentified from '../../../route-guards/require-user-identified';
import RequirePassword from '../../../route-guards/require-password';
import useGetQueryParam from '../../../hooks/useGetQueryParam';
import Loading from '../../../components/loading';
import ScheduleUserByFlowId from '../../../modules/flows/scheduling/flows/resume-scheduling-flow';
import { DeveloperError } from '../../../utils/errors';
import AllowRoles from '../../../route-guards/allow-roles';
import RequireAppConsent from '../../../route-guards/require-app-consent';

/**
 * You can enter a scheduling flow by giving a flow_id (existing flow) or a patient_id (start new flow)
 */
export default function SchedulingFlowPage() {
  const router = useRouter();
  const patientIdResult = useGetQueryParam('patient_id');
  const flowIdResult = useGetQueryParam('flow_id');

  if (patientIdResult.loading || flowIdResult.loading) {
    return <Loading />;
  }

  // One and only one
  const bothExist = patientIdResult.ok && flowIdResult.ok;
  const neitherExist = !patientIdResult.ok && !flowIdResult.ok;
  if (neitherExist || bothExist) {
    router.push('/schedule/dashboard');
    return <Loading />;
  }

  if (patientIdResult.ok) {
    const patientId = parseInt(patientIdResult.value);

    if (_.isNaN(patientId)) {
      router.push('/schedule/dashboard');
      return <Loading />;
    }

    return (
      <AllowRoles allowedRoles={['scheduler']}>
        <RequireAppConsent>
          <RequirePassword>
            <RequireUserIdentified>
              <ScheduleUserAppointmentFlow patientId={patientId} />
            </RequireUserIdentified>
          </RequirePassword>
        </RequireAppConsent>
      </AllowRoles>
    );
  }

  if (flowIdResult.ok) {
    const flowId = parseInt(flowIdResult.value);

    if (_.isNaN(flowId)) {
      router.push('/schedule/dashboard');
      return <Loading />;
    }

    return (
      <AllowRoles allowedRoles={['scheduler']}>
        <RequireAppConsent>
          <RequirePassword>
            <RequireUserIdentified>
              <ScheduleUserByFlowId flowId={flowId} />
            </RequireUserIdentified>
          </RequirePassword>
        </RequireAppConsent>
      </AllowRoles>
    );
  }

  throw new DeveloperError('FlowId or PatientId must exist to enter scheduling flow');
}
