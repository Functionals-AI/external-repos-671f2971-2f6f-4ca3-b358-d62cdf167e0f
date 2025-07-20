import { ErrorMessage } from '@hookform/error-message';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

interface FormErrorMessageProps {
  questionKey: string;
}

export default function FormErrorMessage({ questionKey }: FormErrorMessageProps) {
  const {
    formState: { errors },
  } = useFormContext();
  const { t } = useTranslation();

  return (
    <ErrorMessage
      errors={errors}
      name={questionKey}
      render={({ message }) => (
        <p style={{ width: '100%' }} className="text-status-red-600">
          {message || `${t('Required', 'Required')} *`}
        </p>
      )}
    />
  );
}
