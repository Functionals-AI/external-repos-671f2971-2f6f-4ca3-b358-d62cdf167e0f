import SelectPatient from '../../../modules/select-patient';
import useGetRedirectOnSuccessURL from '../../../hooks/useGetRedirectOnSuccessURL';
import RequireUserIdentified from '../../../route-guards/require-user-identified';
import RequirePassword from '../../../route-guards/require-password';
import AllowRoles from '../../../route-guards/allow-roles';
import RequireAppConsent from '../../../route-guards/require-app-consent';

export default function SelectPatientFlowPage() {
  const redirectOnSuccess = useGetRedirectOnSuccessURL({ fallback: '/schedule/flow/schedule' });

  return (
    <AllowRoles allowedRoles={['scheduler']}>
      <RequireAppConsent>
        <RequirePassword>
          <RequireUserIdentified>
            <SelectPatient redirectOnSuccess={redirectOnSuccess} />
          </RequireUserIdentified>
        </RequirePassword>
      </RequireAppConsent>
    </AllowRoles>
  );
}
