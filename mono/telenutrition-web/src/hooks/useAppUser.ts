import { useRouter } from 'next/router';
import { useAppStateContext } from '../state/context';
import { useEffect, useState } from 'react';
import useGetAccount, { UseGetAccountReturn } from '../api/account/useGetAccount';
import _ from 'lodash';

type AppUserResultRequiredData = {
  loading: false;
  data: UseGetAccountReturn;
};

type AppUserResultOptionalData = {
  loading: false;
  data: UseGetAccountReturn | null;
};

type AppUserResultLoading = {
  loading: true;
  data: null;
};

type RequiredProp = { required: boolean };
type RequiredTrueProp = { required: true };

type UseAppUserReturn<TRequiredProp extends RequiredProp> = TRequiredProp extends RequiredTrueProp
  ? AppUserResultRequiredData
  : AppUserResultOptionalData;

// Checks for null and handles appropriately. Redirect to register on fail
export default function useAppUser<TRequiredProp extends RequiredProp>(
  props: TRequiredProp,
): AppUserResultLoading | UseAppUserReturn<TRequiredProp> {
  const { appState, dispatch } = useAppStateContext();
  const { doGet } = useGetAccount({ doInitialGet: false });
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  function onFail() {
    router.push('/schedule/auth/login');
  }

  function onSuccess() {
    setIsLoading(false);
  }

  useEffect(() => {
    if (!appState.auth?.loggedIn) {
      if (props.required) onFail();
      else onSuccess();
      return;
    }

    // App user already fetched
    if (appState.auth.appUser && appState.auth.appUser.invalidated !== true) {
      onSuccess();
      return;
    }

    const { userId } = appState.auth.info;

    // If has userId, try to fetch account
    if (userId) {
      doGet({})
        .then((res) => {
          dispatch({ type: 'APP_USER_FETCHED', payload: res });
          onSuccess();
        })
        .catch(() => {
          if (props.required) onFail();
          // Maybe we should show a message here. Account call probably shouldn't have failed,
          // but we can grant the user access to the page since it's not required.
          else onSuccess();
        });

      return;
    }

    if (props.required) {
      onFail();
      return;
    }

    onSuccess();
  }, [appState.auth]);

  if (isLoading) {
    return {
      data: null,
      loading: true,
    };
  }

  if (!appState.auth?.loggedIn || !appState.auth.appUser) {
    // Trust onFail will be called properly, otherwise infinite spinner on loading
    if (props.required) return { loading: true, data: null };
    else return { loading: false, data: null } as UseAppUserReturn<TRequiredProp>;
  }

  return { loading: false, data: appState.auth.appUser } as AppUserResultRequiredData;
}
