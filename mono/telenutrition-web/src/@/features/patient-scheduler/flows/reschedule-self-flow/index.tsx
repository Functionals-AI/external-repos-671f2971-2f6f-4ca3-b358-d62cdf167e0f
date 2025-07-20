import { Trans, useTranslation } from 'react-i18next';
import { DateTime } from 'luxon';

import { useModal } from '@/modules/modal';
import useMemberHelpers from '@/modules/member/useMemberHelpers';
import useToaster from 'hooks/useToaster';
import usePutRescheduleAppointment from 'api/usePutRescheduleAppointment';
import MultiStepForm, { useMultiStepForm } from '@/modules/multi-step-form';
import { AsTime } from '@/modules/dates';
import ConfirmStep from '../other-known/reschedule-flow/confirm-step';
import { AppointmentRecord } from 'api/types';
import type { PatientRecord, ProviderRecord, ProviderRecordShort } from '@mono/telenutrition/lib/types';
import SelectAppointmentStep from './select-appointment-step';
import { AppointmentData } from 'api/useGetAppointments';
import { AppointmentCancelReason } from 'api/usePutCancelAppointment';
import { TimezoneOption } from '../../components/TimezonePicker';
import { useAppStateContext } from 'state/context';
import Modal from '@/modules/modal/ui/modal';

interface Props {
  patient: PatientRecord;
  rescheduleAppointment: AppointmentRecord;
  provider: ProviderRecord;
}

export interface RescheduleSelfFormFields {
  patient: PatientRecord;
  date: string;
  selectedAppointmentData?: AppointmentData;
  selectedProvider: ProviderRecordShort;
  cancelReason: AppointmentCancelReason;
  confirmMemberInformed: boolean;
  appointmentTime: string | null;
  timezoneDisplay: string;
}

export default function RescheduleSelfFlow({ patient, rescheduleAppointment, provider }: Props) {
  const { getAppState } = useAppStateContext();

  const { t } = useTranslation();
  const modal = useModal();
  const memberHelpers = useMemberHelpers();

  const toaster = useToaster();
  const { post: putRescheduleAppointment } = usePutRescheduleAppointment();

  const multiStepForm = useMultiStepForm<RescheduleSelfFormFields>({
    defaultValues: {
      patient,
      appointmentTime: null,
      selectedProvider: {
        name: 'Myself',
        // only needed for display name
        providerId: 0,
      },
      timezoneDisplay: TimezoneOption.LOCAL,
    },
    steps: [
      {
        render: () => <SelectAppointmentStep patient={patient} provider={provider} rescheduleAppointment={rescheduleAppointment} />,
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
          newAppointmentIds: values.selectedAppointmentData!.appointmentIds,
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
                  {DateTime.fromISO(values.selectedAppointmentData!.startTimestamp).toFormat(
                    'LLL d, yyyy',
                  )}
                </p>
                <AsTime>{values.selectedAppointmentData!.startTimestamp}</AsTime>
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
              body: t('Changes will not be saved. Are you sure you want to discard these changes?'),
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
