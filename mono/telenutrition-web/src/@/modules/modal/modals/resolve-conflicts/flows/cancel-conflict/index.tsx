import React from 'react';
import { AppointmentRecord } from 'api/types';
import usePutCancelAppointment from 'api/usePutCancelAppointment';
import { useModal } from '@/modules/modal';
import useToaster from 'hooks/useToaster';
import Modal from '@/modules/modal/ui/modal';
import { Trans, useTranslation } from 'react-i18next';
import BasicDialogModal from '../../../basic-dialog';
import useMemberHelpers from '@/modules/member/useMemberHelpers';

interface CancelConflictProps {
  cancelAppointment: AppointmentRecord;
  onSuccess: (cancelId: number) => void;
}

export default function CancelConflict(props: CancelConflictProps) {
  const { t } = useTranslation();
  const { cancelAppointment, onSuccess } = props;
  const { post: putCancelAppointment, data } = usePutCancelAppointment({
    appointmentId: cancelAppointment.appointmentId,
  });
  const modal = useModal();
  const toaster = useToaster();
  const memberHelpers = useMemberHelpers();

  const onCancel = () => {
    putCancelAppointment({
      payload: {
        cancelReason: 'SCHEDULING_ERROR',
      },
    })
      .then(() => {
        onSuccess(cancelAppointment.appointmentId);
        toaster.success({
          title: t('Session cancelled'),
          message: t('Session with {{patient}} on {{date}} has been cancelled.', {
            patient: cancelAppointment.patient
              ? memberHelpers.getDisplayNameForPatient(cancelAppointment.patient).value
              : 'Member',
            date: cancelAppointment.date,
          }),
        });
      })
      .catch((e) =>
        toaster.apiError({
          title: t('Failed to cancel session'),
          error: e,
        }),
      )
      .finally(modal.closeSecondary);
  };

  return (
    <BasicDialogModal
      modal={{
        type: 'basic-dialog',
        title: t('Cancel session?'),
        body: t(
          'If you choose to cancel this session, a notice will be sent to the member and they will be asked to reschedule. Are you sure you want to do this?',
        ),
        primaryButton: {
          text: t('Ok'),
          onClick: () => onCancel(),
        },
        secondaryButton: {
          text: t('Keep session'),
          onClick: () => modal.closeSecondary(),
        },
      }}
      isLoading={data.isSubmitting}
    />
  );

  return (
    <Modal size="md">
      <Modal.Header title={<Trans>Cancel session?</Trans>} />
      <Modal.Body>
        <Trans>
          If you choose to cancel this session, a notice will be sent to the member and they will be
          asked to reschedule. Are you sure you want to do this?
        </Trans>
      </Modal.Body>
      <Modal.Footer className="justify-end">
        <Modal.Footer.ButtonGroup>
          <Modal.Footer.SecondaryCloseButton onClick={() => modal.closeSecondary()}>
            <Trans>Keep session</Trans>
          </Modal.Footer.SecondaryCloseButton>
          <Modal.Footer.PrimaryButton onClick={onCancel} dataTestId="confirm-cancel">
            <Trans>Next</Trans>
          </Modal.Footer.PrimaryButton>
        </Modal.Footer.ButtonGroup>
      </Modal.Footer>
    </Modal>
  );
}
