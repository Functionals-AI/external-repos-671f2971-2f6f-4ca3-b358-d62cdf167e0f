import { RegisterOptions } from 'react-hook-form';
import { QuestionDisclaimer } from '../../api/api-types';
import FormItemFooter from './form-item-footer';
import FormItemLabel from './form-item-label';
import { isFieldRequired } from './helpers';
import useRegisterField from './useRegisterField';

interface ButtonSelectProps {
  questionKey: string;
  label: string;
  subLabel?: string | JSX.Element;
  options: {
    id: string;
    title: string;
  }[];
  registerOptions: RegisterOptions;
  disclaimer?: QuestionDisclaimer;
}

export default function ButtonSelect({
  questionKey,
  label,
  subLabel,
  options,
  registerOptions,
  disclaimer,
}: ButtonSelectProps) {
  const fieldConfig = useRegisterField(questionKey, registerOptions);

  return (
    <>
      <FormItemLabel name={label} required={isFieldRequired(registerOptions)} />
      {/* {subLabel && <p className="text-sm leading-5 text-gray-500">{subLabel}</p>} */}
      <div className="focus:ring-f-light-green focus:border-f-light-green w-full sm:text-sm border-gray-300 rounded-md grid grid-cols-2 gap-4">
        {options.map((option) => (
          <div key={option.id} className="flex items-center mb-2 justify-center">
            <input
              {...fieldConfig}
              id={option.id}
              type="radio"
              className="focus:ring-f-light-green h-4 w-4 text-f-light-green border-gray-300 lg:text-lg"
              value={option.id}
            />
            <label htmlFor={option.id} className="ml-3 block text-sm font-medium">
              {option.title}
            </label>
          </div>
        ))}
      </div>
      <FormItemFooter {...{ questionKey, disclaimer }} />
    </>
  );
}
