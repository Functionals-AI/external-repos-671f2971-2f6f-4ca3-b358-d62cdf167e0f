export type OptionVariant = 'error' | 'disallowed' | 'default';

export type OptionValue = string;

export type Option = {
  value: OptionValue;
  title?: string;
  description?: string;
  variant?: OptionVariant;
  direction?: 'horizontal' | 'vertical';
  disabled?: boolean;
};
