import FlowDataStep from '../../flow-engine/flow-step/flow-data-step';
import { useWorkflowEngineContext } from '../../flow-engine/workflow-engine/context';
import { useAppStateContext } from '../../../../state/context';
import { ApiRequestError } from '../../../../utils/errors';
import { useModalManager } from '../../../modal/manager';
import { ErrorIcon } from '../../../modal/icons';
import _ from 'lodash';
import usePostAppointments, { PostAppointmentParams } from '../../../../api/usePostAppointments';
import { useTranslation } from 'react-i18next';

declare global {
  interface Window {
    dataLayer?: Record<string, any>[];
  }
}

export default function BookAppointment({ flowId }: { flowId: number }) {
  const { getAppState } = useAppStateContext();
  const { post: postAppointments } = usePostAppointments();
  const { flowStateObj, goBackToStep, restartAndReset, getFlowStateValuesFlat } =
    useWorkflowEngineContext();
  const modalManager = useModalManager();
  const { t } = useTranslation();

  const bookAppointment = async () => {
    window.dataLayer?.push({
      event: 'scheduled_appointment-form_submission',
    });

    const flow = getFlowStateValuesFlat() as PostAppointmentParams;
    return postAppointments({
      payload: {
        flow,
        flowId,
        cid: getAppState().cid!,
      },
    }).then(({ data }) => ({ bookedAppointment: data.appointment }));
  };

  const handleError = (e: ApiRequestError) => {
    console.log('error booking appointment:', e);
    if (e.code === 'booked') {
      const isNotFirstBooking = !!flowStateObj.bookedAppointment;
      if (isNotFirstBooking) {
        modalManager.openModal({
          type: 'Error',
          code: e.code,
          title: t('ErrorBookingAdditionalAppointment', 'Error booking additional appointment'),
          subtitle: t('PleaseContactSupport', 'Please contact support'),
        });
        return;
      }
      modalManager.openBookingErrorModal({
        error: e,
        onChangeAppointmentClick: () => goBackToStep('calendar'),
      });
      return;
    }

    let errorMessage = 
      t(
        'ErrorWhileBookingYourAppointment',
        'There was an error while booking your appointment. Please try again or contact support.',
      );
    switch(e.code) {
      case 'invalid-payment':
        errorMessage = t('InvalidPaymentMethodForAppointment', 'The payment method that you selected is invalid for this appointment you selected.');
        break;
      case 'visit-limit-reached':
        errorMessage = t('VisitLimitReachedPaymentMethod', 'Covered visit limit has been reached. If this is an error, please contact support or reach out to your plan with questions.');
        break;
    }

    modalManager.openModal({
      type: 'Custom',
      title: t('ErrorBookingAppointment', 'Error booking appointment'),
      prohibitClose: true,
      content: errorMessage,
      icon: <ErrorIcon />,
      buttons: [
        {
          children: t('Support', 'Support'),
          onClick: () => {
            window.open('https://zipongosupport.zendesk.com/hc/en-us', '_blank');
          },
        },
        {
          children: t('Restart', 'Restart'),
          onClick: () => {
            restartAndReset();
            modalManager.closeModal();
          },
        },
      ],
    });
  };

  return <FlowDataStep fn={bookAppointment} onError={handleError} />;
}
