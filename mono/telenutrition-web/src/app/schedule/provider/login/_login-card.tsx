'use client';

import { useRouter } from 'next/navigation';
import LinkButton from '@/ui-components/button/link';
import LogoLarge from '@/icons/logo-large';
import { useFetchAuthProvider } from 'api/auth/useGetAuthProvider';
import Card from '@/ui-components/card';
import { Button } from '@/ui-components/button';
import { Trans } from 'react-i18next';
import GetErrorDislpay from '@/modules/errors/get-error-display';
import { useEffect } from 'react';

function urlWithState(urlString: string, state?: string) {
  const url = new URL(urlString);
  if (state) {
    url.searchParams.set('state', state);
  }
  return url.toString();
}

export default function LoginCard({ state, autoLogin }: { state?: string; autoLogin?: boolean }) {
  const { isLoading, data: oktaUrl, error, refetch } = useFetchAuthProvider();
  const router = useRouter();

  useEffect(() => {
    if (autoLogin && oktaUrl) {
      window.location.href = urlWithState(oktaUrl, state);
    }
  }, [oktaUrl, autoLogin]);

  if (error) return <GetErrorDislpay refetch={refetch} error={error} />;
  if (autoLogin || isLoading) return <div>Loading...</div>;

  return (
    <Card className="flex flex-col gap-y-2 items-center max-w-2xl p-4">
      <LogoLarge />
      <h3>
        <Trans>Sign in to Foodsmart with Okta</Trans>
      </h3>
      <div className="h-2" />
      <Button onClick={() => router.push(urlWithState(oktaUrl, state))}>
        <Trans>Sign In</Trans>
      </Button>
      <LinkButton onClick={() => {}}>
        <Trans>Get help</Trans>
      </LinkButton>
    </Card>
  );
}
