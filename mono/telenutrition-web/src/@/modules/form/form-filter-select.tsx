import { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import _ from 'lodash';

import { FormControl, FormField, FormItem as RootFormItem } from '@/ui-components/form/form';
import FormItemError from './form-item-error';
import FilterSelect, { FilterSelectOption } from '@/ui-components/filter-select';

interface Props<Values extends FieldValues> {
  id: Path<Values>;
  label: string;
  form: UseFormReturn<Values>;
  options: FilterSelectOption[];
  multiple?: boolean;
  showSearch?: boolean;
}

export default function FormFilterSelect<Values extends FieldValues>({
  id,
  form,
  label,
  options,
  multiple,
  showSearch = false,
}: Props<Values>) {
  return (
    <FormField
      control={form.control}
      name={id}
      render={({ field, formState }) => {
        const keys = id.split('.');
        const error = _.get(formState.errors, keys);

        return (
          <RootFormItem>
            <FormControl>
              <FilterSelect
                label={label}
                options={options}
                value={field.value}
                onSelect={(value) => field.onChange(value)}
                showSearch={showSearch}
                multiple={multiple}
                isError={!!error}
              />
            </FormControl>
            <FormItemError />
          </RootFormItem>
        );
      }}
    />
  );
}
