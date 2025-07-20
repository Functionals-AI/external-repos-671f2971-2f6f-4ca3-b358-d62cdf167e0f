import React, { ReactNode } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField } from '@/ui-components/form/form';
import { cn } from '@/utils';
import RadioGroup from '@/ui-components/radio-and-checkbox/radio';
import { RadioGroup as HeadlessRadioGroup } from '@headlessui/react';
import type { RadioTableRow } from '@mono/telenutrition/lib/types';
import parse from 'html-react-parser';

type RadioTableColumn =
  | {
      type: 'radio';
      value: string;
      label: string;
    }
  | {
      type: 'display';
      label: string;
      component: (question: RadioTableRow) => ReactNode;
    };

interface RadioTableItemProps {
  form: UseFormReturn<any>;
  id: string;
  columns: RadioTableColumn[];
  rows: RadioTableRow[];
  disabled?: boolean;
  required?: boolean;
}

function RadioTableItem({ form, columns, rows, id, disabled, required }: RadioTableItemProps) {
  const errors = form.formState.errors;

  return (
    <FormField
      control={form.control}
      name={id}
      disabled={disabled}
      rules={{ required: required }}
      render={({ field }) => (
        <table>
          <thead>
            <tr className="border-b">
              <th></th>
              {columns.map((column, ind) => (
                <th
                  key={column.label}
                  className={cn('px-2 py-2', ind !== columns.length - 1 && 'border-r')}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              return (
                <HeadlessRadioGroup
                  key={row.key}
                  value={field.value?.[row.key] ?? false}
                  onChange={(v) => {
                    field.onChange({ ...field.value, [row.key]: v });
                  }}
                  as="tr"
                  className={cn(
                    'border-b',
                    field.disabled && 'bg-neutral-115',
                    errors && row.key in errors && 'border-status-red-600 text-status-red-600',
                  )}
                >
                  <td className="py-2 text-neural-400 h-[66px]">
                    <div>
                      {row.label} {row.required && '*'}
                    </div>
                    {row.sublabel && <div className="text-sm">{parse(row.sublabel)}</div>}
                  </td>
                  {columns.map((column, ind) => {
                    if (column.type === 'display') {
                      return (
                        <td
                          key={column.label}
                          className={cn('px-2 py-2', ind !== columns.length - 1 && 'border-r')}
                        >
                          <div className="w-full h-full flex flex-row justify-center items-center">
                            {column.component(row)}
                          </div>
                        </td>
                      );
                    }

                    if (column.type === 'radio') {
                      return (
                        <td
                          key={column.label}
                          className={cn('px-2 py-2', ind !== columns.length - 1 && 'border-r')}
                        >
                          <div className="w-full h-full flex flex-row justify-center items-center">
                            <RadioGroup.Item value={column.value} />
                          </div>
                        </td>
                      );
                    }
                  })}
                </HeadlessRadioGroup>
              );
            })}
          </tbody>
        </table>
      )}
    />
  );
}

export default RadioTableItem;
