import { Trans, useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';

import { useModal } from '@/modules/modal';
import Modal from '@/modules/modal/ui/modal';
import { Button } from '@/ui-components/button';
import ButtonBar from '@/ui-components/button/group';
import { OverbookingConfirmationModalData } from '@/modules/modal/types';
import DataDisplay from '@/ui-components/data-display';
import useMemberHelpers from '@/modules/member/useMemberHelpers';
import { useDateHelpers } from '@/modules/dates';
import { cn } from '@/utils';

export default function OverbookingConfirmationModal({
  appointment,
}: OverbookingConfirmationModalData) {
  const { t } = useTranslation();
  const modal = useModal();
  const memberHelpers = useMemberHelpers();
  const dateHelpers = useDateHelpers();
  const router = useRouter();

  let durationText = t('{{minutes}} minute', {
    minutes: appointment.duration,
  });
  if (appointment.isAudioOnly) {
    durationText += t(' (Audio only)');
  }

  return (
    <Modal size="md">
      <Modal.Body className="flex flex-col gap-y-4">
        <h3 className="text-2xl">
          <Trans>Visit successfully scheduled</Trans>
        </h3>
        <div className="mb-2">
          <p>
            <Trans
              defaults="A visit has been scheduled for <bold>{{date}} at {{time}}</bold> with the following member:"
              values={{
                date: dateHelpers.asBasicDate(appointment.startTimestamp, 'full'),
                time: dateHelpers.asTime(appointment.startTimestamp),
              }}
              components={{ bold: <strong /> }}
            />
          </p>
        </div>
        <div>
          <DataDisplay
            label={<Trans>Member</Trans>}
            content={
              <div data-testid="data-display-member">
                {memberHelpers.getDisplayNameFromAppointment({ appointment })}
                <p className={cn('text-neutral-600 text-sm', 'text-sm')}>{appointment.patientId}</p>
              </div>
            }
            className="mb-2"
          />

          <div className="flex items-center gap-x-4 w-full">
            <DataDisplay
              dataTestId="data-display-visit-type"
              label={t('Visit type')}
              content={appointment.appointmentTypeDisplay}
              className="col-span-2"
            />
            <DataDisplay
              dataTestId="data-display-duration"
              label={t('Duration')}
              content={durationText}
            />
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer borderTop={false} className="justify-end !pt-2">
        <ButtonBar.Group>
          <Button
            variant="secondary"
            onClick={() => {
              modal.closeAll();
              router.push(`/schedule/provider/session/${appointment.appointmentId}/meeting`);
            }}
          >
            {t('Go to visit')}
          </Button>
          <Button variant="primary" onClick={() => modal.closeAll()}>
            {t('Done')}
          </Button>
        </ButtonBar.Group>
      </Modal.Footer>
    </Modal>
  );
}
