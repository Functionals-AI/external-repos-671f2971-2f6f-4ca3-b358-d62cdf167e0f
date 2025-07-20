import HeaderSubheader from '../../../../components/header-subheader';
import Button from '../../../../components/button';
import useTranslationStrings from '../../../../hooks/useTranslationStrings';
import parse from 'html-react-parser';

interface InstructPatientProps {
  onContinue: () => void;
  onBack: () => void;
}

export default function InstructPatient({ onContinue, onBack }: InstructPatientProps) {
  const { t, terms, privacy, disclaimer } = useTranslationStrings();
  return (
    <div className="space-y-6 m-auto px-8 pt-8 max-w-5xl">
      <HeaderSubheader
        header={t('InstructPatientHeader', 'Instructions')}
        subheader={t("Please follow the instructions to get the patient's consent")}
      />
      <h4>{t('ReadOutLoudToPatient', 'Read out loud to Patient')}:</h4>
      <p className="italic text-xl">
        &quot;
        {t(
          'BeforeIScheduleTheAppointment',
          'Before I schedule the appointment, I need to receive your verbal consent to our terms and conditions. You should have received a text and email (if email was provided) that includes the terms and conditions. Please take a moment to review and let me know if you consent.',
        )}
        &quot;
      </p>
      <p className="font-semibold text-f-red">
        {t('PatientDidntReceiveTheEmailOrText', "Patient didn't receive the email or text?")}
        {` `}
        {t('Say', 'Say')}:
      </p>
      <p className="italic text-xl">
        &quot;
        {t(
          'IStillNeedYourConsent',
          'I still need your consent. I am more than happy to read through the terms and conditions with you on the phone. Please let me know if you would like me to do that or if you are ok providing consent without me reading them aloud.',
        )}
        &quot;
      </p>
      <div>
        <p>{parse(terms)}</p>
        <p>{parse(privacy)}</p>
        <p>{parse(disclaimer)}</p>
      </div>
      <div className="flex justify-between">
        <Button onClick={onBack}>{t('Back', 'Back')}</Button>
        <Button variant="secondary" onClick={onContinue}>
          {t('Continue', 'Continue')}
        </Button>
      </div>
    </div>
  );
}
