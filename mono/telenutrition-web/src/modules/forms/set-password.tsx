import { SubmitHandler, useForm } from 'react-hook-form';
import TextInput from '../../components/form/text-input';
import Button from '../../components/button';
import { useState } from 'react';
import HeaderSubheader from '../../components/header-subheader';
import { useTranslation } from 'react-i18next';
import FForm from '../../components/f-form';

interface SetPasswordFields {
  password: string;
  confirmPassword: string;
}

interface SetPasswordFormProps {
  submitText?: string | null;
  onSubmit: (values: Pick<SetPasswordFields, 'password'>) => Promise<unknown>;
}

export default function SetPasswordForm({ submitText, onSubmit }: SetPasswordFormProps) {
  const form = useForm<SetPasswordFields>({ mode: 'onChange' });
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const handleSubmit: SubmitHandler<SetPasswordFields> = ({ password }) => {
    setIsLoading(true);
    onSubmit({ password }).finally(() => setIsLoading(false));
  };

  return (
    <FForm {...{ form, onSubmit: handleSubmit }}>
      <HeaderSubheader header={t('CreateAPassword', 'Create a password')} />
      <TextInput
        name={t('Password', 'Password')}
        questionKey="password"
        widget="text:password"
        registerOptions={{
          required: true,
          minLength: {
            value: 8,
            message: t('NotEnoughCharacters', 'Not enough characters'),
          },
          validate: (value) => {
            if (!(/\d/.test(value) && /[a-z]/i.test(value))) {
              return (
                t(
                  'MustContainAtLeast1LetterAnd1Number',
                  'Must contain at least 1 letter and 1 number',
                ) ?? false
              );
            }
            return true;
          },
        }}
      />
      <p>
        {t('YourPasswordMustBeAtLeast8Characters', 'Your password must be at least 8 characters.')}
      </p>
      <TextInput
        name={t('ConfirmPassword', 'Confirm Password')}
        questionKey="confirmPassword"
        widget="text:password"
        registerOptions={{
          required: true,
          validate: () => {
            const { password, confirmPassword } = form.getValues();
            if (password !== confirmPassword) {
              return t('PasswordsDoNotMatch', 'Passwords do not match') ?? false;
            }
            return true;
          },
        }}
      />
      <div className="flex justify-end">
        <Button size="large" type="submit" loading={isLoading} disabled={!form.formState.isValid}>
          {submitText ?? t('SetPassword', 'Set Password')}
        </Button>
      </div>
    </FForm>
  );
}
