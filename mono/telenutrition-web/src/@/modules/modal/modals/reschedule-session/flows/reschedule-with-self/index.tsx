import { useModal } from '@/modules/modal';
import Modal from '@/modules/modal/ui/modal';
import MultiStepForm, { useMultiStepForm } from '@/modules/multi-step-form';
import Confirm from './steps/confirm';
import usePutRescheduleAppointment from 'api/usePutRescheduleAppointment';
import { useAppStateContext } from 'state/context';
import useToaster from 'hooks/useToaster';
import { AppointmentRecord } from 'api/types';
import { Trans, useTranslation } from 'react-i18next';
import { useDateHelpers } from '@/modules/dates';
import useMemberHelpers from '@/modules/member/useMemberHelpers';
import RescheduleStep from './steps/reschedule';
import { RescheduleStepFormFields } from '@/features/reschedule-calendar';

export type RescheduleWithSelfFormFields = RescheduleStepFormFields;

interface RescheduleWithSelfMultiStepFormProps {
  rescheduleAppointment: AppointmentRecord;
  onBack: () => void;
}

export default function RescheduleWithSelfMultiStepForm({
  rescheduleAppointment,
  onBack,
}: RescheduleWithSelfMultiStepFormProps) {
  const modal = useModal();
  const { getAppState } = useAppStateContext();
  const { post: putRescheduleAppointment } = usePutRescheduleAppointment();
  const toaster = useToaster();
  const { t } = useTranslation();
  const dateHelpers = useDateHelpers();
  const memberHelpers = useMemberHelpers();

  const multiStepForm = useMultiStepForm<RescheduleWithSelfFormFields>({
    steps: [
      {
        render: () => <RescheduleStep rescheduleAppointment={rescheduleAppointment} />,
      },
      {
        render: () => <Confirm rescheduleAppointment={rescheduleAppointment} />,
      },
    ],
    onComplete: (values, { setIsLoading }) => {
      setIsLoading(true);

      putRescheduleAppointment({
        payload: {
          cid: getAppState().cid!,
          oldAppointmentId: rescheduleAppointment.appointmentId,
          newAppointmentIds: values.newAppointmentIds,
          cancelReason: 'PROVIDER_UNAVAILABLE',
        },
      })
        .then((data) => {
          toaster.success({
            title: t('Session rescheduled'),
            message: t(`Session with {{patient}} has been rescheduled for {{date}}, at {{time}}`, {
              patient: memberHelpers.getDisplayNameFromAppointment({
                appointment: rescheduleAppointment,
              }),
              date: values.date.toFormat('LLL dd, yyyy'),
              time: dateHelpers.asTime(values.timeISO),
            }),
          });
        })
        .catch((e) => toaster.apiError({ title: t('Failure to reschedule session'), error: e }))
        .finally(() => modal.closeAll());
    },
  });

  return (
    <MultiStepForm {...multiStepForm}>
      <Modal.Header title={<Trans>Reschedule session</Trans>} />
      <Modal.Body>
        <MultiStepForm.Step />
      </Modal.Body>
      <MultiStepForm.BasicFooter
        initialStepBack={{
          children: t('Back'),
          onClick: () => onBack(),
        }}
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
                onClick: () => modal.closeSecondary(),
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
