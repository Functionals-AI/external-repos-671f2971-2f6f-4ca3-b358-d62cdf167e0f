import { DateTime } from 'luxon';
import { Trans, useTranslation } from 'react-i18next';

import Modal from '@/modules/modal/ui/modal';
import MultiStepForm, { useMultiStepForm } from '@/modules/multi-step-form';
import {
  AppointmentRecord,
  HouseholdMemberSchedulable,
} from 'api/types';
import type { PatientRecord, ProviderRecordShort } from '@mono/telenutrition/lib/types';
import ChooseAppointmentIdStep from './steps/choose-appointment-id';
import { useModal } from '@/modules/modal';
import { AppointmentData } from 'api/useGetAppointments';
import useToaster from 'hooks/useToaster';
import usePutRescheduleAppointment from 'api/usePutRescheduleAppointment';
import { AppointmentCancelReason } from 'api/usePutCancelAppointment';
import useMemberHelpers from '@/modules/member/useMemberHelpers';
import { AsTime } from '@/modules/dates';
import { useAppStateContext } from 'state/context';
import ConfirmRescheduledAppointments from '../../../flows/shared/confirm-rescheduled-appointments';

export interface RescheduleWithOtherUnknownProviderFormFields {
  patient: HouseholdMemberSchedulable;
  date: string;
  selectedAppointmentData: AppointmentData;
  selectedProvider: ProviderRecordShort;
  cancelReason: AppointmentCancelReason;
  confirmMemberInformed: boolean;
}

type RescheduleWithOtherUnknownProviderFlowProps = {
  patient: PatientRecord;
  rescheduleAppointment: AppointmentRecord;
};

export default function RescheduleWithOtherUnknownProviderFlow({
  patient,
  rescheduleAppointment,
}: RescheduleWithOtherUnknownProviderFlowProps) {
  const { getAppState } = useAppStateContext();
  const { t } = useTranslation();
  const { post: putRescheduleAppointment } = usePutRescheduleAppointment();
  const modal = useModal();
  const toaster = useToaster();
  const memberHelpers = useMemberHelpers();

  const multiStepForm = useMultiStepForm<RescheduleWithOtherUnknownProviderFormFields>({
    defaultValues: {
      patient,
    },
    steps: [
      {
        render: () => (
          <ChooseAppointmentIdStep
            patient={patient}
            rescheduleAppointment={rescheduleAppointment}
          />
        ),
      },
      {
        render: () => (
          <ConfirmRescheduledAppointments patient={patient} rescheduleAppointment={rescheduleAppointment} />
        ),
      },
    ],
    onComplete: (values, { setIsLoading }) => {
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
  );
}
