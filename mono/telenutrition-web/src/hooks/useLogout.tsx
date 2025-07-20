import { useRouter } from 'next/router';
import usePostLogout from '../api/auth/usePostLogout';
import { useAppStateContext } from '../state/context';
import { useModalManager } from '../modules/modal/manager';
import { useSupportButtonProps } from '../components/support-button';
import { useTranslation } from 'react-i18next';
import { shutdown } from '@intercom/messenger-js-sdk';

export default function useLogout() {
  const { dispatch, appState } = useAppStateContext();
  const {
    post: postLogout,
    data: { isSubmitting },
  } = usePostLogout();
  const router = useRouter();
  const modalManager = useModalManager();
  const supportButtonProps = useSupportButtonProps();
  const { t } = useTranslation();

  const getDefaultUrl = () => {
    const { auth } = appState;
    const isProviderLoggedin = auth?.loggedIn
      ? auth.info.roles.some((role) => role === 'provider')
      : false;
    if (isProviderLoggedin) return '/schedule/login/provider';
    else return '/schedule/auth/login';
  };

  function logout(redirectUrl: string | null = getDefaultUrl()) {
    return postLogout({ payload: {} })
      .then(() => {
        dispatch({ type: 'LOGOUT' });
        shutdown()
        if (redirectUrl) router.push(redirectUrl);
      })
      .catch(() => {
        modalManager.openModal({
          type: 'Custom',
          title: 'Error Logging Out',
          content: (
            <div>
              {t(
                'PleaseContactSupportOrCloseThisModal',
                'Please Contact Support or close this modal and try again',
              )}
            </div>
          ),
          buttons: [
            supportButtonProps,
            {
              children: t('Close', 'Close'),
              onClick: modalManager.closeModal,
              variant: 'secondary',
            },
          ],
        });
      });
  }

  return { logout, isSubmitting };
}
