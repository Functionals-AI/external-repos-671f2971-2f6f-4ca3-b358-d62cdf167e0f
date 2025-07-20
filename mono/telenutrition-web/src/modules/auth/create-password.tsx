import FlowTransition from '../../components/layouts/basic/transition';
import { useRouter } from 'next/router';
import SetPasswordForm from '../forms/set-password';
import usePatchAccount from '../../api/account/usePatchUpdateAccount';
import { useAppStateContext } from '../../state/context';
import { useModalManager } from '../modal/manager';
import { useTranslation } from 'react-i18next';

interface CreatePasswordProps {
  redirectOnSuccess: string;
}

export default function CreatePassword({ redirectOnSuccess }: CreatePasswordProps) {
  const router = useRouter();
  const { post: patchAccount } = usePatchAccount();
  const { dispatch } = useAppStateContext();
  const modalManager = useModalManager();
  const { t } = useTranslation();

  return (
    <FlowTransition>
      <SetPasswordForm
        onSubmit={async (values) => {
          const { password } = values;

          return patchAccount({ payload: { password } })
            .then(({ data }) => {
              // Patch account in global state context
              dispatch({ type: 'APP_USER_FETCHED', payload: data });
              router.push(redirectOnSuccess);
            })
            .catch((error) => {
              modalManager.handleApiError({
                error,
                subtitle: t('ErrorSettingYourPassword', 'Error setting your password'),
              });
              console.log('ERR:', { ...error });
            });
        }}
      />
    </FlowTransition>
  );
}
