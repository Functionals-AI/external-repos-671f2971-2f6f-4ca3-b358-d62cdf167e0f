import { ReactNode } from 'react';
import { useAppStateContext } from '../state/context';
import ErrorPage from './error-page';
import { useTranslation } from 'react-i18next';
import { SUPPORT_LINK } from './support-button';

interface UnauthorizedBoundaryProps {
  children: ReactNode;
}

export default function UnauthorizedBoundary({ children }: UnauthorizedBoundaryProps) {
  const { appState } = useAppStateContext();
  const { t } = useTranslation();

  return appState.showUnauthorizedPage ? (
    <ErrorPage
      code={403}
      title={t('YouAreNotAuthorizedToViewThisPage', 'You are not authorized to view this page')}
      buttons={[
        {
          text: t('ContactSupport', 'Contact Support'),
          href: SUPPORT_LINK,
          type: 'external',
          buttonProps: {
            variant: 'secondary',
          },
        },
        {
          text: t('GoToDashboard', 'Go To Dashboard'),
          href: '/schedule/dashboard',
          type: 'internal',
        },
      ]}
    />
  ) : (
    <>{children}</>
  );
}
