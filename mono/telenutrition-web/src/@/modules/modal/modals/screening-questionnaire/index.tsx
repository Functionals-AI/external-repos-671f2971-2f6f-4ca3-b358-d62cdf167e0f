import { TakeableScreeningQuestionnaire } from 'api/provider/useFetchProviderAppointmentDetail';
import { useForm } from '@/modules/form/form';
import { Button } from '@/ui-components/button';
import { useModal } from '../..';
import Modal from '@/modules/modal/ui/modal';
import { Trans } from 'react-i18next';
import RenderWidgetGroup from '@/features/provider/patient/session/charting/render-widget-group';
import type { GroupWidget, Widget } from '@mono/telenutrition/lib/types';
import usePostProviderAppointmentQuestionnaire from 'api/provider/usePostProviderAppointmentQuestionnaire';
import useToaster from 'hooks/useToaster';
import WidgetForm from '@/modules/widgets/widget-form';
import { useTranslation } from 'react-i18next';

export interface ScreeningQuestionnaireModalProps {
  appointmentId: number;
  questionnaire: TakeableScreeningQuestionnaire;
  experimental?: boolean;
}

export default function ScreeningQuestionnaireModal({
  appointmentId,
  questionnaire,
  experimental,
}: ScreeningQuestionnaireModalProps) {
  const form = useForm();
  const modal = useModal();
  const toaster = useToaster();
  const { t } = useTranslation();
  const {
    post,
    data: { data, error, isSubmitting },
  } = usePostProviderAppointmentQuestionnaire(appointmentId);

  function onSubmit(formData: Record<string, unknown>) {
    console.log(JSON.stringify(formData));

    post({
      payload: {
        questionnaireType: questionnaire.questionnaireType,
        formData,
        experimental,
      },
    })
      .then(() => {
        modal.closeAll();
        toaster.success({
          title: t('Sucessfully submitted screening questionnaire'),
          message: t(
            `The actions have been updated based on the result of the screening questionnaire`,
          ),
        });
      })
      .catch((e) => {
        toaster.fail({
          title: t('Failed to submit screening questionnaire'),
          message: e.message ?? t('An unknown error occurred.'),
        });
      });
  }

  return (
    <Modal size="xl">
      <WidgetForm
        form={form}
        onSubmit={({ formattedValues }) => onSubmit(formattedValues)}
        className="flex flex-col gap-y-2"
        widgets={questionnaire.widgets.reduce((acc, group) => {
          return [...acc, ...group.widgets];
        }, [] as Widget[])}
      >
        <Modal.Header
          className="w-full"
          title={questionnaire.title}
          subTitle={questionnaire.caption}
        />
        <Modal.Body>
          <div className="flex flex-col gap-y-4">
            {questionnaire.widgets.map((group: GroupWidget) => (
              <RenderWidgetGroup key={group.title} widget={group} form={form} depth={0} />
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer className="w-full justify-end">
          <Modal.Footer.ButtonGroup>
            <Button variant="secondary" onClick={() => modal.closeAll()}>
              <Trans>Cancel</Trans>
            </Button>
            <Button disabled={isSubmitting} type="submit">
              <Trans>Submit</Trans>
            </Button>
          </Modal.Footer.ButtonGroup>
        </Modal.Footer>
      </WidgetForm>
    </Modal>
  );
}
