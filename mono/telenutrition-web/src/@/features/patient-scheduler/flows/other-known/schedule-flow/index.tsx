import { Trans, useTranslation } from 'react-i18next';
import { DateTime } from 'luxon';

import useToaster from 'hooks/useToaster';
import { HouseholdMemberSchedulable } from 'api/types';
import type { ProviderRecord } from '@mono/telenutrition/lib/types';
import MultiStepForm, { useMultiStepForm } from '@/modules/multi-step-form';
import { useModal } from '@/modules/modal';
import ConfirmStep from './confirm-step';
import { SessionDuration, SessionType } from 'types/globals';
import usePostProviderAppointments from 'api/provider/usePostProviderAppointments';
import { AppointmentData } from 'api/useGetAppointments';
import SelectAppointmentStep from '../shared/select-appointment-step';
import { useAppStateContext } from 'state/context';
import Modal from '@/modules/modal/ui/modal';

export interface ScheduleOtherKnownFormFields {
  patient: HouseholdMemberSchedulable;
  appointmentTime: string | null;
  providerId?: string;
  selectedProvider?: ProviderRecord;
  selectedAppointmentData?: AppointmentData;
  sessionType: SessionType;
  timezoneDisplay: string;
  duration: SessionDuration;
}

export default function ScheduleOtherKnownFlow({
  patient,
}: {
  patient: HouseholdMemberSchedulable;
}) {
  const { getAppState } = useAppStateContext();

  const { t } = useTranslation();
  const modal = useModal();

  const toaster = useToaster();
  const { post: postProviderAppointments } = usePostProviderAppointments();

  const multiStepForm = useMultiStepForm<ScheduleOtherKnownFormFields>({
    defaultValues: {
      patient,
      appointmentTime: null,
    },
    steps: [
      {
        render: () => <SelectAppointmentStep
          patient={patient} />,
      },
      {
        render: () => <ConfirmStep patient={patient} />,
      },
    ],
    onComplete: async (values, { setIsLoading }) => {
      setIsLoading(true);
      postProviderAppointments({
        payload: {
          state: {
            patient_id: patient.patientId,
            appointment_ids: values.selectedAppointmentData!.appointmentIds,
            audio_only: values.sessionType === SessionType.AudioOnly,
            cid: getAppState().cid!,
          },
        },
      })
        .then(() => {
          const dateTime = DateTime.fromISO(values.selectedAppointmentData!.startTimestamp);
          const apptString = `${patient.firstName} ${patient.lastName}
          ${dateTime.toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY)}
          ${dateTime.toLocaleString(DateTime.TIME_SIMPLE)}
          `;

          toaster.success({
            title: t('Visit scheduled'),
            message: `${t('A visit has been scheduled with')} ${values.selectedProvider?.name}
            \n
            ${apptString}
            `,
          });
          modal.closeAll();
        })
        .catch((e) => {
          toaster.apiError({
            title: t('Visit not scheduled'),
            message: t(
              'Something went wrong when trying to schedule the visit, try again or submit an error report.',
            ),
            error: e,
          });
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
          onClick: () => {
            modal.openSecondary({
              type: 'basic-dialog',
              title: t('Discard changes?'),
              body: t('Changes will not be saved. Are you sure you want to discard these changes?'),
              theme: 'destructive',
              secondaryButton: {
                text: t('Go back'),
                onClick: () => modal.closeSecondary(),
              },
              primaryButton: {
                text: t('Discard'),
                onClick: () => {
                  modal.closeAll();
                },
              },
            });
          },
        }}
      />
    </MultiStepForm>
  );
}
