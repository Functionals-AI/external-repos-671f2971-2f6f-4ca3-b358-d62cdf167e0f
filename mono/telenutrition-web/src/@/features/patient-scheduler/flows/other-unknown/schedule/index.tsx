import Modal from '@/modules/modal/ui/modal';
import MultiStepForm, { useMultiStepForm } from '@/modules/multi-step-form';
import { HouseholdMemberSchedulable } from 'api/types';
import type { PatientRecord, ProviderRecordShort } from '@mono/telenutrition/lib/types';
import { Trans, useTranslation } from 'react-i18next';
import { SessionDuration, SessionType } from 'types/globals';
import ChooseAppointmentIdStep from './steps/choose-appointment-id';
import { useModal } from '@/modules/modal';
import ConfirmStep from './steps/confirm';
import { AppointmentData } from 'api/useGetAppointments';
import usePostProviderAppointments from 'api/provider/usePostProviderAppointments';
import useToaster from 'hooks/useToaster';
import { useAppStateContext } from 'state/context';

export interface ScheduleWithOtherUnknownProviderFormFields {
  patient: HouseholdMemberSchedulable;
  duration: SessionDuration;
  sessionType: SessionType;
  date: string;
  selectedAppointmentData: AppointmentData;
  selectedProvider: ProviderRecordShort;
}

type ScheduleWithOtherUnknownProviderModalProps = {
  patient: PatientRecord;
};

export default function ScheduleWithOtherUnknownProviderFlow({
  patient,
}: ScheduleWithOtherUnknownProviderModalProps) {
  const { getAppState } = useAppStateContext();
  const { t } = useTranslation();
  const { post: postProviderAppointments } = usePostProviderAppointments();
  const modal = useModal();
  const toaster = useToaster();
  const multiStepForm = useMultiStepForm<ScheduleWithOtherUnknownProviderFormFields>({
    defaultValues: {
      patient,
    },
    steps: [
      { render: () => <ChooseAppointmentIdStep patient={patient} /> },
      {
        render: () => <ConfirmStep patient={patient} />,
      },
    ],
    onComplete: (values, { setIsLoading }) => {
      setIsLoading(true);
      postProviderAppointments({
        payload: {
          state: {
            patient_id: patient.patientId,
            appointment_ids: values.selectedAppointmentData.appointmentIds,
            audio_only: values.sessionType === SessionType.AudioOnly,
            cid: getAppState().cid!,
          },
        },
      })
        .then(() => {
          toaster.success({ title: t('Appointment scheduled successfully') });
          modal.closeAll();
        })
        .catch((e) => {
          toaster.apiError({ title: t('Failed to schedule appointment'), error: e });
        })
        .finally(() => {
          setIsLoading(false);
        });
    },
  });

  return (
      <MultiStepForm {...multiStepForm}>
        <Modal.Header title={<Trans>Schedule Visit</Trans>} />
        <Modal.Body>
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
  );1
}
