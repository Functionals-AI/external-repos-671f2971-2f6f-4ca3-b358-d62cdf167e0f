import { useTranslation } from 'react-i18next';
import Button from '../../../components/button';
import HeaderSubheader from '../../../components/header-subheader';
import SupportButton from '../../../components/support-button';
import { ApiRequestError } from '../../../utils/errors';

interface CreateUserFailedProps {
  onTryAgain: () => void;
  error?: Error | ApiRequestError;
}

export default function CreateUserFailed({ onTryAgain, error }: CreateUserFailedProps) {
  const { t } = useTranslation();
  const errorData = (() => {
    try {
      let trace: string | undefined;
      let message: string | undefined;
      if (!error) return null;
      if ('trace' in error) trace = error.trace;
      if (error.message) message = error.message;
      else if (error.name) message = error.name;

      return { trace, message };
    } catch (e) {
      return null;
    }
  })();

  return (
    <div className="max-w-xl m-auto flex flex-col justify-center pt-12 gap-y-8">
      <HeaderSubheader
        header={t('Error', 'Error')}
        subheader={t(
          'ThereWasAnErrorRegisteringNewAccount',
          'There was an error registering a new account',
        )}
      />
      {errorData && (
        <>
          {errorData.message ? <p>Error: {errorData.message}</p> : null}
          {errorData.trace ? <p>Trace ID: {errorData.trace}</p> : null}
        </>
      )}
      <Button onClick={onTryAgain}>{t('TryAgain', 'Try Again')}</Button>
      <SupportButton />
    </div>
  );
}
