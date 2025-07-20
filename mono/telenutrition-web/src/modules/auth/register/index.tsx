import _ from 'lodash';
import FlowTransition from '../../../components/layouts/basic/transition';
import Wizard from '../../../components/wizard';
import WizardSteps from '../../../components/wizard/wizard-steps';
import RegisterForm from './register';
import { ApiRequestError, DeveloperError } from '../../../utils/errors';
import { EmailOrPhone } from '../../../hooks/useGetEmailPhoneFromQuery';
import usePostAuthVerify, {
  UsePostAuthVerifyParams,
  UsePostAuthVerifyReturn,
} from '../../../api/auth/usePostAuthVerify';
import usePostRegister, { UsePostRegisterParams } from '../../../api/auth/usePostRegister';
import { useRouter } from 'next/router';
import CreateUserFailed from './create-user-failed';
import { useAppStateContext } from '../../../state/context';
import SetPasswordForm from '../../forms/set-password';
import { useTranslation } from 'react-i18next';

import { useEffect, useState } from 'react';
import Loading from '../../../components/loading';
import usePatchUpdateAccount from '../../../api/account/usePatchUpdateAccount';
import DelegateConsentWizard from './delegate-consent';
import { useModalManager } from '../../modal/manager';
import useGetEnrollmentInfo, { EnrollmentInfo } from '../../../api/auth/useGetEnrollmentInfo';
import RegistrationVerificationWizard from './verification';

type RegisterWizardFormState = {
  token?: string;
  appConsent: boolean;
  anthemConsent?: boolean;
  error?: ApiRequestError | Error;
};

interface RegisterWizardProps {
  redirectOnSuccess: string;
  enrollment?: string;
}

export default function RegisterWizard({ redirectOnSuccess, enrollment }: RegisterWizardProps) {
  const { dispatch, appState } = useAppStateContext();
  const { post: postAuthVerify } = usePostAuthVerify();
  const { post: postRegister } = usePostRegister();
  const router = useRouter();
  const { post: patchUpdateAccount } = usePatchUpdateAccount();
  const { t } = useTranslation();
  const { doGet: getEnrollmentInfo, isLoading } = useGetEnrollmentInfo({ doInitialGet: false });
  const [enrollmentInfo, setEnrollmentInfo] = useState<EnrollmentInfo>();
  const [verification, setVerification] = useState<UsePostAuthVerifyReturn>();
  const modalManager = useModalManager();
  const isDelegate =
    appState.auth?.loggedIn && appState.auth.info.roles.some((r) => r === 'delegate');

  useEffect(() => {
    if (enrollment !== undefined) {
      getEnrollmentInfo({ getParams: { token: enrollment } })
        .then((data) => {
          if (data.loginInfo) {
            router.push(`/schedule/auth/login?${new URLSearchParams(data.loginInfo).toString()}`);
          } else if (data.limitReached) {
            modalManager.openModal({
              type: 'Custom',
              title: t(
                'EnrollmentLimitReachedTitle',
                'The open slots for the pilot have been filled',
              ),
              content: t(
                'EnrollmentLimitReachedContent',
                'Please check in with your benefit provider to see if there are other options available for your needs.',
              ),
              buttons: {
                children: t('Ok', 'Ok'),
                onClick: () => {
                  modalManager.closeModal();
                },
              },
            });
          } else {
            setEnrollmentInfo(data);
          }
        })
        .catch((e) => {
          if (isDelegate) {
            let title, subtitle;
            if (e instanceof ApiRequestError) {
              if (e.code === 'validation') {
                title = t('Notice', 'Notice');
                subtitle = t(
                  'EnrollmentTokenInvalid',
                  'This member is no longer eligible. An account can still be created, but the account will not be tied to an eligibility.',
                );
              } else if (e.code === 'not-found') {
                // ignore
                return;
              }
            }
            modalManager.handleApiError({
              error: e,
              title,
              subtitle,
            });
          }
        });
    }
  }, [enrollment]);

  if (isLoading) return <Loading />;

  const startStep =
    enrollment !== undefined && verification !== undefined ? 'verification' : 'register';

  return (
    <Wizard
      flowName="register_flow"
      start={isDelegate ? 'delegate-consent' : startStep}
      steps={{
        'delegate-consent': {
          render: ({ goTo }) => (
            <DelegateConsentWizard
              onComplete={() => {
                goTo(startStep);
              }}
            />
          ),
        },
        verification: {
          render: ({ goTo, formState }) => {
            if (verification == undefined || verification.verified)
              throw new DeveloperError('Invalid verification state');
            return (
              <RegistrationVerificationWizard
                verification={verification}
                onVerified={(token) =>
                  postRegister({
                    payload: {
                      ...formState,
                      token,
                    },
                  })
                    .then(({ data }) => {
                      if (!data.hasPassword) {
                        goTo('set_password');
                      } else {
                        router.push(redirectOnSuccess);
                      }
                    })
                    .catch((e) => {
                      goTo('create_user_failed', {
                        ignorePostEvent: true,
                        updateState: (oldState) => {
                          return { ...oldState, error: e };
                        },
                      });
                    })
                }
              />
            );
          },
        },
        register: {
          render: ({ goTo, formState }) => {
            return (
              <RegisterForm
                enrollmentInfo={enrollmentInfo}
                defaultState={formState}
                onSubmit={(values) => {
                  const payload: UsePostAuthVerifyParams['payload'] = {
                    ...values,
                    ...(enrollmentInfo && { enrollment }),
                  };

                  return postAuthVerify({ payload })
                    .then(({ data }) => {
                      const { token } = data;
                      if (data.verified) {
                        const payload: UsePostRegisterParams['payload'] = {
                          ...values,
                          token,
                        };
                        return postRegister({ payload })
                          .then(({ data }) => {
                            if (!data.hasPassword) {
                              goTo('set_password');
                            } else {
                              router.push(redirectOnSuccess);
                            }
                          })
                          .catch((e) =>
                            goTo('create_user_failed', {
                              ignorePostEvent: true,
                              updateState: (prevState) => {
                                return { ...prevState, error: e };
                              },
                            }),
                          );
                      }
                      setVerification(data);
                      goTo('verification', {
                        updateState: (s) => ({
                          ...s,
                          ...values,
                          token,
                        }),
                      });
                    })
                    .catch((e) => {
                      if (e instanceof ApiRequestError) {
                        if (e.code === 'login-required') {
                          const data = e.extra as EmailOrPhone;
                          const hint = data.email ? data.email : data.phone;
                          modalManager.openModal({
                            type: 'Custom',
                            title: t('AccountAlreadyExists', 'Account already exists'),
                            content: t(
                              'IdentityMatchesExistingAccount',
                              'Your identity matches an existing account. Please log in to your account {{hint}}',
                              { hint },
                            ),
                            buttons: {
                              children: t('Login'),
                              onClick: () => {
                                router.push('/schedule/auth/login');
                                modalManager.closeModal();
                              },
                            },
                          });
                          return;
                        } else if (e.code === 'validation') {
                          modalManager.openModal({
                            type: 'Error',
                            title: t('Validation Error'),
                            subtitle:
                              e.extra?.message ??
                              t('ValidationError', 'Please verify your input and try again'),
                          });
                          return;
                        }
                      }
                      goTo('create_user_failed', {
                        ignorePostEvent: true,
                        updateState: (prevState) => ({ ...prevState, error: e }),
                      });
                    });
                }}
              />
            );
          },
        },
        set_password: {
          render: ({ formState, fireFinalAnalyticEvent }) => {
            return (
              <SetPasswordForm
                submitText={t('CreateAccount', 'Create Account')}
                onSubmit={(values) => {
                  const { password } = values;

                  return patchUpdateAccount({ payload: { password } })
                    .then(({ data }) => {
                      fireFinalAnalyticEvent({ ...formState, userId: data.userId });

                      // Patch account in global state context
                      dispatch({ type: 'APP_USER_FETCHED', payload: data });
                      router.push(redirectOnSuccess);
                    })
                    .catch((err) => {
                      console.log('ERR:', { ...err });
                    });
                }}
              />
            );
          },
        },
        create_user_failed: {
          render: ({ resetWizard, formState }) => {
            const { error } = formState;
            return <CreateUserFailed error={error} onTryAgain={() => resetWizard()} />;
          },
        },
      }}
      initialState={{} as RegisterWizardFormState}
    >
      {({ currStepKey }) => (
        <FlowTransition transitionKey={currStepKey}>
          <WizardSteps />
        </FlowTransition>
      )}
    </Wizard>
  );
}
