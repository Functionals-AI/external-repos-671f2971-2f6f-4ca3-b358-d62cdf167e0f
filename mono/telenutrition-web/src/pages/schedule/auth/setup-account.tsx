import RequirePassword from '../../../route-guards/require-password';
import SetupAccount from '../../../modules/auth/setup-account';
import useGetRedirectOnSuccessURL from '../../../hooks/useGetRedirectOnSuccessURL';
import AllowRoles from '../../../route-guards/allow-roles';

export default function SetupAccountPage() {
  const redirectOnSuccess = useGetRedirectOnSuccessURL({ fallback: '/schedule' });

  return (
    <AllowRoles allowedRoles={['scheduler']}>
      <RequirePassword>
        <SetupAccount redirectOnSuccess={redirectOnSuccess} />
      </RequirePassword>
    </AllowRoles>
  );
}
