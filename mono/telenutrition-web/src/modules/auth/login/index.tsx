import Wizard from '../../../components/wizard';
import WizardSteps from '../../../components/wizard/wizard-steps';
import EmailOrPhoneForm from './email-or-phone-form';
import PasswordForm from './password-form';
import { useRouter } from 'next/router';
import { EmailOrPhone, getQueryFromEmailOrPhone } from '../../../hooks/useGetEmailPhoneFromQuery';
import { DeveloperError } from '../../../utils/errors';
import _ from 'lodash';

type LoginWizardFormState = {
  phone?: string;
  email?: string;
};

interface LoginProps {
  defaultState?: LoginWizardFormState
  redirectOnSuccess: string;
}

export default function LoginWizard({ redirectOnSuccess, defaultState }: LoginProps) {
  const router = useRouter();

  return (
    <Wizard
      flowName="login_flow"
      steps={{
        email_or_phone_form: {
          render: ({ goTo }) => (
            <EmailOrPhoneForm
              defaultValues={defaultState}
              onSuccess={(userStatus, values) => {
                if (userStatus === 'login') {
                  goTo('password', {
                    updateState: (s) => ({ ..._.omit(s, ['phone', 'email']), ...values }),
                  });
                  return;
                }
                if (userStatus === 'verify-password') {
                  const query = getQueryFromEmailOrPhone(values);
                  router.push(`/schedule/auth/forgot-password?${query}`);
                  return;
                }
              }}
            />
          ),
        },
        password: {
          render: ({ goTo, formState, fireFinalAnalyticEvent }) => {
            if (!('email' in formState) && !('phone' in formState)) {
              throw new DeveloperError('Phone or email is required');
            }

            return (
              <PasswordForm
                onChangeEmailOrPhone={() => {
                  goTo('email_or_phone_form');
                }}
                emailOrPhone={_.pick(formState, ['email', 'phone']) as EmailOrPhone}
                onSuccess={(res) => {
                  fireFinalAnalyticEvent({
                    ...formState,
                    ...(res.userId ? { userId: res.userId } : {}),
                  });
                  setTimeout(() => {
                    router.push(redirectOnSuccess);
                  }, 100);
                }}
              />
            );
          },
        },
      }}
      start="email_or_phone_form"
      initialState={defaultState || {}}
    >
      <WizardSteps />
    </Wizard>
  );
}
