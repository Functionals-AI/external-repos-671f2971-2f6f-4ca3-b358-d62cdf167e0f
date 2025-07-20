import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import useAppUser from '../hooks/useAppUser';
import Loading from '../components/loading';

interface RequirePasswordProps {
  redirectOnFail?: string;
  children: React.ReactNode;
}

export default function RequirePassword({
  redirectOnFail = '/schedule/auth/create-password',
  children,
}: RequirePasswordProps) {
  const appUserResult = useAppUser({ required: true });
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (appUserResult.loading) return;

    if (!appUserResult.data?.hasPassword) {
      router.push(redirectOnFail);
    } else {
      setIsSuccess(true);
    }
  }, [appUserResult.loading, appUserResult.data]);

  return isSuccess ? <>{children}</> : <Loading />;
}
