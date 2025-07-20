import { useTranslation } from 'react-i18next';
import ErrorPage from '../../components/error-page';
import { useAppStateContext } from '../../state/context';

export default function Page404() {
  const { t } = useTranslation();
  const {
    appState: { auth },
  } = useAppStateContext();
  const isLoggedIn = !!auth?.loggedIn;

  return (
    <ErrorPage
      code={404}
      title={t('SorryWeCouldntFindThisPage', "Sorry, we couldn't find this page.")}
      buttons={
        isLoggedIn
          ? [
              {
                href: '/schedule/dashboard',
                text: t('BackToHomepage', 'Back to homepage'),
                type: 'internal',
              },
            ]
          : [
              {
                href: '/schedule/auth/login',
                text: t('Log In'),
                type: 'internal',
              },
            ]
      }
    />
  );
}
