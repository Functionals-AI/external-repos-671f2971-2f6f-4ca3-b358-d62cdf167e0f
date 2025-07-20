import { useForm, SubmitHandler } from 'react-hook-form';
import Button from '../../components/button';
import TextInput from '../../components/form/text-input';
import HeaderSubheader from '../../components/header-subheader';
import { EmailXOrPhone } from '../../hooks/useGetEmailPhoneFromQuery';
import { DeveloperError } from '../../utils/errors';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import FForm from '../../components/f-form';
import DateInput from 'components/form/text-input/date-input';

interface EnterVerificationCodeProps {
  emailXOrPhone: EmailXOrPhone;
  onSubmit: (values: EnterVerificationCodeFields) => Promise<any>;
  onTryAgain: () => void;
  askBirthday: boolean;
}

interface EnterVerificationCodeFields {
  code: string;
  birthday?: string;
}

export default function EnterVerificationCode({
  emailXOrPhone,
  onSubmit,
  onTryAgain,
  askBirthday,
}: EnterVerificationCodeProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const form = useForm<EnterVerificationCodeFields>({ mode: 'onChange' });

  const header = (() => {
    if ('email' in emailXOrPhone) {
      return t('VerifyEmail', `Verify email`);
    }
    if ('phone' in emailXOrPhone) {
      return t('VerifyPhone', `Verify phone`);
    }

    throw new DeveloperError('EnterPasswordVerification expects phone or email');
  })();

  const subheader = (() => {
    if ('email' in emailXOrPhone) {
      return t('VerificationCodeSentToEmail', `A verification code has been sent to your email`);
    }
    if ('phone' in emailXOrPhone) {
      return t('VerificationCodeSentToPhone', `A verification code has been sent to your phone`);
    }

    throw new DeveloperError('EnterPasswordVerification expects phone or email');
  })();

  const text = (() => {
    if ('email' in emailXOrPhone) {
      return t('EnterVerificationSentToEmail', `Enter verification code sent to {{email}}`, {
        email: emailXOrPhone.email,
      });
    }
    if ('phone' in emailXOrPhone) {
      return t('EnterVerificationSentToPhone', `Enter verification code sent to {{phone}}`, {
        phone: emailXOrPhone.phone,
      });
    }

    throw new DeveloperError('EnterPasswordVerification expects phone or email');
  })();

  const handleSubmit: SubmitHandler<EnterVerificationCodeFields> = (values) => {
    setLoading(true);
    onSubmit(values)
      .catch((e) =>
        form.setError('code', {
          message: e.message || t('VerificationFailed', 'Verification failed'),
        }),
      )
      .finally(() => setLoading(false));
  };

  return (
    <FForm {...{ form, onSubmit: handleSubmit }}>
      <HeaderSubheader header={header} subheader={subheader} />
      <TextInput
        widget="text:number"
        questionKey="code"
        name={text}
        registerOptions={{
          required: true,
          validate: (val) => {
            if (String(val).length !== 6)
              return (
                t('CodeMustBe6Characters', 'Code must be 6 characters') ??
                'Code must be 6 characters'
              );
          },
        }}
      />
      {askBirthday && (
        <DateInput
          name={t('Birthday', 'Birthday')}
          questionKey="birthday"
          registerOptions={{ required: true }}
        />
      )}
      <div className="flex items-center justify-between">
        <div className="text-sm">
          {t('DidntReceiveACode', "Didn't receive a code?")}
          <Button
            onClick={onTryAgain}
            variant="tertiary"
            className="p-0 m-0 font-medium text-f-dark-green hover:text-f-light-green"
          >
            {t('TrySendingAnother', 'Try sending another')}
          </Button>
        </div>
      </div>
      <div className="flex justify-end">
        <Button size="large" loading={loading} disabled={!form.formState.isValid} type="submit">
          {t('VerifyCode', 'Verify Code')}
        </Button>
      </div>
    </FForm>
  );
}
