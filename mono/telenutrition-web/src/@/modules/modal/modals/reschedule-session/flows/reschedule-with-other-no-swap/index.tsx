import { useModal } from '@/modules/modal';
import Modal from '@/modules/modal/ui/modal';
import MultiStepForm, { useMultiStepForm } from '@/modules/multi-step-form';
import Reschedule, {
  RescheduleWithOtherRescheduleFields,
} from './steps/reschedule';
import Confirm from './steps/confirm';
import { AppointmentRecord } from 'api/types';
import type { ProviderRecord } from '@mono/telenutrition/lib/types';
import { useAppStateContext } from 'state/context';
import useToaster from 'hooks/useToaster';
import { Trans, useTranslation } from 'react-i18next';
import GetErrorDislpay from '@/modules/errors/get-error-display';
import ContainerLoading from '@/ui-components/loading/container-loading';
import useFetchPatientProviders from 'api/useFetchPatientProviders';
import usePutRescheduleAppointment from 'api/usePutRescheduleAppointment';
import usePostProviderRequestReschedule from 'api/provider/usePostProviderRequestReschedule';
import useMemberHelpers from '@/modules/member/useMemberHelpers';

export type RescheduleWithOtherFormFields = RescheduleWithOtherRescheduleFields;

interface RescheduleWithOtherMultiStepFormProps {
  rescheduleAppointment: AppointmentRecord;
  onBack: () => void;
}

interface RescheduleWithOtherMultiStepFormComponentProps {
  rescheduleAppointment: AppointmentRecord;
  onBack: () => void;
  patientProviders: ProviderRecord[];
}

function RescheduleWithOtherMultiStepFormComponent({
  rescheduleAppointment,
  onBack,
  patientProviders,
}: RescheduleWithOtherMultiStepFormComponentProps) {
  const { t } = useTranslation();
  const modal = useModal();
  const toaster = useToaster();
  const { post: putRescheduleAppointment } = usePutRescheduleAppointment();
  const { getAppState } = useAppStateContext();
  const { post: postRequestReschedule } = usePostProviderRequestReschedule();
  const memberHelpers = useMemberHelpers();

  const multiStepForm = useMultiStepForm<RescheduleWithOtherFormFields>({
    steps: [
      {
        render: () => (
          <Reschedule
            patientProviders={patientProviders}
            rescheduleAppointment={rescheduleAppointment}
          />
        ),
      },
      {
        render: () => <Confirm rescheduleAppointment={rescheduleAppointment} />,
      },
    ],
    onComplete: (values, { setIsLoading }) => {
      setIsLoading(true);
      // if (values.rescheduleType === RescheduleType.AnyDietitian) {
      //   postRequestReschedule({
      //     payload: {
      //       rescheduleAppointmentId: rescheduleAppointment.appointmentId,
      //       isAudioOnly: values.appointmentType === SessionType.AudioOnly ? true : false,
      //       duration: values.duration === SessionDuration.Thirty ? 30 : 60,
      //     },
      //   })
      //     .then(() => {
      //       toaster.success({
      //         title: t('Session transferred'),
      //         message: t('Session with {{patientName}} has been transferred.', {
      //           patientName: memberHelpers.getDisplayNameForPatient(rescheduleAppointment.patient!)
      //             .value,
      //         }),
      //       });
      //     })
      //     .catch((e) => {
      //       toaster.apiError({
      //         title: t('Failed to cancel appointment or send request for reschedule'),
      //         error: e,
      //       });
      //     })
      //     .finally(() => {
      //       setIsLoading(false);
      //       modal.closeAll();
      //     });
      // } else if (values.rescheduleType === RescheduleType.SpecificDietitian) {
      // TODO: duration and sessionType can be changed
      putRescheduleAppointment({
        payload: {
          oldAppointmentId: rescheduleAppointment.appointmentId,
          newAppointmentIds: values.newAppointmentIds,
          cid: getAppState().cid!,
          cancelReason: 'PROVIDER_UNAVAILABLE',
        },
      })
        .then(() => {
          toaster.success({
            title: t('Provider switched'),
            message: t(
              `{{patientName}} has been moved to a different provider and the time slot has been Blocked.`,
              {
                patientName: `${rescheduleAppointment.patient?.firstName} ${rescheduleAppointment.patient?.lastName}`,
              },
            ),
          });
        })
        .catch((e) => {
          toaster.apiError({
            title: t('Failed to schedule with another provider'),
            error: e,
          });
        })
        .finally(() => {
          setIsLoading(false);
          modal.closeAll();
        });
      // } else {
      //   throw new DeveloperError('Invalid reschedule type');
      // }
    },
  });

  return (
    <MultiStepForm {...multiStepForm}>
      <Modal.Header title={<Trans>Schedule with another Dietitian</Trans>} />
      <Modal.Body>
        <MultiStepForm.Step />
      </Modal.Body>
      <MultiStepForm.BasicFooter
        initialStepBack={{
          children: <Trans>Back</Trans>,
          onClick: () => onBack(),
        }}
        secondaryButton={{
          children: <Trans>Cancel</Trans>,
          variant: 'secondary',
          onClick: () => {
            modal.openSecondary({
              type: 'basic-dialog',
              title: t('Discard changes?'),
              body: (
                <Trans>
                  Changes will not be saved. Are you sure you want to discard these changes?
                </Trans>
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

export default function RescheduleWithOtherNoSwapMultiStepForm({
  rescheduleAppointment,
  onBack,
}: RescheduleWithOtherMultiStepFormProps) {
  const { data, isLoading, error, refetch } = useFetchPatientProviders(
    rescheduleAppointment.patientId!,
  );

  if (isLoading) return <ContainerLoading />;
  if (error) return <GetErrorDislpay refetch={refetch} error={error} />;

  return (
    <RescheduleWithOtherMultiStepFormComponent
      rescheduleAppointment={rescheduleAppointment}
      onBack={onBack}
      patientProviders={data.providers}
    />
  );
}
