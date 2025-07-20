import { useEffect, useState } from 'react';
import Loading from '../../components/loading';
import usePostAuthFederation from '../../api/auth/usePostAuthFederation';
import { useRouter } from 'next/router';
import { ApiRequestError } from '../../utils/errors';
import { UserRecord } from '../../api/account/useGetAccount';
import dayjs from 'dayjs';
import SetIdentityForm, { IdentityFormFields } from '../forms/set-identity';
import FlowTransition from '../../components/layouts/basic/transition';
import { useModalManager } from '../modal/manager';
import { useTranslation } from 'react-i18next';

interface AuthFederationProps {
  token: string;
  redirectOnSuccess: string;
  redirectOnError: string;
}

export default function AuthFederation({
  token,
  redirectOnSuccess,
  redirectOnError,
}: AuthFederationProps) {
  const { post: postAuthFederation } = usePostAuthFederation();
  const router = useRouter();
  const modalManager = useModalManager();
  const { t } = useTranslation();

  const [formState, setFormState] = useState<Partial<IdentityFormFields> | null>(null);
  const doAuthFederation = (identity?: any) => {
    postAuthFederation({ payload: { token, identity } })
      .then(async ({ data }) => {
        if (data.userId !== undefined) {
          router.push(redirectOnSuccess);
        } else {
          // TODO: for now, send to register for delegate
          let url = `/schedule/auth/register`;

          // pass enrollment token to register
          if ('enrollment' in router.query) {
            url += `?enrollment=${router.query.enrollment}`;
          }

          router.push(url);
        }
      })
      .catch((e) => {
        if (e instanceof ApiRequestError) {
          if (e.code === 'invalid-data' && e.extra !== undefined) {
            const data = e.extra as Partial<UserRecord>;
            setFormState(() => ({
              firstName: data.firstName,
              lastName: data.lastName,
              zipCode: data.zipCode,
              birthday: data.birthday ? dayjs(data.birthday).format('MM/DD/YYYY') : undefined,
            }));
            return;
          }
        }
        modalManager.handleApiError({
          error: e,
          subtitle: t(
            'ErrorPostAuthFederation',
            'There was an error handling the federation token',
          ),
        });
        router.push(redirectOnError);
      });
  };

  useEffect(() => {
    doAuthFederation();
  }, []);

  return (
    <FlowTransition>
      {formState ? (
        <SetIdentityForm defaultState={formState} onSubmit={doAuthFederation} />
      ) : (
        <Loading />
      )}
    </FlowTransition>
  );
}
