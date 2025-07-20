import { useTranslation } from 'react-i18next';

interface BaseField {
  type: 'text' | 'select';
  className?: string;
  id: string;
  label: string;
  rules?: any;
}

interface BaseInputField extends BaseField {
  type: 'text';
}

interface SelectField extends BaseField {
  type: 'select';
  options: { label: string; value: string }[];
}

export type InputField = BaseInputField | SelectField;
