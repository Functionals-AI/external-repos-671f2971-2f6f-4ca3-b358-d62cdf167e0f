import CheckboxList from '@/modules/form/checkbox-list';
import { FormV2, useForm } from '@/modules/form/form';
import SelectFormItem from '@/modules/form/select-item';
import Modal from '@/modules/modal/ui/modal';
import { DAYS, VALID_TIMESLOTS, getValidEndTimeslots } from '../utils';
import { BaseWorkingDays, BreakData } from '../steps/general-settings';
import { Trans, useTranslation } from 'react-i18next';

type AddBreakFormValues = BreakData;

interface AddBreakModalProps {
  baseWorkingDays: BaseWorkingDays;
  onSubmit: (values: AddBreakFormValues) => void;
}

export default function AddBreakModal({ onSubmit, baseWorkingDays }: AddBreakModalProps) {
  const form = useForm<AddBreakFormValues>();
  const { t } = useTranslation();

  function handleSubmit(values: AddBreakFormValues) {
    onSubmit(values);
  }

  const values = form.getValues();

  return (
    <Modal size="sm">
      <FormV2 form={form} onSubmit={handleSubmit}>
        <Modal.Header title={<Trans>Add break</Trans>} />
        <Modal.Body className="flex flex-col gap-6">
          <CheckboxList
            label={t('Select day(s) to assign break')}
            form={form}
            id="breakDays"
            rules={{ required: true }}
            options={DAYS.map((day) => {
              const isAllowed = baseWorkingDays[day] === true;
              return { label: day, value: day, disabled: !isAllowed };
            })}
          />
          <div className="inline-flex gap-x-2 w-full">
            <SelectFormItem
              className="flex-1"
              id="breakStartTime"
              form={form}
              label={t('Daily start time')}
              options={VALID_TIMESLOTS}
              rules={{ required: true }}
            />
            <SelectFormItem
              className="flex-1"
              id="breakEndTime"
              form={form}
              label={t('Daily end time')}
              rules={{ required: true }}
              disabled={!values.breakStartTime}
              options={getValidEndTimeslots(values.breakStartTime)}
            />
          </div>
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
