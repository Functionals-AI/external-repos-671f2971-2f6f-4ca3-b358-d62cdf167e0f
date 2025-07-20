import { FormControl, FormField, FormItemRules } from '@/ui-components/form/form';
import { cn } from '@/utils';
import { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import TagInput from '@/ui-components/tag-input';
import type { TagInputQuestionV2Option } from '@mono/telenutrition/lib/types';
import FormItemError from './form-item-error';
import RadioOption from '@/ui-components/radio-and-checkbox/radio/radio-option';

interface FormConditionalTagInputProps<Values extends FieldValues> {
  form: UseFormReturn<Values>;
  id: Path<Values>;
  rules?: FormItemRules<Values>;
  options: TagInputQuestionV2Option[];
  inputLabel: string;
}

export default function FormConditionalTagInput<Values extends FieldValues>({
  form,
  id,
  rules,
  options,
  inputLabel,
}: FormConditionalTagInputProps<Values>) {
  return (
    <FormField
      name={id}
      control={form.control}
      rules={{
        validate: (value) => {
          if (Array.isArray(value)) {
            return value.length > 0;
          }

          if (!rules?.required) return true;

          return value === null;
        },
      }}
      render={({ field }) => {
        const isError = !!form.formState.errors[id];
        return (
          <FormControl>
            <div className={cn('flex flex-col gap-y-2')}>
              <RadioOption
                isError={isError && !Array.isArray(field.value)}
                label="Yes"
                onChecked={() => {
                  if (!Array.isArray(field.value)) {
                    field.onChange([]);
                  }
                }}
                checked={Array.isArray(field.value)}
                dataTestId={`radio-option-${id}-yes`}
              />
              <TagInput
                inputLabel={inputLabel}
                id={id}
                isError={isError}
                required
                options={options.map((o) => ({ ...o, type: 'predefined' }))}
                creatable={false}
                disabled={!Array.isArray(field.value)}
                value={
                  !Array.isArray(field.value)
                    ? []
                    : (field.value as string[]).map((v) => ({
                        type: 'predefined',
                        value: v,
                        label: options.find((o) => o.value === v)!.label,
                      }))
                }
                onChange={(value) => {
                  field.onChange(value.map((o) => o.value));
                }}
              />
              <RadioOption
                isError={isError && !Array.isArray(field.value)}
                label="No"
                onChecked={() => {
                  field.onChange(null);
                }}
                checked={field.value === null}
                dataTestId={`radio-option-${id}-no`}
              />
              <FormItemError />
            </div>
          </FormControl>
        );
      }}
    />
  );
}
