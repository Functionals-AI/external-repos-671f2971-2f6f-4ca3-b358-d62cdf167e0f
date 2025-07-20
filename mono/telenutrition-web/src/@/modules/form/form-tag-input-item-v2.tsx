import TagInput from '@/ui-components/tag-input';
import { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { FormField, FormItemRules } from '@/ui-components/form/form';
import _ from 'lodash';
import { t } from 'i18next';
import FormItemError from './form-item-error';

interface FormTagInputItemProps<Values extends FieldValues> {
  form: UseFormReturn<Values>;
  className?: string;
  id: Path<Values>;
  options: { value: string; label: string; disabled?: boolean }[];
  inputLabel: string;
  rules?: FormItemRules<Values>;
  min?: number;
  max?: number;
  disabled?: boolean;
  dataTestId?: string;
}

export default function FormTagInputItemV2<Values extends FieldValues>({
  form,
  id,
  rules,
  inputLabel,
  options,
  className,
  disabled,
  dataTestId
}: FormTagInputItemProps<Values>) {
  return (
    <FormField
      name={id as unknown as Path<Values>}
      control={form.control}
      disabled={disabled}
      rules={{
        ..._.omit(rules, 'required'),
        validate: (v) => {
          if (!rules?.required) {
            return true;
          }

          if (v == undefined || v == null || v.length === 0) {
            return t('Need at least one value selected');
          }

          return true;
        },
      }}
      render={({ field, formState }) => {
        return (
          <>
            <TagInput
              id={id}
              disabled={disabled}
              className={className}
              creatable={false}
              required={!!rules?.required}
              inputLabel={inputLabel}
              dataTestId={dataTestId ?? `${id}-input`}
              value={
                !Array.isArray(field.value)
                  ? []
                  : (field.value as string[]).map((v) => ({
                      type: 'predefined',
                      value: v,
                      label: options.find((o) => o.value === v)!.label,
                    }))
              }
              onChange={(v) => {
                field.onChange(v.map((i) => i.value));
              }}
              options={options.map((o) => ({ ...o, type: 'predefined' }))}
              isError={!!formState.errors[id]}
            />
            <FormItemError />
          </>
        );
      }}
    />
  );
}
