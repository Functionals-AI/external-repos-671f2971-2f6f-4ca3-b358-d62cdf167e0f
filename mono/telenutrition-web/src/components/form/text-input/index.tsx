import { RegisterOptions } from 'react-hook-form';
import { QuestionDisclaimer, QuestionWidgetType } from '../../../api/api-types';
import FormItemLabel from '../form-item-label';
import { HTMLInputTypeAttribute } from 'react';
import styles from './text-input.module.css';
import PhoneInput from './phone-input';
import 'react-phone-number-input/style.css';
import { inputClasses, isFieldRequired } from '../helpers';
import useRegisterField from '../useRegisterField';
import FormItemFooter from '../form-item-footer';
import { default as I18N } from '../../../utils/i18n';
import { useTranslation } from 'react-i18next';

const EMAIL_REGEX =
  /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

function getExtendedRegisterOptions(
  registerOptions: RegisterOptions,
  widget: QuestionWidgetType | 'text:password' | 'text:number',
  i18n: typeof I18N,
): RegisterOptions {
  const { t } = i18n;

  if (widget === 'text:zipcode') {
    registerOptions.pattern = {
      value: /^[0-9]{5}$/,
      message: t('NotValidZipcode', 'Not a valid US zipcode'),
    };
  } else if (widget === 'text:email') {
    registerOptions.pattern = {
      value: EMAIL_REGEX,
      message: t('NotValidEmailAddress', 'Not a valid email address'),
    };
  }

  return registerOptions;
}

export type TextInputWidgetType =
  | Extract<'text' | 'text:phone' | 'text:email' | 'text:zipcode', QuestionWidgetType>
  | 'text:password'
  | 'text:number';

interface TextInputProps {
  name?: string | null;
  questionKey: string;
  widget: TextInputWidgetType;
  registerOptions: RegisterOptions;
  disclaimer?: QuestionDisclaimer;
  readOnly?: boolean;
}

export default function TextInput({
  name,
  widget,
  questionKey,
  registerOptions,
  disclaimer,
  readOnly = false,
}: TextInputProps) {
  const { i18n } = useTranslation();
  const fieldConfig = useRegisterField(
    questionKey,
    getExtendedRegisterOptions(registerOptions, widget, i18n),
  );

  const config: { autoComplete?: string | undefined } = (() => {
    if (widget === 'text:email') {
      return { autoComplete: 'email' };
    }

    if (widget === 'text:phone') {
      return { autoComplete: 'tel' };
    }

    if (widget === 'text:zipcode') {
      return { autoComplete: 'postal-code' };
    }

    if (questionKey === 'first_name' || questionKey === 'firstName') {
      return { autoComplete: 'given-name' };
    }
    if (questionKey === 'last_name' || questionKey === 'lastName') {
      return { autoComplete: 'family-name' };
    }
    if (questionKey === 'address1') return { autoComplete: 'address-line1' };
    if (questionKey === 'address2') return { autoComplete: 'address-line2' };
    if (questionKey === 'city') return { autoComplete: 'address-level2' };

    return {};
  })();

  const type: HTMLInputTypeAttribute = (() => {
    if (widget === 'text:phone') return 'number';

    if (widget === 'text:number') return 'number';

    if (widget === 'text:password') return 'password';

    return 'text';
  })();

  return (
    <div className="space-y-2">
      <FormItemLabel name={name} required={isFieldRequired(registerOptions)} />
      {(() => {
        if (widget === 'text:phone') {
          return (
            <PhoneInput
              name={name}
              readOnly={readOnly}
              questionKey={questionKey}
              registerOptions={registerOptions}
            />
          );
        }

        return (
          <input
            {...fieldConfig}
            type={type}
            id={name ?? undefined}
            autoComplete={config.autoComplete}
            className={`${inputClasses} ${type === 'number' ? styles['no-arrow'] : ''}`}
            readOnly={readOnly}
          />
        );
      })()}
      <FormItemFooter {...{ questionKey, disclaimer }} />
    </div>
  );
}
