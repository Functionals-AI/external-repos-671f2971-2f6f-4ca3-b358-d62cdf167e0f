import Modal from '@/modules/modal/ui/modal';
import { useModal } from '../..';
import * as Steps from './steps';
import useToaster from 'hooks/useToaster';
import { ScheduleInfoFields } from './steps/schedule-info';
import MultiStepForm, { useMultiStepForm } from '@/modules/multi-step-form';
import usePostProviderAppointments from 'api/provider/usePostProviderAppointments';
import { ScheduleSessionModalData } from '../../types';
import { useAppStateContext } from 'state/context';
import { DeveloperError } from 'utils/errors';
import { Trans, useTranslation } from 'react-i18next';
import { SessionDuration, SessionType } from 'types/globals';
import useMemberHelpers from '@/modules/member/useMemberHelpers';

type ScheduleSessionModalState = ScheduleInfoFields;

export default function ScheduleSessionModal({
  dateDisplay,
  timeDisplay,
  dateTime,
  ...modalData
}: ScheduleSessionModalData) {
  const modal = useModal();
  const toaster = useToaster();
  const { getAppState } = useAppStateContext();
  const { t } = useTranslation();
  const memberHelpers = useMemberHelpers();

  const { post: postProviderAppointments } = usePostProviderAppointments();

  const multiStepForm = useMultiStepForm<ScheduleSessionModalState>({
    steps: [
      {
        name: 'Info',
        render: () => (
          <Steps.ScheduleInfo
            appointmentIds={modalData.appointmentIds}
            dateDisplay={dateDisplay}
            timeDisplay={timeDisplay}
            dateTime={dateTime}
          />
        ),
      },
      {
        name: 'Confirm',
        render: () => <Steps.Review timeDisplay={timeDisplay} dateTime={dateTime} />,
      },
    ],
    onComplete: (values, { setIsLoading }) => {
      setIsLoading(true);

      let appointmentIds: number[];
      if (values.duration === SessionDuration.Thirty) {
        appointmentIds = [modalData.appointmentIds.primary];
      } else {
        if (!modalData.appointmentIds.secondary)
          throw new DeveloperError(
            'You must have secondary appointmentID to schedule 60 minute appointment',
          );

        appointmentIds = [modalData.appointmentIds.primary, modalData.appointmentIds.secondary];
      }

      postProviderAppointments({
        payload: {
          state: {
            cid: getAppState().cid!,
            patient_id: values.patient.patientId,
            appointment_ids: appointmentIds,
            audio_only: values.sessionType === SessionType.AudioOnly,
          },
        },
      })
        .then(() =>
          toaster.success({
            title: 'Session scheduled',
            message: (
              <>
                <p>
                  <Trans>Your session has been scheduled</Trans>:
                </p>
                <p>
                  <Trans>Member</Trans>:{' '}
                  {memberHelpers.getDisplayNameForPatient(values.patient).value}
                </p>
                <p>
                  <Trans>Duration</Trans>:{' '}
                  {`${t('{{minutes}} minutes', { minutes: values.duration })}`}
                </p>
                <p>
                  <Trans>Date</Trans>: {dateDisplay}
                </p>
                <p>
                  <Trans>Time</Trans>: {timeDisplay}
                </p>
              </>
            ),
          }),
        )
        .catch((e) =>
          toaster.apiError({
            title: t('Error scheduling session'),
            error: e,
          }),
        )
        .finally(() => modal.closeAll());
    },
  });

  return (
    <Modal size="md" panelClassName="overflow-visible">
      <MultiStepForm {...multiStepForm}>
        <Modal.Header title={<Trans>Schedule session</Trans>} />
        <Modal.Body className="overflow-visible">
          <MultiStepForm.Step />
        </Modal.Body>
        <MultiStepForm.BasicFooter
          secondaryButton={{
            children: t('Cancel'),
            variant: 'secondary',
            onClick: () => {
              modal.openSecondary({
                type: 'basic-dialog',
                title: t('Discard changes?'),
                body: t(
                  'Changes will not be saved. Are you sure you want to discard these changes?',
                ),
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
