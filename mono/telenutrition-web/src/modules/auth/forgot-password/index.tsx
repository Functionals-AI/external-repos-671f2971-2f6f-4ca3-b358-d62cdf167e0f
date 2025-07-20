import { useState } from 'react';
import Wizard from '../../../components/wizard';
import WizardSteps from '../../../components/wizard/wizard-steps';
import { EmailOrPhone, EmailXOrPhone } from '../../../hooks/useGetEmailPhoneFromQuery';
import SendForgotPasswordEmail from './send-forgot-password-email';
import { ApiRequestError, DeveloperError } from '../../../utils/errors';
import EnterVerificationCode from '../../forms/verification-code';
import SetPasswordForm from '../../forms/set-password';
import { useRouter } from 'next/router';
import usePostRecoverPassword from '../../../api/auth/usePostRecoverPassword';
import _ from 'lodash';
import PasswordResetFailed from './password-reset-failed';
import { useTranslation } from 'react-i18next';

interface ForgotPasswordWizardProps {
  emailOrPhone: EmailOrPhone;
  code?: string;
  redirectOnSuccess: string;
  birthday?: string;
}

interface FormState {
  code: string;
  birthday: string;
  verificationMethod: 'email' | 'phone';
}

export default function ForgotPasswordWizard({
  emailOrPhone,
  code,
  redirectOnSuccess,
}: ForgotPasswordWizardProps) {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { post: postRecoverPassword } = usePostRecoverPassword();
  const { t } = useTranslation();

  return (
    <Wizard
      flowName="forgot_password_flow"
      steps={{
        send_forgot_password_email: {
          render: ({ goTo }) => {
            return (
              <SendForgotPasswordEmail
                emailOrPhone={emailOrPhone}
                onSuccess={({ verificationMethod }) => {
                  goTo('enter_code', { updateState: (s) => ({ ...s, verificationMethod }) });
                }}
              />
            );
          },
        },
        enter_code: {
          render: ({ goTo, formState, resetWizard }) => {
            const { verificationMethod } = formState;
            if (!verificationMethod)
              throw new DeveloperError('Cannot access EnterCode until verificationMethod is set.');

            const emailXOrPhone = (
              verificationMethod === 'phone'
                ? { phone: emailOrPhone.phone }
                : { email: emailOrPhone.email }
            ) as EmailXOrPhone;

            return (
              <EnterVerificationCode
                askBirthday
                onTryAgain={() => resetWizard()}
                emailXOrPhone={emailXOrPhone}
                onSubmit={async ({ code, birthday }) => {
                  goTo('set_new_password', { updateState: (s) => ({ ...s, code, birthday }) });
                }}
              />
            );
          },
        },
        set_new_password: {
          render: ({ goTo, formState, fireFinalAnalyticEvent }) => {
            const { code } = formState;
            const birthday = formState.birthday;
            const codeAsNum = Number(code);
            if (!code || _.isNaN(codeAsNum)) {
              throw new DeveloperError(
                'Cannot access EnterCode until verificationId and code are set.',
              );
            }

            if (!birthday) {
              throw new DeveloperError('Need birthday to recover password');
            }

            return (
              <SetPasswordForm
                onSubmit={async ({ password }) => {
                  return postRecoverPassword({
                    payload: {
                      ...emailOrPhone,
                      newPassword: password,
                      code: codeAsNum,
                      birthday,
                    },
                  })
                    .then(({ data }) => {
                      fireFinalAnalyticEvent(formState);
                      router.push(redirectOnSuccess);
                    })
                    .catch((e) => {
                      if (e instanceof ApiRequestError) {
                        if (e.code === 'expired') {
                          setError(
                            t(
                              'VerificationCodeEnteredHasExpired',
                              'The verification code you entered has expired. Please send another.',
                            ),
                          );
                        } else if (e.code === 'verification') {
                          setError(
                            t(
                              'VerificationCodeEnteredIsInvalid',
                              'The verification code you entered is invalid',
                            ),
                          );
                        }
                      }
                      goTo('password_reset_failed');
                    });
                }}
              />
            );
          },
        },
        password_reset_failed: {
          render: ({ resetWizard }) => {
            return (
              <PasswordResetFailed
                message={error ?? undefined}
                onTryAgain={() => {
                  setError(null);
                  resetWizard();
                }}
              />
            );
          },
        },
      }}
      start={code ? 'set_new_password' : 'send_forgot_password_email'}
      initialState={{
        ...(code &&
          ({
            code,
            verificationMethod: emailOrPhone.email !== undefined ? 'email' : 'phone',
          } as FormState)),
      }}
    >
      <WizardSteps />
    </Wizard>
  );
}
