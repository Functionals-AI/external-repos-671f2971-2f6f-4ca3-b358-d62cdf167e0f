import FormTableItem from '@/modules/form/form-table-item';
import { useModal } from '@/modules/modal';
import { UseFormReturn } from 'react-hook-form';
import type { TableQuestion } from '@mono/telenutrition/lib/types';
import parse from 'html-react-parser';
import { useTranslation } from 'react-i18next';
import { transformDynamic } from './helpers';
import AddEntryModal from './add-entry-modal';

export default function FormTableWidget({
  widget,
  form,
}: {
  widget: TableQuestion;
  form: UseFormReturn;
}) {
  const modal = useModal();
  const { t } = useTranslation();

  function openAddEntryModal() {
    const open = modal.modals?.primary ? modal.openSecondary : modal.openPrimary;
    const close = modal.modals?.primary ? modal.closeSecondary : modal.closeAll;

    open({
      type: 'custom',
      modal: (
        <AddEntryModal
          addEntryModal={widget.addEntryModal}
          onAddEntry={(newEntry) => {
            const existing = form.getValues()[widget.key];

            form.setValue(widget.key, existing ? existing.concat(newEntry) : [newEntry]);
            close();
          }}
        />
      ),
    });
  }

  return (
    <FormTableItem
      form={form}
      id={widget.key}
      label={widget.tableLabel}
      onAddEntry={openAddEntryModal}
      onNoEntriesText={t('No data')}
      renderEntry={(entry) => {
        const { label, sublabel } = widget.renderEntryConfig;

        return (
          <div className="flex flex-col">
            <span className="flex">
              <h4>{parse(transformDynamic(label, entry.value as Record<string, any>))}</h4>
              {/* <Badge LeftIcon="dot" variant={badge.variant}>
                {badge.label}
              </Badge> */}
            </span>
            <p>{parse(transformDynamic(sublabel, entry.value as Record<string, any>))}</p>
          </div>
        );
      }}
    />
  );
}
