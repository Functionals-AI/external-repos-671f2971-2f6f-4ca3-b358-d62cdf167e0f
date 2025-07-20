import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import useAppUser from '../hooks/useAppUser';
import Loading from '../components/loading';

interface RequireUserIdentifiedProps {
  children: React.ReactNode;
  redirectOnFail?: string;
}

export default function RequireUserIdentified({
  children,
  redirectOnFail = '/schedule/auth/setup-account',
}: RequireUserIdentifiedProps) {
  const appUserResult = useAppUser({ required: true });
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (appUserResult.loading) return;

    if (!appUserResult.data?.isIdentified) {
      router.push(redirectOnFail);
      return;
    }
    setIsSuccess(true);
  }, [appUserResult.loading, appUserResult.data]);

  return isSuccess ? <>{children}</> : <Loading />;
}
