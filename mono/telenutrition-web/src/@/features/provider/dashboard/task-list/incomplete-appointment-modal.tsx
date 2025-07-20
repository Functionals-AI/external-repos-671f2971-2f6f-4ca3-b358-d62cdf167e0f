import { AsBasicDate, AsTime } from '@/modules/dates';
import useMemberHelpers from '@/modules/member/useMemberHelpers';
import { useSpecificModalContext } from '@/modules/modal/context';
import Modal from '@/modules/modal/ui/modal';
import { Button } from '@/ui-components/button';
import DataDisplay from '@/ui-components/data-display';
import Icon from '@/ui-components/icons/Icon';
import Section from '@/ui-components/section';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { AppointmentIncompleteTask } from './types';
import parse from 'html-react-parser';
import { useRouter } from 'next/navigation';

interface IncompleteAppointmentModalProps {
  task: AppointmentIncompleteTask;
}

function IncompleteAppointmentModal({ task }: IncompleteAppointmentModalProps) {
  const specificModal = useSpecificModalContext();
  const memberHelpers = useMemberHelpers();
  const { t } = useTranslation();
  const router = useRouter();

  const { appointment } = task;

  function goToSession() {
    specificModal.closeModal();
    router.push(`/schedule/provider/session/${task.appointment.appointmentId}/meeting`);
  }

  const message = (() => {
    if (task.subtype === 'appointment-missed') {
      return t(
        'Please update the visit. All visits must have either completed charting if the visit occurred or visit must be cancelled with the corrected cancellation reason.',
      );
    }

    if (task.subtype === 'app-encounter-not-finalized') {
      return t('Please finalize and submit charting and billing information.');
    }

    if (task.subtype === 'historical-encounter-not-finalized') {
      return parse(
        t('Please contact {{rdSupportLink}} to submit charting and billing information.', {
          rdSupportLink: `<a href="mailto:RDsupport@foodsmart.com">RDsupport@foodsmart.com</a>`,
        }),
      );
    }

    if (task.subtype === 'physician-review-needs-attention') {
      return appointment.encounter?.oversightComment ?? 'No comment given';
    }
  })();

  return (
    <Modal size="md">
      <Modal.Header title={<Trans>Task details</Trans>} />
      <Modal.Body>
        <Section title={<Trans>Task</Trans>}>
          <span className="inline-flex gap-x-2 items-center">
            <h4 className="heading-xxs">
              {task.subtype === 'physician-review-needs-attention' ? (
                <Trans>Physician Review needs attention</Trans>
              ) : (
                <Trans>Appointment Incomplete</Trans>
              )}
            </h4>
            <Icon
              color={
                ['appointment-missed', 'physician-review-needs-attention'].includes(task.subtype)
                  ? 'statusRed'
                  : 'statusAmber'
              }
              size="sm"
              name="flag---filled"
            />
          </span>
          <DataDisplay label={<Trans>Note</Trans>} content={message} />
          {['app-encounter-not-finalized', 'appointment-missed'].includes(task.subtype) && (
            <Button
              className="w-fit"
              onClick={() => goToSession()}
              theme="primary"
              variant="primary"
            >
              <Trans>Go to session</Trans>
            </Button>
          )}
        </Section>
        <Section.Divider />
        <Section title={<Trans>Session detail</Trans>}>
          <DataDisplay
            label={<Trans>Member</Trans>}
            content={memberHelpers.getDisplayNameFromAppointment({ appointment })}
          />
          <DataDisplay
            label={<Trans>Date</Trans>}
            content={<AsBasicDate format="full">{appointment.startTimestamp}</AsBasicDate>}
          />
          <DataDisplay
            label={<Trans>Time</Trans>}
            content={<AsTime>{appointment.startTimestamp}</AsTime>}
          />
        </Section>
      </Modal.Body>
      <Modal.Footer className="justify-end">
        <Modal.Footer.ButtonGroup>
          {task.subtype === 'physician-review-needs-attention' && (
            <Button variant="secondary" onClick={() => goToSession()}>
              <Trans>Go to chart</Trans>
            </Button>
          )}
          <Button onClick={() => specificModal.closeModal()}>
            <Trans>Close</Trans>
          </Button>
        </Modal.Footer.ButtonGroup>
      </Modal.Footer>
    </Modal>
  );
}

export default IncompleteAppointmentModal;
