import Modal from '@/modules/modal/ui/modal';
import type { PatientRecord } from '@mono/telenutrition/lib/types';
import { Trans, useTranslation } from 'react-i18next';
import FormStep, { ChangeProviderFormFields } from './steps/form';
import ConfirmStep from './steps/confirm';
import MultiStepForm, { useMultiStepForm } from '@/modules/multi-step-form';
import { useModal } from '@/modules/modal';
import usePostProviderRequestPatientChangeProvider from 'api/provider/usePostProviderRequestPatientChangeProvider';
import useToaster from 'hooks/useToaster';
import useMemberHelpers from '@/modules/member/useMemberHelpers';

export default function ChangeProviderModal({ patient }: { patient: PatientRecord }) {
  const modal = useModal();
  const toaster = useToaster();
  const { t } = useTranslation();
  const memberHelpers = useMemberHelpers();
  const { post: postRequestPatientChangeProvider } = usePostProviderRequestPatientChangeProvider();
  const multiStepForm = useMultiStepForm<ChangeProviderFormFields>({
    steps: [
      {
        render: () => <FormStep patient={patient} />,
      },
      {
        render: () => <ConfirmStep patient={patient} />,
      },
    ],
    onComplete: (values, { setIsLoading }) => {
      setIsLoading(true);
      postRequestPatientChangeProvider({
        payload: {
          patientId: patient.patientId,
          note: values.note,
          reason: values.reason,
        },
      })
        .then(() => {
          toaster.success({
            title: t('Your request has been submitted'),
            message: t(
              'You have submitted a request to temporarily change providers {{patientName}}.',
              { patientName: memberHelpers.getDisplayNameForPatient(patient).value },
            ),
          });
        })
        .catch((e) => {
          toaster.apiError({ error: e, title: t('Unable to request provider change for patient') });
        })
        .finally(() => {
          setIsLoading(false);
          modal.closeAll();
        });
    },
  });

  return (
    <MultiStepForm {...multiStepForm}>
      <Modal size="md">
        <Modal.Header title={<Trans>Change provider</Trans>} />
        <Modal.Body>
          <MultiStepForm.Step />
        </Modal.Body>
        <MultiStepForm.BasicFooter
          secondaryButton={{
            onClick: () => {
              modal.closeAll();
            },
            children: <Trans>Cancel</Trans>,
          }}
        />
      </Modal>
    </MultiStepForm>
  );
}
