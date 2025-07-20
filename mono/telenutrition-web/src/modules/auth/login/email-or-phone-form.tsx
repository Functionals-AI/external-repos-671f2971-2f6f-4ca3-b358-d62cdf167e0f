import { SubmitHandler, useForm } from 'react-hook-form';
import Button from '../../../components/button';
import Link from 'next/link';
import useGetAuthInfo from '../../../api/auth/useGetAuthInfo';
import EmailPhoneSelector, {
  useEmailPhoneSelectorState,
} from '../../../components/email-phone-selector';
import { EmailXOrPhone } from '../../../hooks/useGetEmailPhoneFromQuery';
import { DeveloperError } from '../../../utils/errors';
import { useTranslation } from 'react-i18next';
import FForm from '../../../components/f-form';
import HeaderSubheader from '../../../components/header-subheader';
import { useModalManager } from '../../modal/manager';
import parse from 'html-react-parser';

export type EmailOrPhoneFormFields = EmailXOrPhone;

interface EmailOrPhoneFormProps {
  onSuccess: (userStatus: 'login' | 'verify-password', values: EmailOrPhoneFormFields) => void;
  defaultValues?: Partial<EmailOrPhoneFormFields>
}

export default function EmailOrPhoneForm({ onSuccess, defaultValues }: EmailOrPhoneFormProps) {
  const { t } = useTranslation();
  const form = useForm<EmailOrPhoneFormFields>({ mode: 'onChange', defaultValues });
  const emailOrPhoneSelectorState = useEmailPhoneSelectorState();
  const { doGet: getAuthInfo, isLoading } = useGetAuthInfo({ doInitialGet: false });
  const modalManager = useModalManager();

  const onSubmit: SubmitHandler<EmailOrPhoneFormFields> = (values) => {
    let emailXOrPhone: null | EmailXOrPhone = null;
    if (emailOrPhoneSelectorState.selected === 'phone' && 'phone' in values && !!values.phone) {
      emailXOrPhone = { phone: values.phone };
    }
    if (emailOrPhoneSelectorState.selected === 'email' && 'email' in values && !!values.email) {
      emailXOrPhone = { email: values.email };
    }

    if (emailXOrPhone == null) throw new DeveloperError('Email or Phone required in form');

    getAuthInfo({ getParams: emailXOrPhone })
      .then((res) => {
        if (res.recoveryRequired) {
          onSuccess('verify-password', emailXOrPhone!);
        } else {
          onSuccess('login', emailXOrPhone!);
        }
      })
      .catch((error) => {
        modalManager.handleApiError({
          error,
          subtitle: t('ErrorGetAuthInfo', 'There was an error checking this email or phone'),
        });
        console.log('Error on getAuthInfo', error);
      });
  };

  return (
    <FForm {...{ form, onSubmit }}>
      <HeaderSubheader
        header={t('SignInToFoodsmart', 'Sign In to Foodsmart')}
        subheader={t(
          'EnterTheEmailAddressOrPhoneNumberForAccount',
          'Enter the email address or phone number connected to your visit or account.',
        )}
      />
      <p className="text-base italic">
        {parse(
          t(
            'IfYouHaveAlreadyScheduledAnAppointmentYourselfOrOverThePhoneWithOneOfOurAgents',
            'If you have already scheduled an appointment yourself or over the phone with one of our agents, enter the email or phone number you used below to login. If you have not previously scheduled an appointment yourself or over the phone, click {{here}} to create an account.',
            {
              here: `
              <a
                href="/schedule/auth/register"
                class="font-medium text-f-dark-green hover:text-f-light-green"
              >
                ${t('LowerHere', 'here')}
              </a>`,
              interpolation: { escapeValue: false },
            },
          ),
        )}
      </p>
      <EmailPhoneSelector {...emailOrPhoneSelectorState} />
      <div className="flex items-center justify-between">
        <div className="text-sm">
          {t('DontHaveAnAccount', "Don't have an account?")}
          {` `}
          <Link
            href="/schedule/auth/register"
            className="font-medium text-f-dark-green hover:text-f-light-green"
          >
            {t('CreateOneNow', 'Create one now')}
          </Link>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-sm">
          {t('HaveAReferralCode', 'Have a referral code?')}
          {` `}
          <Link
            href="/schedule/refer/complete"
            className="font-medium text-f-dark-green hover:text-f-light-green"
          >
            {t(
              'ClickHereToEnterAndCreateYourAccount',
              'Click here to enter and create your account',
            )}
          </Link>
        </div>
      </div>
      <div className="flex justify-end">
        <Button size="large" type="submit" disabled={!form.formState.isValid} loading={isLoading}>
          {t('SignIn', 'Sign In')}
        </Button>
      </div>
    </FForm>
  );
}
