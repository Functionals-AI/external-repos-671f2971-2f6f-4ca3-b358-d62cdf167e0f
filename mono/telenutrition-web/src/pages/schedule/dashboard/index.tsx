import Dashboard from '../../../modules/dashboard';
import AllowRoles from '../../../route-guards/allow-roles';
import RequireAppConsent from '../../../route-guards/require-app-consent';
import RequirePassword from '../../../route-guards/require-password';
import RequireUserIdentified from '../../../route-guards/require-user-identified';

export default function DashboardPage() {
  return (
    <AllowRoles allowedRoles={['scheduler']}>
      <RequireAppConsent>
        <RequirePassword>
          <RequireUserIdentified>
            <Dashboard />
          </RequireUserIdentified>
        </RequirePassword>
      </RequireAppConsent>
    </AllowRoles>
  );
}
