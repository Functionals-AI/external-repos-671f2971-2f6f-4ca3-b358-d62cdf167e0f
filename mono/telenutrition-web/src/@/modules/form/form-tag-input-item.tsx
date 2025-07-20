import TagInput from '@/ui-components/tag-input';
import { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { FormField, FormItemRules } from '@/ui-components/form/form';
import { TagInputOption } from '@/ui-components/tag-input/types';
import _ from 'lodash';
import { t } from 'i18next';
import FormItemError from './form-item-error';

interface FormTagInputItemProps<Values extends FieldValues> {
  form: UseFormReturn<Values>;
  className?: string;
  id: Path<Values>;
  options: TagInputOption[];
  inputLabel: string;
  rules?: FormItemRules<Values>;
  min?: number;
  max?: number;
  creatable?: boolean;
  // TOOD: disable
}

export default function FormTagInputItem<Values extends FieldValues>({
  form,
  id,
  rules,
  inputLabel,
  options,
  creatable,
  className,
}: FormTagInputItemProps<Values>) {
  return (
    <FormField
      name={id as unknown as Path<Values>}
      control={form.control}
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
              className={className}
              creatable={creatable}
              required={!!rules?.required}
              inputLabel={inputLabel}
              value={field.value}
              onChange={(v) => {
                field.onChange(v);
              }}
              options={options}
              isError={!!formState.errors[id]}
            />
            <FormItemError />
          </>
        );
      }}
    />
  );
}
