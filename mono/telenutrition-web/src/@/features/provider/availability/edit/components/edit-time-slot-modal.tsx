import { FormV2, useForm } from '@/modules/form/form';
import Modal from '@/modules/modal/ui/modal';
import DataDisplay from '@/ui-components/data-display';
import Section from '@/ui-components/section';
import { Trans, useTranslation } from 'react-i18next';

type EditTimeSlotFormValues = {
  status: 'available' | 'blocked';
};

interface EditTimeSlotModalProps {
  onSubmit: (values: EditTimeSlotFormValues) => void;
}

export default function EditTimeSlotModal({ onSubmit }: EditTimeSlotModalProps) {
  const { t } = useTranslation();
  const form = useForm<EditTimeSlotFormValues>();

  function handleSubmit(values: EditTimeSlotFormValues) {
    onSubmit(values);
  }

  return (
    <Modal size="md">
      <FormV2 form={form} onSubmit={handleSubmit}>
        <Modal.Header title={<Trans>Edit time slot</Trans>} />
        <Modal.Body>
          <Section title={t('Time Slot')}>
            <FormV2.FormButtonToggle
              form={form}
              id="status"
              className="w-full"
              options={[
                { value: 'available', name: t('Available'), iconName: 'check' },
                { value: 'blocked', name: t('Frozen'), iconName: 'check' },
              ]}
            />
            <div className="grid grid-cols-2">
              <DataDisplay label="Date" content={t('some date')} />
              <DataDisplay label="Time" content={t('some time')} />
            </div>
          </Section>
        </Modal.Body>
        <Modal.Footer className="justify-end">
          <Modal.Footer.ButtonGroup>
            <Modal.Footer.SecondaryCloseButton>{t('Cancel')}</Modal.Footer.SecondaryCloseButton>
            <Modal.Footer.PrimaryButton>{t('Add')}</Modal.Footer.PrimaryButton>
          </Modal.Footer.ButtonGroup>
        </Modal.Footer>
      </FormV2>
    </Modal>
  );
}
