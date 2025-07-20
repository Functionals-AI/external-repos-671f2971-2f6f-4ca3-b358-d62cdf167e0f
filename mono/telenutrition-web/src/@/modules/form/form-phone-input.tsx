import { cn } from '@/utils';
import { FieldValues, UseFormReturn, Path } from 'react-hook-form';
import {
  FormField,
  FormControl,
  FormItem as RootFormItem,
  FormItemRules,
} from '../../ui-components/form/form';
import { FormItemLabel } from './ui';
import FormItemError from './form-item-error';
import FormItemBox from './form-item-box';
import ReactPhoneInput from 'react-phone-number-input/react-hook-form-input';
import { useTranslation } from 'react-i18next';
import phone from 'phone';

function isValidPhoneNumber(value: string): boolean {
  return phone(value, { country: 'USA' }).isValid;
}

interface FormPhoneInputProps<Values extends FieldValues, Key extends Path<Values>> {
  form: UseFormReturn<Values>;
  id: Key;
  label?: string;
  rules?: FormItemRules<Values>;
  disabled?: boolean;
  className?: string;
}

export default function FormPhoneInput<Values extends FieldValues, Key extends Path<Values>>({
  form,
  rules,
  disabled,
  id,
  className,
  label,
}: FormPhoneInputProps<Values, Key>) {
  const { t } = useTranslation();
  return (
    <FormField
      rules={rules}
      control={form.control}
      name={id}
      disabled={disabled}
      render={({ field }) => {
        return (
          <RootFormItem className={cn(className, 'bg-white')}>
            <FormItemBox isDisabled={disabled}>
              <FormItemLabel id={id} label={label} required={!!rules?.required} />
              <FormControl className="text-type-primary">
                <ReactPhoneInput
                  data-testid={`${id}-input`}
                  country="US"
                  placeholder={'(###) ### - ####'}
                  className={cn(
                    'p-0 text-sm',
                    'focus:!outline-none focus:!ring-0 !border-transparent',
                  )}
                  rules={{
                    ...rules,
                    validate: (value: string) => {
                      if (!value) return;
                      if (!isValidPhoneNumber(value)) {
                        return t('NotValidPhoneNumber', 'Not a valid phone number');
                      }
                      return true;
                    },
                  }}
                  control={form.control}
                  name={id}
                />
              </FormControl>
            </FormItemBox>
            <FormItemError />
          </RootFormItem>
        );
      }}
    />
  );
}
