import { FieldValues, UseFormReturn, Validate } from 'react-hook-form';
import type { EntryEditorQuestion } from '@mono/telenutrition/lib/types';
import { FormField } from '@/ui-components/form/form';
import { Button } from '@/ui-components/button';
import ComboBox from '@/ui-components/combobox';
import Icon from '@/ui-components/icons/Icon';

interface EntryEditorWidgetProps {
  widget: EntryEditorQuestion;
  form: UseFormReturn;
}

export default function EntryEditorWidget({ form, widget }: EntryEditorWidgetProps) {
  const validationRule: Validate<(string | null)[], FieldValues> | undefined = widget.allowEmptyEntries
    ? undefined
    : (values) => {
        if (values?.length > 1 && values.some((v: string | null) => !v)) {
          return 'Entries must have a value selected';
        }
        return true;
      };

  return (
    <FormField
      control={form.control}
      name={widget.key}
      rules={{
        validate: validationRule,
      }}
      render={({ field }) => {
        const values = (field.value ?? [null]) as (string | null)[];
        function addEntry() {
          field.onChange([...values, null]);
        }

        function removeEntry(ind: number) {
          field.onChange(values.slice(0, ind).concat(values.slice(ind + 1)));
        }

        function clearEntry(ind: number) {
          field.onChange(values.slice(0, ind).concat(null, values.slice(ind + 1)));
        }

        function entryHasValue(ind: number) {
          return values[ind] !== null;
        }

        const availableOptions = widget.options.filter((o) => values.indexOf(o.value) === -1);

        return (
          <div className="w-full flex flex-col gap-y-2">
            <div className="flex flex-col w-full items-center gap-y-4">
              {values.map((value, ind) => {
                const thisOption = widget.options.filter((option) => option.value === value);
                const hasError = values?.length > 1 && !value;
                const isErrorState = hasError && !!form.formState.errors[widget.key];

                return (
                  <div key={`${value}-${ind}`} className="flex w-full gap-x-2 items-center">
                    <ComboBox
                      className="w-full"
                      inputLabel={widget.inputLabel}
                      options={[...availableOptions, ...thisOption]}
                      value={value}
                      isError={isErrorState}
                      onSelect={(option) => {
                        const updated = values
                          .slice(0, ind)
                          .concat(option?.value ?? null, values.slice(ind + 1));

                        if (updated.length === 0) {
                          field.onChange(null);
                          return;
                        } else {
                          field.onChange(updated);
                        }
                      }}
                    />
                    {ind === 0 && entryHasValue(0) && (
                      <Button
                        dataTestId="clear-entry"
                        onClick={() => (values.length > 1 ? removeEntry(0) : clearEntry(0))}
                        variant="tertiary"
                        theme="destructive"
                        size="sm"
                      >
                        <Icon name="delete" color="statusRed800" />
                      </Button>
                    )}
                    {ind > 0 && (
                      <Button
                        dataTestId="remove-entry"
                        onClick={() => removeEntry(ind)}
                        variant="tertiary"
                        theme="destructive"
                        size="sm"
                      >
                        <Icon name="delete" color="statusRed800" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
            <Button
              dataTestId="add-entry"
              leftIcon={{ name: 'plus' }}
              size="sm"
              className="w-fit"
              variant="secondary"
              onClick={() => addEntry()}
            >
              {widget.addButtonText}
            </Button>
          </div>
        );
      }}
    />
  );
}
