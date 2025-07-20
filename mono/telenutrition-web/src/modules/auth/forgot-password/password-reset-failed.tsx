import { useTranslation } from 'react-i18next';
import Button from '../../../components/button';
import HeaderSubheader from '../../../components/header-subheader';
import SupportButton from '../../../components/support-button';

export default function PasswordResetFailed({
  message,
  onTryAgain,
}: {
  message?: string;
  onTryAgain: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="max-w-xl m-auto flex flex-col justify-center gap-y-8 px-8 pt-8">
      <HeaderSubheader
        header={t('Error', 'Error')}
        subheader={
          message ??
          t('ThereWasAnErrorResettingYourPassword', 'There was an error resetting your password')
        }
      />
      <p>
        {t(
          'PleaseEnsureYourEmailOrPhoneNumberEnteredCorrectly',
          'Please ensure that your email or phone number was entered correctly. You may only reset your password once every 24 hours.',
        )}
      </p>
      <Button onClick={onTryAgain}>{t('TryAgain', 'Try Again')}</Button>
      <SupportButton />
    </div>
  );
}
