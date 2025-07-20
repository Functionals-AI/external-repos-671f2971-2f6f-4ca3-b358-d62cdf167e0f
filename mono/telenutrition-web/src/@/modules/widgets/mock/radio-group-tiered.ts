import type { RadioGroupTieredQuestion } from '@mono/telenutrition/lib/types';

export const radioGroupTiered: RadioGroupTieredQuestion = {
  type: 'input:radio',
  key: 'nestedRadioWithOther',
  label: 'What is your main reason for using Foodsmart?',
  options: [
    {
      type: 'basic',
      label: 'Improve wellness',
      value: 'improve wellness1',
    },
    {
      type: 'basic',
      label: 'Lose weight',
      value: 'lose weight1',
    },
    {
      type: 'basic',
      label: 'Gain weight',
      value: 'gain weight1',
    },
    {
      type: 'basic',
      label: 'Get and make healthy food',
      value: 'get and make healthy food1',
      disabled: true,
    },
    {
      type: 'basic',
      label: 'Help affording healthy food',
      value: 'help affording healthy food1',
    },
    {
      type: 'text-input',
      label: 'Other',
      value: 'other1',
      placeholder: 'More details...',
    },
  ],
  required: true,
};
