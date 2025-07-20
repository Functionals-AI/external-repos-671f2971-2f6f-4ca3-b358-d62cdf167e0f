import { SubmitHandler, useForm } from 'react-hook-form';
import TextInput from '../../../components/form/text-input';
import Button from '../../../components/button';
import usePostLogin, { UsePostLoginReturn } from '../../../api/auth/usePostLogin';
import _ from 'lodash';
import Link from 'next/link';
import { EmailXOrPhone } from '../../../hooks/useGetEmailPhoneFromQuery';
import { ApiRequestError } from '../../../utils/errors';
import { useState } from 'react';
import Alert from '../../../components/alert';
import { useTranslation } from 'react-i18next';
import FForm from '../../../components/f-form';
import HeaderSubheader from '../../../components/header-subheader';

interface PasswordFormFields {
  password: string;
}

type PasswordFormProps = {
  emailOrPhone: EmailXOrPhone;
  onSuccess: (res: UsePostLoginReturn) => void;
  onChangeEmailOrPhone: () => void;
};

export default function PasswordForm({
  emailOrPhone,
  onSuccess,
  onChangeEmailOrPhone,
}: PasswordFormProps) {
  const { t } = useTranslation();
  const [errorMsg, setErrorMsg] = useState<null | { title: string; subtitle: string }>(null);
  const form = useForm<PasswordFormFields>({ mode: 'onChange' });
  const {
    post: postLogin,
    data: { isSubmitting },
  } = usePostLogin();

  const onSubmit: SubmitHandler<PasswordFormFields> = (values) => {
    postLogin({ payload: { ...emailOrPhone, ...values } })
      .then(({ data }) => {
        onSuccess(data);
      })
      .catch((err: ApiRequestError) => {
        if (err.code === 'not-found') {
          setErrorMsg({ title: t('UserNotFound', 'User not found'), subtitle: '' });
        } else {
          setErrorMsg({
            title: t('Error', 'Error'),
            subtitle: t('ThereWasAnErrorLoggingIn', 'There was an error logging in'),
          });
        }
      });
  };

  const query = _.map(emailOrPhone, (value, key) => `${key}=${value}`).join('&');

  return (
    <FForm {...{ form, onSubmit }}>
      <HeaderSubheader
        header={t('SignInToFoodsmart', 'Sign In to Foodsmart')}
        subheader={t('EnterPasswordForAccount', 'Enter password for account')}
      />
      {errorMsg && (
        <Alert
          title={errorMsg.title}
          subtitle={errorMsg.subtitle}
          onClose={() => setErrorMsg(null)}
        />
      )}
      <div>
        <p>
          {'email' in emailOrPhone
            ? t('EmailAndLabel', `Email: {{email}}`, { email: emailOrPhone.email })
            : 'phone' in emailOrPhone
            ? t('PhoneAndLabel', `Phone: {{phone}}`, { phone: emailOrPhone.phone })
            : ''}
        </p>
        <p
          className="font-light text-sm text-f-dark-green hover:text-f-light-green cursor-pointer"
          onClick={onChangeEmailOrPhone}
        >
          {t('Change', 'Change')}
        </p>
      </div>
      <TextInput
        name="Password"
        questionKey="password"
        widget="text:password"
        registerOptions={{ required: true }}
      />
      <div className="text-sm">
        {t('ForgotPassword', `Forgot Password?`)}
        {` `}
        <Link
          href={`/schedule/auth/forgot-password?${query}`}
          className="font-medium text-f-dark-green hover:text-f-light-green"
        >
          {t('ClickHereToReset', 'Click here to reset.')}
        </Link>
      </div>
      <div className="flex justify-end">
        <Button size="large" loading={isSubmitting} type="submit" disabled={!form.formState.isValid}>
          {t('SignIn', 'Sign In')}
        </Button>
      </div>
    </FForm>
  );
}
