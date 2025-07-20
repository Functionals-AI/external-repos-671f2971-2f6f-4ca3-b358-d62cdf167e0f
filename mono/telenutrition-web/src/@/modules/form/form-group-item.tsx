import { FormField, FormItemRules } from '@/ui-components/form/form';
import { ReactNode } from 'react';
import { FieldValues, Path, PathValue, UseFormReturn, RegisterOptions } from 'react-hook-form';

// If multiple items are grouped under one key.
// i.e. if id = 'availability' and value type is string:
//   'availability': Record<string, string>

type RenderProps<DataStructure, FieldValue extends Record<string, DataStructure>> = {
  onChange: (key: string, value: PathValue<FieldValue, any>) => void;
  getValue: (key: string) => undefined | null | PathValue<FieldValue, any>;
};

type FormGroupItemProps<
  Key extends Path<FieldValues>,
  DataStructure,
  FieldValue extends Record<string, DataStructure>,
  Values extends FieldValues & { [k in Key]: FieldValue },
> = {
  id: Key;
  form: UseFormReturn<Values>;
  rules?: FormItemRules<Values>;
  render: (props: RenderProps<DataStructure, FieldValue>) => ReactNode;
};

function FormGroupItem<
  Key extends Path<FieldValues>,
  DataStructure,
  FieldValue extends Record<string, DataStructure>,
  Values extends FieldValues & { [k in Key]: FieldValue },
>({ id, form, rules, render }: FormGroupItemProps<Key, DataStructure, FieldValue, Values>) {
  return (
    <FormField
      name={id as unknown as Path<Values>}
      control={form.control}
      rules={rules}
      render={({ field }) => {
        function getValue(key: string): undefined | PathValue<FieldValue, any> {
          if (!field.value) return undefined;
          const fieldValue = field.value as FieldValue;
          const found = Object.entries(fieldValue).find(([k]) => k === key);
          return found?.[1] as PathValue<FieldValue, any>;
        }
        function onChange(key: string, value: PathValue<FieldValue, any> | null) {
          if (!getValue && value === null) return;
          field.onChange({ ...field.value, [key]: value });
        }

        return <>{render({ onChange, getValue })}</>;
      }}
    />
  );
}

export default FormGroupItem;
