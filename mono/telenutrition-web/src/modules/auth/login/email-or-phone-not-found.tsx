import { useTranslation } from 'react-i18next';
import Button from '../../../components/button';

type EmailOrPhoneNotFoundProps = Record<string, string>;

export default function EmailOrPhoneNotFound(props: EmailOrPhoneNotFoundProps) {
  const { t } = useTranslation();
  const text =
    'phone' in props
      ? t(
          'PhoneNumberDoesNotExistInOurSystem',
          `The phone number {{phone}} does not exist in our system`,
          { phone: props.phone },
        )
      : 'email' in props
      ? t('EmailDoesNotExistInOurSystem', `The email {{email}} does not exist in our system`, {
          email: props.email,
        })
      : t(
          'EmailOrPhoneDoesNotExistInOurSystem',
          'This email or phone does not exist in our system',
        );

  return (
    <div className="flex flex-col gap-8">
      <h3>{text}</h3>
      <Button>{t('CreateNewAccount', 'Create new account')}</Button>
      <p>{t('Or', 'Or')}</p>
      <Button>
        {t(
          'ContactSupportToHelpYouRecoverYourAccount',
          'Contact support to help you recover your account',
        )}
      </Button>
    </div>
  );
}
