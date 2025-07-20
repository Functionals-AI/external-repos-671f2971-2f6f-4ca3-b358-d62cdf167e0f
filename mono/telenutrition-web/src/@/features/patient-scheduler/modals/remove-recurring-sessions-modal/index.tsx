import { useTranslation } from 'react-i18next';
import { FormV2, useForm } from '@/modules/form/form';
import { useModal } from '@/modules/modal';
import Modal from '@/modules/modal/ui/modal';
import { Button } from '@/ui-components/button';
import ButtonBar from '@/ui-components/button/group';
import RadioGroup from '@/ui-components/radio-and-checkbox/radio';
import { RemoveRecurringType } from '../../types';

interface RemoveRecurringSessionsFields {
  removeType: RemoveRecurringType;
}

interface RemoveRecurringSessionsModalProps {
  onSubmit: (values: RemoveRecurringSessionsFields) => void;
}

export default function RemoveRecurringSessionsModal({
  onSubmit,
}: RemoveRecurringSessionsModalProps) {
  const { t } = useTranslation();
  const modal = useModal();
  const form = useForm<RemoveRecurringSessionsFields>();

  function handleSubmit(values: RemoveRecurringSessionsFields) {
    onSubmit(values);
  }

  return (
    <Modal size="md">
      <FormV2 form={form} onSubmit={handleSubmit}>
        <Modal.Body className="flex flex-col gap-y-4">
          <h3 className="text-2xl">{t('Remove session?')}</h3>
          <RadioGroup
            label={t('Do you want to remove this session or recurring sessions?')}
            id="removeType"
            form={form}
          >
            <RadioGroup.Item
              title={t('Just this session')}
              value={RemoveRecurringType.JustThisSession}
            />
            <RadioGroup.Item
              title={t('This and following sessions')}
              value={RemoveRecurringType.ThisAndFollowing}
            />
            <RadioGroup.Item title={t('All sessions')} value={RemoveRecurringType.AllSessions} />
          </RadioGroup>
        </Modal.Body>
        <Modal.Footer borderTop={false} className="justify-end !pt-2">
          <ButtonBar.Group>
            <Button theme="destructive" variant="secondary" onClick={() => modal.closeAll()}>
              {t('Go back')}
            </Button>
            <Button type="submit" theme="destructive">
              {t('Yes')}
            </Button>
          </ButtonBar.Group>
        </Modal.Footer>
      </FormV2>
    </Modal>
  );
}
