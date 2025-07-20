import { useFormContext, Controller, RegisterOptions } from 'react-hook-form';
import { inputClasses, isFieldRequired } from '../helpers';
import useRegisterField from '../useRegisterField';
import dayjs from 'dayjs';
import { default as I18N } from '../../../utils/i18n';
import { useTranslation } from 'react-i18next';
import InputMask from 'react-input-mask';
import FormItemLabel from '../form-item-label';
import FormItemFooter from '../form-item-footer';

type DateConstraint = {
  date: Date;
  message: string;
};

function getExtendedRegisterOptions({
  registerOptions,
  i18n,
  minDate,
  maxDate,
}: {
  registerOptions: RegisterOptions;
  i18n: typeof I18N;
  minDate?: DateConstraint;
  maxDate?: DateConstraint;
}): RegisterOptions {
  const { t } = i18n;

  registerOptions.validate = (value) => {
    const asDay = dayjs(value);
    if (!asDay.isValid()) return t('NotValidDate', 'Not a valid date') ?? undefined;

    if (maxDate && asDay.isAfter(maxDate.date)) {
      return maxDate.message;
    }

    if (minDate && asDay.isBefore(minDate.date)) {
      return minDate.message;
    }

    return true;
  };

  return registerOptions;
}

interface DateInputProps {
  name?: string | null;
  questionKey: string;
  registerOptions: RegisterOptions;
  readOnly?: boolean;
  minDate?: DateConstraint;
  maxDate?: DateConstraint;
  disclaimer?: string;
}

export default function DateInput({
  name,
  questionKey,
  registerOptions,
  minDate,
  maxDate,
  readOnly,
  disclaimer,
}: DateInputProps) {
  const { control } = useFormContext();
  const { i18n } = useTranslation();

  useRegisterField(
    questionKey,
    getExtendedRegisterOptions({ registerOptions, i18n, minDate, maxDate }),
  );

  return (
    <div className="space-y-2">
      <FormItemLabel name={name} required={isFieldRequired(registerOptions)} />
      <Controller
        name={questionKey}
        control={control}
        render={({ field: { onChange, value } }) => (
          <InputMask readOnly={readOnly} mask="99/99/9999" value={value} onChange={onChange}>
            {/** @ts-ignore */}
            {(inputProps) => (
              <input
                {...inputProps}
                id={name}
                type="tel"
                className={inputClasses}
                readOnly={readOnly}
              />
            )}
          </InputMask>
        )}
      />
      <FormItemFooter {...{ questionKey, disclaimer }} />
    </div>
  );
}
