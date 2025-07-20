import { RegisterOptions, Validate } from 'react-hook-form';
import { QuestionDisclaimer } from '../../api/api-types';
import FormItemFooter from './form-item-footer';
import FormItemLabel from './form-item-label';
import { inputClasses, isFieldRequired } from './helpers';
import useRegisterField from './useRegisterField';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';

interface SelectProps {
  questionKey: string;
  name?: string | null;
  options: { id: string; title: string; disabled?: boolean; hidden?: boolean; }[];
  registerOptions: RegisterOptions;
  label?: string | null;
  subLabel?: string;
  disclaimer?: QuestionDisclaimer;
}

export default function Select({
  questionKey,
  options,
  label,
  registerOptions,
  disclaimer,
  name,
}: SelectProps) {
  const { t } = useTranslation();
  const DUMMY_OPTION = {
    id: undefined,
    title: t('SelectOption', 'Select option'),
    disabled: false,
    hidden: false
  };

  const fieldConfig = useRegisterField(questionKey, {
    ...registerOptions,
    required: false,
    validate: {
      ...(registerOptions.validate && { custom: registerOptions.validate as Validate<any, any> }),
      default: (value) => {
        if (!registerOptions.required) return true;

        return value != null && value !== DUMMY_OPTION.title;
      },
    },
  });

  return (
    <>
      <FormItemLabel name={label} required={isFieldRequired(registerOptions)} />
      <select {...fieldConfig} id={name ?? undefined} className={inputClasses}>
        {[DUMMY_OPTION, ...options].filter(option => !option.hidden).map((option) => (
          <option
            key={`option-${option.id}-${_.snakeCase(option.title)}`}
            disabled={option.disabled}
            value={option.id}
            className="flex items-center"
          >
            {option.title}
          </option>
        ))}
      </select>
      <FormItemFooter {...{ questionKey, disclaimer }} />
    </>
  );
}
