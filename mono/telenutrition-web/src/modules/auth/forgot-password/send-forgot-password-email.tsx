import { SubmitHandler, useForm } from 'react-hook-form';
import usePostResetPassword from '../../../api/auth/usePostResetPassword';
import Button from '../../../components/button';
import HeaderSubheader from '../../../components/header-subheader';
import RadioGroup from '../../../components/form/radio-group';
import { EmailOrPhone } from '../../../hooks/useGetEmailPhoneFromQuery';
import _ from 'lodash';
import Alert from '../../../components/alert';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import FForm from '../../../components/f-form';

type ForgotPasswordFormSubmitPayload = ForgotPasswordFormValues & { verificationId: number };

type ForgotPasswordProps = {
  emailOrPhone: EmailOrPhone;
  onSuccess: (values: ForgotPasswordFormSubmitPayload) => void;
};

type ForgotPasswordFormValues = { verificationMethod: 'email' | 'phone' };

export default function ForgotPassword({ emailOrPhone, onSuccess }: ForgotPasswordProps) {
  const { t } = useTranslation();
  const form = useForm<ForgotPasswordFormValues>({ mode: 'onChange' });
  const [error, setError] = useState<string | null>(null);
  const {
    post: postResetPassword,
    data: { isSubmitting },
  } = usePostResetPassword();

  const handleSubmit: SubmitHandler<ForgotPasswordFormValues> = (values) => {
    postResetPassword({ payload: emailOrPhone })
      .then(({ data }) => {
        onSuccess({ ...values, verificationId: data.verificationId });
      })
      .catch((err) => {
        console.log('ERR:', { ...err });
        setError(
          `${t('ThereWasAnErrorSendingTheEmail', `There was an error sending the email.`)} Trace: ${
            err.trace
          }`,
        );
      });
  };

  return (
    <FForm {...{ form, onSubmit: handleSubmit }}>
      <HeaderSubheader
        header={t('SignInToFoodsmart', 'Sign In to Foodsmart')}
        subheader={t('SetNewPassword', 'Set new password')}
      />
      {error && (
        <Alert
          title={t('ErrorSendingEmail', 'Error sending email')}
          subtitle={error}
          onClose={() => setError(null)}
        />
      )}
      <RadioGroup
        questionKey="verificationMethod"
        label={t(
          'SelectAMethodToSendVerificationCode',
          'Select a method to send a verification code',
        )}
        options={[
          ...('phone' in emailOrPhone
            ? [
                {
                  title: t('UsePhoneNumber', 'Use phone number {{phone}}', {
                    phone: emailOrPhone.phone,
                  }),
                  id: 'phone',
                },
              ]
            : []),
          ...('email' in emailOrPhone
            ? [
                {
                  title: t('UseEmail', 'Use email {{email}}', { email: emailOrPhone.email }),
                  id: 'email',
                },
              ]
            : []),
        ]}
        registerOptions={{ required: true }}
      />
      <div className="flex justify-end">
        <Button size="large" loading={isSubmitting} disabled={!form.formState.isValid} type="submit">
          {t('SendCode', 'Send Code')}
        </Button>
      </div>
    </FForm>
  );
}
