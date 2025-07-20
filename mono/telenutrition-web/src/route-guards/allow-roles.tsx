import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Loading from '../components/loading';
import { useAppStateContext } from '../state/context';
import useLogout from '../hooks/useLogout';
import type { AuthRole } from '@mono/telenutrition/lib/types';

type AllowRolesProps = {
  redirectOnNoToken?: string;
  allowedRoles: AuthRole[];
  children: React.ReactNode;
};

/**
 * Requires user logged in and has at least one of the allowed roles in their identity roles
 */
export default function AllowRoles({
  children,
  allowedRoles,
  redirectOnNoToken = '/schedule/auth/login',
}: AllowRolesProps) {
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { getAppState } = useAppStateContext();
  const redirectByRole = useRedirectByRoles();

  useEffect(() => {
    const auth = getAppState().auth;

    if (!auth?.loggedIn) {
      router.push(redirectOnNoToken);
      return;
    }
    const { roles } = auth.info;

    const isAllowed = roles.some((role) =>
      allowedRoles.some((allowedRole) => allowedRole === role),
    );

    if (!isAllowed) {
      redirectByRole(roles);
      return;
    }

    setSuccess(true);
  }, []);

  return success ? <>{children}</> : <Loading />;
}

function useRedirectByRoles() {
  const { logout } = useLogout();
  const router = useRouter();

  function redirectByRoles(roles: AuthRole[]) {
    if (roles.some((role) => role === 'scheduler')) {
      router.push('/schedule/dashboard');
      return;
    }
    if (roles.some((role) => role === 'provider')) {
      router.push('/schedule/providers');
      return;
    }
    if (roles.some((role) => role === 'referrer')) {
      router.push('/schedule/auth/referrer');
      return;
    }

    // Not sure what to do, so just log them out until we add more pages.
    logout();
    return;
  }

  return redirectByRoles;
}
