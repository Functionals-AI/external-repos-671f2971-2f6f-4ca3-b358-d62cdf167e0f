import DashboardAccount from '../../../modules/dashboard/account';
import AllowRoles from '../../../route-guards/allow-roles';
import RequireAppConsent from '../../../route-guards/require-app-consent';
import RequirePassword from '../../../route-guards/require-password';
import RequireUserIdentified from '../../../route-guards/require-user-identified';

export default function DashboardAccountPage() {
  return (
    <AllowRoles allowedRoles={['scheduler']}>
      <RequireAppConsent>
        <RequirePassword>
          <RequireUserIdentified>
            <DashboardAccount />
          </RequireUserIdentified>
        </RequirePassword>
      </RequireAppConsent>
    </AllowRoles>
  );
}
