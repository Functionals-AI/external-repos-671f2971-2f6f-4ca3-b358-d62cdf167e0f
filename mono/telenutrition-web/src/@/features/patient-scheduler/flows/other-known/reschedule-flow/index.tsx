import { Trans, useTranslation } from 'react-i18next';
import { DateTime } from 'luxon';

import useToaster from 'hooks/useToaster';
import type { PatientRecord, ProviderRecordShort } from '@mono/telenutrition/lib/types';
import { AppointmentRecord } from 'api/types';
import MultiStepForm, { useMultiStepForm } from '@/modules/multi-step-form';
import { useModal } from '@/modules/modal';
import ConfirmStep from './confirm-step';
import { AppointmentData } from 'api/useGetAppointments';
import { AsTime } from '@/modules/dates';
import usePutRescheduleAppointment from 'api/usePutRescheduleAppointment';
import { AppointmentCancelReason } from 'api/usePutCancelAppointment';
import useMemberHelpers from '@/modules/member/useMemberHelpers';
import SelectAppointmentStep from '../shared/select-appointment-step';
import Modal from '@/modules/modal/ui/modal';
import { useAppStateContext } from 'state/context';

export interface RescheduleWithOtherKnownProviderFormFields {
  patient: PatientRecord;
  date: string;
  selectedAppointmentData: AppointmentData;
  selectedProvider: ProviderRecordShort;
  cancelReason: AppointmentCancelReason;
  confirmMemberInformed: boolean;
  appointmentTime: string | null;
}
export default function RescheduleFlow({
  patient,
  rescheduleAppointment,
}: {
  patient: PatientRecord;
  rescheduleAppointment: AppointmentRecord;
}) {
  const { getAppState } = useAppStateContext();
  const { t } = useTranslation();
  const modal = useModal();
  const memberHelpers = useMemberHelpers();

  const toaster = useToaster();
  const { post: putRescheduleAppointment } = usePutRescheduleAppointment();

  const multiStepForm = useMultiStepForm<RescheduleWithOtherKnownProviderFormFields>({
    defaultValues: {
      patient,
      appointmentTime: null,
    },
    steps: [
      {
        render: () => (
          <SelectAppointmentStep
            patient={patient}
            rescheduleAppointment={rescheduleAppointment}
            hideOptions
          />
        ),
      },
      {
        render: () => (
          <ConfirmStep patient={patient} rescheduleAppointment={rescheduleAppointment} />
        ),
      },
    ],
    onComplete: async (values, { setIsLoading }) => {
      setIsLoading(true);
      putRescheduleAppointment({
        payload: {
          cid: getAppState().cid!,
          oldAppointmentId: rescheduleAppointment.appointmentId,
          newAppointmentIds: values.selectedAppointmentData.appointmentIds,
          cancelReason: values.cancelReason,
        },
      })
        .then(() => {
          toaster.success({
            title: t('Visit rescheduled'),
            message: (
              <div>
                <p className="mb-2">
                  {t('The visit has been rescheduled with {{rescheduleProviderName}}', {
                    rescheduleProviderName: values.selectedProvider.name,
                  })}
                </p>
                <p>{memberHelpers.getDisplayNameForPatient(patient).value}</p>
                <p>
                  {DateTime.fromISO(values.selectedAppointmentData.startTimestamp).toFormat(
                    'LLL d, yyyy',
                  )}
                </p>
                <AsTime>{values.selectedAppointmentData.startTimestamp}</AsTime>
              </div>
            ),
          });
          modal.closeAll();
        })
        .catch((e) => {
          toaster.apiError({ title: t('Visit not rescheduled'), error: e });
        })
        .finally(() => {
          setIsLoading(false);
        });
    },
  });

  return (
    <MultiStepForm {...multiStepForm}>
      <Modal.Header title={<Trans>Reschedule Visit</Trans>} />
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
