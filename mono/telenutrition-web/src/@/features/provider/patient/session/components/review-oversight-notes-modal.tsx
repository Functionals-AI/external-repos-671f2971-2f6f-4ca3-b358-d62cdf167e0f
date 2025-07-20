import { useDateHelpers } from '@/modules/dates';
import { useModal } from '@/modules/modal';
import Modal from '@/modules/modal/ui/modal';
import { Button } from '@/ui-components/button';
import TimelineVertical from '@/ui-components/timeline-vertical';
import { AppointmentEncounterRecord } from '@mono/telenutrition/lib/types';
import { Trans, useTranslation } from 'react-i18next';

interface ReviewOversightNotesModalProps {
  encounter: AppointmentEncounterRecord;
}

export default function ReviewOversightNotesModal({ encounter }: ReviewOversightNotesModalProps) {
  const dateHelpers = useDateHelpers();
  const { t } = useTranslation();
  const modal = useModal();
  return (
    <Modal size="md">
      <Modal.Header title={<Trans>Physician oversight notes</Trans>} />
      <Modal.Body>
        <TimelineVertical
          entries={[
            {
              key: 'note',
              content: (
                <div className="flex flex-col gap-y-2">
                  <p>{encounter.oversightComment ?? t('No comment given')}</p>
                  <p className="text-sm text-neutral-600">
                    {`${encounter.oversightBy}`}
                    {encounter.oversightAt &&
                      ` | ${dateHelpers.asBasicDate(encounter.oversightAt, 'LLL d yyyy')} @ ${dateHelpers.asTime(encounter.oversightAt)}`}
                  </p>
                </div>
              ),
            },
          ]}
        />
      </Modal.Body>
      <Modal.Footer className="justify-end">
        <Modal.Footer.ButtonGroup>
          <Button onClick={() => modal.closeAll()}>
            <Trans>Close</Trans>
          </Button>
        </Modal.Footer.ButtonGroup>
      </Modal.Footer>
    </Modal>
  );
}
