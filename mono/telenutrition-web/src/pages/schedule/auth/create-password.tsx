import CreatePassword from '../../../modules/auth/create-password';
import useGetRedirectOnSuccessURL from '../../../hooks/useGetRedirectOnSuccessURL';
import RequireNoPasswordSet from '../../../route-guards/require-no-password-set';
import AllowRoles from '../../../route-guards/allow-roles';

export default function CreatePasswordPage() {
  const redirectOnSuccess = useGetRedirectOnSuccessURL({ fallback: '/schedule/dashboard' });

  return (
    <AllowRoles allowedRoles={['scheduler']}>
      <RequireNoPasswordSet>
        <CreatePassword redirectOnSuccess={redirectOnSuccess} />
      </RequireNoPasswordSet>
    </AllowRoles>
  );
}
