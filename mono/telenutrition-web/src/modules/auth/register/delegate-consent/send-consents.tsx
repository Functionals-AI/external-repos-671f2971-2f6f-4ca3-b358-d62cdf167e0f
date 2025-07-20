import { useForm } from 'react-hook-form';
import FForm from '../../../../components/f-form';
import HeaderSubheader from '../../../../components/header-subheader';
import EmailPhoneSelector, {
  useEmailPhoneSelectorState,
} from '../../../../components/email-phone-selector';
import Button from '../../../../components/button';
import { EmailXOrPhone } from '../../../../hooks/useGetEmailPhoneFromQuery';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { ApiRequestError } from '../../../../utils/errors';
import Alert from '../../../../components/alert';

interface SendConsentsProps {
  onSubmit: (values: EmailXOrPhone) => void;
  onSkipStep: () => void;
}

export default function SendConsents({ onSubmit, onSkipStep }: SendConsentsProps) {
  const form = useForm<EmailXOrPhone>({ mode: 'onChange' });
  const { t } = useTranslation();
  const emailPhoneSelectorState = useEmailPhoneSelectorState();
  const [error, setError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const handleSubmit = (values: EmailXOrPhone) => {
    setIsLoading(true);
    Promise.resolve(onSubmit(values))
      .then(() => setIsLoading(false))
      .catch((e) => {
        const errorMessage =
          e instanceof ApiRequestError
            ? e.message
            : t('ErrorSendingConsentForms', 'There was an error sending consent forms');
        setError(errorMessage);
        setIsLoading(false);
      });
  };

  return (
    <FForm form={form} onSubmit={handleSubmit}>
      <HeaderSubheader
        header={t('PatientConsent', 'Patient Consent')}
        subheader={t(
          'YouMustGetPatientsConsentBeforeCreatingAccount',
          "You must get the patient's consent before creating their account",
        )}
      />
      {error && (
        <Alert
          title={t('ErrorWithYourRequest', 'There was an error with your request')}
          subtitle={`${error} -- ${t('TryAgain', 'Try Again')}`}
          onClose={() => setError(null)}
        />
      )}
      <p>
        {t(
          'ChooseWhereTheConsentFormsShouldBeSentTo',
          'Choose Where the consent forms should be sent to',
        )}
      </p>
      <EmailPhoneSelector {...emailPhoneSelectorState} />
      <div>
        <p>
          Already have the user&apos;s consent?
          <Button className="text-f-light-green" variant="tertiary" onClick={onSkipStep}>
            Skip this step here
          </Button>
        </p>
      </div>
      <div className="flex justify-end">
        <Button size="large" loading={isLoading} disabled={!form.formState.isValid} type="submit">
          {t('SendConsents', 'Send Consents')}
        </Button>
      </div>
    </FForm>
  );
}
