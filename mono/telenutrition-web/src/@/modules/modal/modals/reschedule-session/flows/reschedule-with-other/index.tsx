import { useModal } from '@/modules/modal';
import Modal from '@/modules/modal/ui/modal';
import MultiStepForm, { useMultiStepForm } from '@/modules/multi-step-form';
import Reschedule, { RescheduleFields } from './steps/reschedule';
import Confirm from './steps/confirm';
import { AppointmentRecord } from 'api/types';
import usePutAppointmentSwapProvider from 'api/usePutRescheduleAppointment';
import { useAppStateContext } from 'state/context';
import useToaster from 'hooks/useToaster';
import { Trans, useTranslation } from 'react-i18next';
import {
  UseGetAppointmentSwappableProvidersReturn,
  useFetchAppointmentSwappableProviders,
} from 'api/provider/useGetAppointmentSwappableProvider';
import GetErrorDislpay from '@/modules/errors/get-error-display';
import ContainerLoading from '@/ui-components/loading/container-loading';

export type RescheduleWithOtherFormFields = RescheduleFields;

interface RescheduleWithOtherMultiStepFormProps {
  rescheduleAppointment: AppointmentRecord;
  onBack: () => void;
}

interface RescheduleWithOtherMultiStepFormComponentProps {
  rescheduleAppointment: AppointmentRecord;
  onBack: () => void;
  data: UseGetAppointmentSwappableProvidersReturn;
}

function RescheduleWithOtherMultiStepFormComponent({
  rescheduleAppointment,
  onBack,
  data,
}: RescheduleWithOtherMultiStepFormComponentProps) {
  const { t } = useTranslation();
  const { getAppState } = useAppStateContext();
  const modal = useModal();
  const toaster = useToaster();
  const { post } = usePutAppointmentSwapProvider();

  const multiStepForm = useMultiStepForm<RescheduleWithOtherFormFields>({
    defaultValues: data.recommendedSwap?.provider
      ? {
          providerId: data.recommendedSwap.provider.providerId,
          swappableProvider: data.recommendedSwap,
        }
      : {},
    steps: [
      {
        render: () => <Reschedule data={data} rescheduleAppointment={rescheduleAppointment} />,
      },
      {
        render: () => <Confirm rescheduleAppointment={rescheduleAppointment} />,
      },
    ],
    onComplete: (values, { setIsLoading }) => {
      if (!values.swappableProvider) throw new Error('No swappale providers provided');
      setIsLoading(true);
      post({
        payload: {
          cid: getAppState().cid!,
          oldAppointmentId: rescheduleAppointment.appointmentId,
          newAppointmentIds: values.swappableProvider.appointmentIds,
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

export default function RescheduleWithOtherMultiStepForm({
  rescheduleAppointment,
  onBack,
}: RescheduleWithOtherMultiStepFormProps) {
  const { data, isLoading, error, refetch } = useFetchAppointmentSwappableProviders(
    rescheduleAppointment.appointmentId,
  );

  if (isLoading) return <ContainerLoading />;
  if (error) return <GetErrorDislpay refetch={refetch} error={error} />;

  return (
    <RescheduleWithOtherMultiStepFormComponent
      rescheduleAppointment={rescheduleAppointment}
      onBack={onBack}
      data={data}
    />
  );
}
