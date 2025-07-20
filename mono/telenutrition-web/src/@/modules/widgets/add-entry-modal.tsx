import { FormV2, useForm } from '@/modules/form/form';
import { FormTableItemEntry } from '@/modules/form/form-table-item';
import Modal from '@/modules/modal/ui/modal';
import { Button } from '@/ui-components/button';
import { FieldValues } from 'react-hook-form';
import type { QuestionWidget } from '@mono/telenutrition/lib/types';
import { useSpecificModalContext } from '../modal/context';
import { Trans } from 'react-i18next';
import { getWidgetReactKey } from './helpers';
import { v4 as uuidv4 } from 'uuid';
import RenderQuestionWidget from '@/features/provider/patient/session/charting/render-question-widget';

export default function AddEntryModal<DataType extends FieldValues>({
  onAddEntry,
  addEntryModal,
}: {
  addEntryModal: { title: string; widgets: QuestionWidget[] };
  onAddEntry: (newEntry: FormTableItemEntry<DataType>) => void;
}) {
  const form = useForm();
  const specificModalContext = useSpecificModalContext();

  return (
    <Modal size="sm">
      <FormV2
        form={form}
        onSubmit={(values) => {
          onAddEntry({ value: values as DataType, key: uuidv4() });
        }}
      >
        <Modal.Header title={addEntryModal.title} />
        <Modal.Body className="flex flex-col gap-y-4">
          {addEntryModal.widgets.map((widget) => (
            <RenderQuestionWidget key={getWidgetReactKey(widget)} widget={widget} form={form} />
          ))}
        </Modal.Body>
        <Modal.Footer className="justify-end">
          <Modal.Footer.ButtonGroup>
            <Button
              variant="secondary"
              onClick={() => {
                specificModalContext.closeModal();
              }}
            >
              <Trans>Discard</Trans>
            </Button>
            <Modal.Footer.PrimaryButton>
              <Trans>Save</Trans>
            </Modal.Footer.PrimaryButton>
          </Modal.Footer.ButtonGroup>
        </Modal.Footer>
      </FormV2>
    </Modal>
  );
}
