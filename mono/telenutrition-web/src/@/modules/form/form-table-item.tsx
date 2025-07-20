import { Button } from '@/ui-components/button';
import Card from '@/ui-components/card';
import { FormField } from '@/ui-components/form/form';
import { ControllerRenderProps, FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { FormItemLabel } from './ui';
import { ReactNode } from 'react';
import { useModal } from '../modal';
import ButtonBar from '@/ui-components/button/group';
import IconButton from '@/ui-components/button/icon';
import { Badge, BadgeProps } from '@/ui-components/badge';
import { Trans, useTranslation } from 'react-i18next';
import Icon from '@/ui-components/icons/Icon';

export type TFormTableItem<Value> = FormTableItemEntry<Value>[];

export type OnAddEntryFn<DataType> = (newEntry: FormTableItemEntry<DataType>) => void;

export type FormTableItemEntry<Value> = {
  value: Value;
  key: string;
};

interface FormTableItemProps<
  Key extends Path<FieldValues>,
  DataType,
  FieldValue extends Array<FormTableItemEntry<DataType>>,
  Values extends FieldValues & { [k in Key]: FieldValue },
> {
  id: Key;
  form: UseFormReturn<Values>;
  label: string;
  onNoEntriesText: ReactNode;
  renderEntry: (entry: FormTableItemEntry<DataType>) => ReactNode;
  onAddEntry: (onAddEntryComplete: OnAddEntryFn<DataType>) => void;
  addText?: string;
  rules?: {
    min?: { value: number; error: string };
    max?: { value: number; error: string };
  };
}

export default function FormTableItem<
  Key extends Path<FieldValues>,
  DataType,
  FieldValue extends Array<FormTableItemEntry<DataType>>,
  Values extends FieldValues & { [k in Key]: FieldValue },
>({
  id,
  form,
  label,
  addText,
  onAddEntry,
  onNoEntriesText,
  rules,
  renderEntry,
}: FormTableItemProps<Key, DataType, FieldValue, Values>) {
  const modal = useModal();
  const { t } = useTranslation();

  function onConfirmDelete(
    entry: FormTableItemEntry<DataType>,
    field: ControllerRenderProps<Values, Path<Values>>,
  ) {
    const values = field.value as FieldValue;

    const openModal = modal.modals?.primary ? modal.openSecondary : modal.openPrimary;
    const closeModal = modal.modals?.primary ? modal.closeSecondary : modal.closeAll;

    openModal({
      type: 'dialog',
      title: t('Delete reading?'),
      body: t('Are you sure you want to delete this reading?'),
      footer: (
        <ButtonBar className="justify-end">
          <ButtonBar.Group>
            <Button onClick={() => closeModal()} theme="destructive" variant="tertiary">
              <Trans>Go back</Trans>
            </Button>
            <Button
              theme="destructive"
              variant="primary"
              onClick={() => {
                field.onChange(values.filter((e) => e.value !== entry.value));
                closeModal();
              }}
            >
              <Trans>Yes</Trans>
            </Button>
          </ButtonBar.Group>
        </ButtonBar>
      ),
    });
  }

  return (
    <FormField
      name={id as unknown as Path<Values>}
      control={form.control}
      rules={{
        validate: (value) => {
          const entries = (value || []) as FieldValue;
          if (rules?.min?.value && entries.length < rules?.min?.value) {
            return rules.min.error;
          }

          return true;
        },
      }}
      render={({ field }) => {
        const values = (field.value || []) as FieldValue;
        const isMaxed = rules?.max && values.length >= rules.max.value;
        const canAdd = isMaxed ? false : true;

        return (
          <div>
            <Card className="w-full">
              <Card.Header className="flex justify-between items-center px-6 border-b-2 border-b-neutral-150">
                <FormItemLabel
                  className="text-base h-8"
                  id={id}
                  label={label}
                  hideOptionalText
                  required={rules?.min?.value && rules?.min?.value > 0 ? true : false}
                />
                <Button
                  disabled={!canAdd}
                  variant="tertiary"
                  size="sm"
                  onClick={() => {
                    onAddEntry((newEntry: FormTableItemEntry<DataType>) => {
                      field.onChange([...values, newEntry]);
                    });
                  }}
                >
                  <Icon name="plus" size="xs" color="fsGreen" /> {addText ?? t('Add')}
                </Button>
              </Card.Header>
              {values.length ? (
                values.map((entry) => (
                  <Card.Row key={String(entry.key)} className="p-4 items-center justify-between">
                    {renderEntry(entry)}
                    <IconButton
                      onClick={() => onConfirmDelete(entry, field)}
                      variant="tertiary"
                      theme="destructive"
                      iconName="trash"
                    />
                  </Card.Row>
                ))
              ) : (
                <Card.Body className="h-20 flex items-center px-8 justify-center">
                  {typeof onNoEntriesText === 'string' ? (
                    <h4 className="text-base">{onNoEntriesText}</h4>
                  ) : (
                    onNoEntriesText
                  )}
                </Card.Body>
              )}
            </Card>
            {isMaxed && <p className="text-status-red-600 ml-2 mt-2">{rules.max?.error}</p>}
          </div>
        );
      }}
    />
  );
}

interface BasicTableRowDisplayProps {
  label: string;
  description: string;
  badges?: BadgeProps[];
}

export function BasicTableRowDisplay({ label, description, badges }: BasicTableRowDisplayProps) {
  return (
    <div className="flex flex-col">
      <span className="flex items-center gap-x-4">
        <h4 className="text-lg text-neutral-1500">{label}</h4>
        {badges?.map((badge) => (
          <Badge {...badge} key={badge.key} />
        ))}
      </span>
      <p className="text-700 text-sm">{description}</p>
    </div>
  );
}
