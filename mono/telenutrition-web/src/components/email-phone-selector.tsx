import { useState } from 'react';
import classNames from '../utils/classNames';
import TextInput from './form/text-input';
import { useTranslation } from 'react-i18next';

type EmailPhoneSelectorState = {
  selected: 'phone' | 'email';
  setSelected: (value: 'phone' | 'email') => void;
};

export function useEmailPhoneSelectorState() {
  const [selected, setSelected] = useState<'phone' | 'email'>('email');
  return { selected, setSelected };
}

export default function EmailPhoneSelector({ selected, setSelected }: EmailPhoneSelectorState) {
  const { t } = useTranslation();
  return (
    <div>
      <div className="flex justify-center">
        <div className="inline-flex">
          <button
            type="button"
            className={classNames(
              'focusable',
              'border border-solid border-neutral-150',
              'transition-colors',
              'font-bold py-2 px-4 rounded-l-md',
              selected === 'email' ? 'bg-f-dark-green text-white' : 'bg-white text-grey',
            )}
            onClick={() => setSelected('email')}
          >
            {t('Email', 'Email')}
          </button>
          <button
            type="button"
            className={classNames(
              'focusable',
              'border border-solid border-neutral-150',
              'transition-colors',
              'font-bold py-2 px-4 rounded-r-md',
              selected === 'phone' ? 'bg-f-dark-green text-white' : 'bg-white text-grey',
            )}
            onClick={() => setSelected('phone')}
          >
            {t('Phone', 'Phone')}
          </button>
        </div>
      </div>
      {selected === 'phone' ? (
        <div>
          <TextInput
            name={t('Phone', 'Phone')}
            questionKey="phone"
            widget="text:phone"
            registerOptions={{ required: true }}
          />
        </div>
      ) : (
        <div>
          <TextInput
            name={t('Email', 'Email')}
            questionKey="email"
            widget="text:email"
            registerOptions={{ required: true }}
          />
        </div>
      )}
    </div>
  );
}
