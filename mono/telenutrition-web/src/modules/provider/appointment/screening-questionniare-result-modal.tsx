import { useSpecificModalContext } from '@/modules/modal/context';
import Modal from '@/modules/modal/ui/modal';
import { Button } from '@/ui-components/button';
import { DeterminedScreeningQuestionnaire } from 'api/provider/useFetchProviderAppointmentDetail';
import { useTranslation } from 'react-i18next';
import { Trans } from 'react-i18next';

export default function ScreeningQuestionnaireResultModal({
  data,
}: {
  data: DeterminedScreeningQuestionnaire;
}) {
  const specificModal = useSpecificModalContext();
  const { t } = useTranslation();

  return (
    <Modal size="md">
      <Modal.Header title={t('{{title}} Results', { title: data.title })} />
      <Modal.Body className="flex flex-col gap-y-4">
        <h4 className="heading-s">{data.determination.title}</h4>
        {data.determination.sections.map((section) => (
          <div key={section.title} className="flex flex-col gap-y-2">
            <h4 className="heading-xs">{section.title}</h4>
            <p className="text-base">{section.text}</p>
          </div>
        ))}
      </Modal.Body>
      <Modal.Footer className="justify-end">
        <Modal.Footer.ButtonGroup>
          <Button onClick={() => specificModal.closeModal()}>
            <Trans>Ok</Trans>
          </Button>
        </Modal.Footer.ButtonGroup>
      </Modal.Footer>
    </Modal>
  );
}
