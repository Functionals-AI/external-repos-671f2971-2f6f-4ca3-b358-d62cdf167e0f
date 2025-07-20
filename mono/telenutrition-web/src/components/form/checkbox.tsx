import { RegisterOptions } from 'react-hook-form';
import FormItemLabel from './form-item-label';
import { inputClasses, isFieldRequired } from './helpers';
import useRegisterField from './useRegisterField';

interface CheckboxProps {
  questionKey: string;
  options: { id: string; title: string }[];
  registerOptions: RegisterOptions;
  label: string;
  // subLabel?: string;
  // disclaimer?: QuestionDisclaimer;
}

export default function Checkbox({ questionKey, registerOptions, label, options }: CheckboxProps) {
  const fieldConfig = useRegisterField(questionKey, {
    ...registerOptions,
  });

  return (
    <>
      <FormItemLabel name={label} required={isFieldRequired(registerOptions)} />
      {options.map((option) => {
        return (
          <div key={option.id} className={`${inputClasses} shadow-none border-none py-1`}>
            <input
              id={option.id}
              className="mr-2"
              type="checkbox"
              {...fieldConfig}
              value={option.id}
            />
            <label htmlFor={option.id} className="text-xs">
              {option.title}
            </label>
          </div>
        );
      })}
    </>
  );
}
