import type { NextPage } from 'next';
import { useEffect } from 'react';
import Loading from '../../components/loading';
import { useRouter } from 'next/router';
import useGetQueryParam from '../../hooks/useGetQueryParam';
import { useAppStateContext } from '../../state/context';

// We assume anyone going to / page is trying to immediately schedule an appointment.
const LandingPage: NextPage = () => {
  const router = useRouter();
  const queryToken = useGetQueryParam('token');
  const { getAppState } = useAppStateContext();

  useEffect(() => {
    if (queryToken.loading) return;

    if (queryToken.ok) {
      router.push(
        `/schedule/auth/federation?token=${queryToken.value}&redirect_on_success=/schedule/flow/select-patient`,
      );
      return;
    }

    const auth = getAppState().auth;

    if (!auth?.loggedIn) {
      const query = {
        ...router.query,
        redirect_on_success: '/schedule/flow/select-patient'
      }
      router.push('/schedule/auth/register', { query });
      return;
    }

    if (auth.info.roles.some((role) => role === 'scheduler')) {
      router.push('/schedule/flow/select-patient');
      return;
    }

    if (auth.info.roles.some((role) => role === 'provider')) {
      router.push('/schedule/providers');
      return;
    }

    if (auth.info.roles.some((role) => role === 'referrer')) {
      router.push('/schedule/auth/referrer');
      return;
    }

    router.push('/schedule/auth/login');
  }, [queryToken.loading]);

  return <Loading />;
};

export default LandingPage;
