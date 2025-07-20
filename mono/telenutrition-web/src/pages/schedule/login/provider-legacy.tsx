import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import useGetAuthProvider from '../../../api/auth/useGetAuthProvider';
import usePostAuthProvider from '../../../api/auth/usePostAuthProvider';
import Button from '../../../components/button';
import Loading from '../../../components/loading';
import { useModalManager } from '../../../modules/modal/manager';
import { useTranslation } from 'react-i18next';
import ApiGetError from '../../../components/api-get-error';
import useProviderHeaderConfig from '../../../hooks/useProviderHeaderConfig';
import { ApiRequestError } from '../../../utils/errors';
import Card from '@/ui-components/card';

const ProviderLoginPage: NextPage = () => {
  useProviderHeaderConfig();
  const router = useRouter();
  const { t } = useTranslation();
  const [showLogin, setShowLogin] = useState(false);
  const { post: postAuthProvider } = usePostAuthProvider();
  const { handleApiError } = useModalManager();

  useEffect(() => {
    if (!router.isReady) return;

    const { code } = router.query;

    if (!code) {
      setShowLogin(true);
      return;
    }

    postAuthProvider({ payload: { code: code as string } })
      .then(() => {
        router.push('/schedule/providers');
      })
      .catch((e) => {
        console.log('error: ', e.message);
        const notFound = e instanceof ApiRequestError && e.code === 'not-found';
        const message = notFound
          ? t('ErrorTryingToMatchProvider', 'Error trying to match you with a provider')
          : t('ErrorTryingToFetchProviderAuthToken', 'Error trying to fetch provider auth token');
        handleApiError({
          error: e,
          subtitle: message,
        });
        setShowLogin(true);
      });
  }, [router.isReady]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <Card>{showLogin ? <LoginDisplay /> : <Loading />}</Card>
    </div>
  );
};

function LoginDisplay() {
  const { data: oktaUrl, isLoading, error, refetch } = useGetAuthProvider();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  const handleClick = () => {
    if (!oktaUrl) return;
    setIsRedirecting(true);
    router.push(oktaUrl);
  };

  return (
    <div className="flex flex-col items-center my-8">
      <h4 className="mb-4">
        {t(
          'PleaseClickToBeRedirectedToOkta',
          'Please click below to be redirected to login page via Okta',
        )}
      </h4>
      {isLoading ? (
        <Loading wrapperStyle={{ minHeight: 0 }} />
      ) : error != null ? (
        <ApiGetError error={error} refetch={refetch} />
      ) : (
        <Button loading={isRedirecting} onClick={handleClick}>
          {t('RedirectToLogin', 'Redirect to Login')}
        </Button>
      )}
    </div>
  );
}

export default ProviderLoginPage;
