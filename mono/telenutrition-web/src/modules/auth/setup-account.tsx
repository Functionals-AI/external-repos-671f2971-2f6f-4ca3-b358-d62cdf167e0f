import { useAppStateContext } from '../../state/context';
import dayjs from 'dayjs';
import FlowTransition from '../../components/layouts/basic/transition';
import SetIdentityForm, { IdentityFormFields } from '../forms/set-identity';
import usePatchUpdateAccount from '../../api/account/usePatchUpdateAccount';
import { useRouter } from 'next/router';
import { useModalManager } from '../modal/manager';
import { ApiRequestError } from '../../utils/errors';
import { useTranslation } from 'react-i18next';
import useAppUser from '../../hooks/useAppUser';
import Loading from '../../components/loading';

interface SetupProps {
  redirectOnSuccess: string;
}

export default function SetupAccount({ redirectOnSuccess }: SetupProps) {
  const appUserResult = useAppUser({ required: true });
  const { post: patchAccount } = usePatchUpdateAccount();
  const { dispatch } = useAppStateContext();
  const router = useRouter();
  const modalManager = useModalManager();
  const { t } = useTranslation();

  if (appUserResult.loading) return <Loading />;

  const defaultState: Partial<IdentityFormFields> = {
    firstName: appUserResult.data.firstName,
    lastName: appUserResult.data.lastName,
    birthday: appUserResult.data.birthday
      ? dayjs(appUserResult.data.birthday).format('MM/DD/YYYY')
      : undefined,
    zipCode: appUserResult.data.zipCode,
  };

  return (
    <FlowTransition>
      <SetIdentityForm
        defaultState={defaultState}
        onSubmit={(values) =>
          patchAccount({ payload: values })
            .then(({ data }) => {
              dispatch({ type: 'APP_USER_FETCHED', payload: data });
              router.push(redirectOnSuccess);
            })
            .catch((error: ApiRequestError) => {
              modalManager.handleApiError({
                error,
                subtitle: t(
                  'ThereWasAnErrorUpdatingYourAccountInfo',
                  'There was an Error updating your account info',
                ),
              });
            })
        }
      />
    </FlowTransition>
  );
}
