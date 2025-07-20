import { useEffect } from 'react';
import Loading from '../../../../components/loading';
import { useWorkflowEngineContext } from '../workflow-engine/context';
import { useModalManager } from '../../../modal/manager';
import { ErrorIcon } from '../../../modal/icons';
import { ApiRequestError, DeveloperError } from '../../../../utils/errors';
import { StepData } from '../workflow-engine/types';
import useApiClient from '../../../../api/client';
import { useTranslation } from 'react-i18next';

interface FlowApiStepProps {
  stepData: StepData;
}

export default function FlowApiStep({ stepData }: FlowApiStepProps) {
  const api = useApiClient();
  const { step } = stepData;
  if (step.type !== 'api')
    throw new DeveloperError('Can only use FlowApiStep with proper step data');

  const { t } = useTranslation();
  const modalManager = useModalManager();
  const { getFlowStateValuesFlat, restartAndReset, handleNext } = useWorkflowEngineContext();
  const { i18n } = useTranslation();

  useEffect(() => {
    const { method, path } = step;
    if (method === 'post') {
      api
        .post(
          path,
          // always send nested in "state" obj
          { state: getFlowStateValuesFlat() },
          {
            headers: {
              ...(i18n.language ? { 'Accept-Language': i18n.language } : {}),
            },
          },
        )
        .then(async (res) => {
          if (!res.meta.ok) {
            throw new ApiRequestError(
              'Failed Request',
              res.meta.error,
              res.meta.trace,
              res.meta.extra,
            );
          }
          handleNext(res.data as Record<string, string>);
        })
        .catch((e) => {
          console.log('error posting', e);
          modalManager.handleApiError({
            error: e,
            subtitle: t('ErrorWithYourRequest', 'There was an error with your request'),
            buttons: {
              children: 'Restart',
              onClick: () => {
                restartAndReset();
                modalManager.closeModal();
              },
            },
          });
        });
    }
  }, []);

  return <Loading />;
}
