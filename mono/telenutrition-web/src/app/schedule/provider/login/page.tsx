'use client';

import { useContext, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import usePostAuthProvider from 'api/auth/usePostAuthProvider';
import LoginCard from './_login-card';
import useToaster from 'hooks/useToaster';
import { useTranslation } from 'react-i18next';
import { ApiRequestError } from 'utils/errors';
import { useRouter } from 'next/navigation';
import { ProviderContext } from '../provider-context';

export default function Page() {
  const params = useSearchParams();
  const { post: postAuthProvider } = usePostAuthProvider();
  const toast = useToaster();
  const { t } = useTranslation();
  const router = useRouter();
  const providerContext = useContext(ProviderContext);
  const [ready, setReady] = useState(false);

  // If given code in query, attempt login
  useEffect(() => {
    if (providerContext?.providerData) {
      router.push('/schedule/provider/dashboard');
      return;
    }

    if (!params) return;

    const code = params.get('code');
    const state = params.get('state');

    if (!code) {
      setReady(true);
      return;
    }

    postAuthProvider({ payload: { code: code as string } })
      .then(() => {
        if (state) {
          let stateParams = new URLSearchParams(state)
          const q = stateParams.get('q')
          if (q) {
            const channel = new BroadcastChannel("provider-auth");
            channel.postMessage('autologin');
            window.close();
            return;
          }
        }
        router.push('/schedule/provider/dashboard');
      })
      .catch((e) => {
        const notFound = e instanceof ApiRequestError && e.code === 'not-found';
        const message = notFound
          ? t('ErrorTryingToMatchProvider', 'Error trying to match you with a provider')
          : t('ErrorTryingToFetchProviderAuthToken', 'Error trying to fetch provider auth token');

        toast.apiError({
          title: t('Failed to login'),
          error: e,
          message: message,
        });

        setReady(true);
      });
  }, [params]);

  return (
    <div>
      <div className="flex justify-center items-center h-screen bg-neutral-115">
        {ready ? (
          <LoginCard state={params?.toString()} autoLogin={params?.get('q') === '1'} />
        ) : null}
      </div>
    </div>
  );
}
