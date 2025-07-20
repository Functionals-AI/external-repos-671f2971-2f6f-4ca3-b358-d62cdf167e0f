import { useTranslation } from 'react-i18next';
import useHeaderLayoutConfig from './useHeaderLayoutConfig';
import Button from '../components/button';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAppStateContext } from '../state/context';

export default function useProviderHeaderConfig() {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    appState: { auth },
  } = useAppStateContext();
  const isProviderLoggedin = auth?.loggedIn
    ? auth.info.roles.some((role) => role === 'provider')
    : false;
  const { setConfig } = useHeaderLayoutConfig();

  useEffect(() => {
    setConfig({
      mainButtons: isProviderLoggedin ? (
        <Button
          className="text-white hover:text-fs-green-600 focus:text-fs-green-600"
          variant="tertiary"
          onClick={() => router.push('/schedule/providers')}
        >
          {t('Dashboard', 'Dashboard')}
        </Button>
      ) : null,
    });
  }, [auth]);
}
