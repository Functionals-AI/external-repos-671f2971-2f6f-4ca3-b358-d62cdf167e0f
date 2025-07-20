import Modal from '@/modules/modal/ui/modal';
import { useModal } from '../..';
import * as Steps from './steps';
import { ChooseReasonFields } from './steps/choose-reason';
import useToaster from 'hooks/useToaster';
import MultiStepForm, { useMultiStepForm } from '@/modules/multi-step-form';
import { CancelSessionModalData } from '../../types';
import usePutCancelAppointment from 'api/usePutCancelAppointment';
import { Trans, useTranslation } from 'react-i18next';
import useMemberHelpers from '@/modules/member/useMemberHelpers';
import { useDateHelpers } from '@/modules/dates';
import { ConfirmCancelFields } from './steps/confirm-cancel';

export type CancelSessionModalFields = ChooseReasonFields & ConfirmCancelFields;

export default function CancelSessionModal({ appointment }: CancelSessionModalData) {
  const modal = useModal();
  const toaster = useToaster();
  const { t } = useTranslation();
  const memberHelpers = useMemberHelpers();
  const dateHelpers = useDateHelpers();

  const { post: putCancelAppointment } = usePutCancelAppointment({
    appointmentId: appointment.appointmentId,
  });

  const multiStepForm = useMultiStepForm<CancelSessionModalFields>({
    steps: [
      { render: () => <Steps.ChooseReason appointment={appointment} /> },
      { render: () => <Steps.ConfirmCancel appointment={appointment} /> },
    ],
    onComplete: (values, { setIsLoading }) => {
      setIsLoading(true);

      putCancelAppointment({ payload: { cancelReason: values.reason } })
        .then(() => {
          toaster.success({
            title: t('Session cancelled'),
            message: t(`Session with {{patient}} on {{date}} has been cancelled.`, {
              patient: memberHelpers.getDisplayNameFromAppointment({ appointment }),
              date: dateHelpers.asBasicDate(appointment.startTimestamp, 'full'),
            }),
          });
          modal.closeAll('success');
        })
        .catch((e) => {
          toaster.apiError({
            title: t('Failed to cancel session'),
            error: e,
          });
          modal.closeAll('error');
        });
    },
  });

  return (
    <Modal size="lg">
      <MultiStepForm {...multiStepForm}>
        <Modal.Header title={<Trans>Cancel Session</Trans>} />
        <Modal.Body>
          <MultiStepForm.Step />
        </Modal.Body>
        <MultiStepForm.BasicFooter
          secondaryButton={{
            children: t('Keep Session'),
            onClick: () => {
              modal.openSecondary({
                type: 'basic-dialog',
                title: t('Discard changes?'),
                body: t('Any changes you have made will not be saved.'),
                theme: 'destructive',
                secondaryButton: {
                  text: t('Go back'),
                  onClick: modal.closeSecondary,
                },
                primaryButton: {
                  text: t('Discard'),
                  onClick: () => modal.closeAll(),
                },
              });
            },
          }}
        />
      </MultiStepForm>
    </Modal>
  );
}
