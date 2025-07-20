import { FormV2, useForm } from '@/modules/form/form';
import Modal from '@/modules/modal/ui/modal';
import { HolidayData, HolidayRepeatType } from '../steps/general-settings';
import { Trans, useTranslation } from 'react-i18next';

type AddHolidayFormValues = HolidayData;

interface AddHolidayModalProps {
  onSubmit: (values: AddHolidayFormValues) => void;
}

export default function AddHolidayModal({ onSubmit }: AddHolidayModalProps) {
  const { t } = useTranslation();
  const form = useForm<AddHolidayFormValues>();

  function handleSubmit(values: AddHolidayFormValues) {
    onSubmit(values);
  }

  return (
    <Modal size="sm">
      <FormV2 form={form} onSubmit={handleSubmit}>
        <Modal.Header title={<Trans>Add holiday</Trans>} />
        <Modal.Body className="flex flex-col items-center">
          <FormV2.FormDateItem form={form} id="date" />
          <FormV2.FormSelectItem
            className="w-full"
            label="Repeats"
            form={form}
            rules={{ required: true }}
            id="repeatType"
            options={[
              {
                label: t('Never'),
                value: HolidayRepeatType.NONE,
              },
            ]}
          />
        </Modal.Body>
        <Modal.Footer className="justify-end">
          <Modal.Footer.ButtonGroup>
            <Modal.Footer.SecondaryCloseButton>{t('Cancel')}</Modal.Footer.SecondaryCloseButton>
            <Modal.Footer.PrimaryButton disabled={!form.formState.isValid}>
              {t('Add')}
            </Modal.Footer.PrimaryButton>
          </Modal.Footer.ButtonGroup>
        </Modal.Footer>
      </FormV2>
    </Modal>
  );
}
