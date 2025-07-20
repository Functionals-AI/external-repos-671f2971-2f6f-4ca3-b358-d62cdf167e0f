import { RegisterOptions, useFormContext } from 'react-hook-form';
import ReactPhoneInput from 'react-phone-number-input/react-hook-form-input';
import { useEffect } from 'react';
import { inputClasses } from '../helpers';
import { useTranslation } from 'react-i18next';

export function isValidNANP(value: string) {
  return /^1?[2-9]((?!11)[0-8]\d)[2-9]((?!11)\d{2})\d{4}$/.test(value.replace(/\D/g, ''));
}

function isValidPhoneNumber(value: string): boolean {
  return /^\+1[2-9]\d{2}[2-9]\d{2}\d{4}$/.test(value);
}

interface PhoneInputProps {
  questionKey: string;
  registerOptions: RegisterOptions;
  readOnly: boolean;
  name?: string | null;
}

export default function PhoneInput({
  name,
  questionKey,
  registerOptions,
  readOnly,
}: PhoneInputProps) {
  const { control, unregister } = useFormContext();
  const { t } = useTranslation();

  useEffect(() => {
    return () => unregister(questionKey);
  }, []);

  return (
    <div>
      <ReactPhoneInput
        id={name}
        country="US"
        control={control}
        className={inputClasses}
        readOnly={readOnly}
        rules={{
          ...registerOptions,
          validate: (value: string) => {
            if (!value) return;
            if (!isValidPhoneNumber(value))
              return t('NotValidPhoneNumber', 'Not a valid phone number');
            if (!isValidNANP(value))
              return t('NotValidNorthAmericanNumber', 'Not a valid North American number');

            return true;
          },
        }}
        name={questionKey}
        maxLength="14"
      />
    </div>
  );
}
