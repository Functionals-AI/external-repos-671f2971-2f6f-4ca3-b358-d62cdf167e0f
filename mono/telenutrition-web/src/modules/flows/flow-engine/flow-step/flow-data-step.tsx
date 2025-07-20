import { useEffect } from 'react';
import Loading from '../../../../components/loading';
import { useWorkflowEngineContext } from '../workflow-engine/context';
import { useModalManager } from '../../../modal/manager';
import { ErrorIcon } from '../../../modal/icons';
import { ApiRequestError } from '../../../../utils/errors';

interface DataStepProps {
  fn: () => Promise<Record<string, any>>;
  onError?: (e: ApiRequestError) => void;
}

export default function DataStep({ fn, onError }: DataStepProps) {
  const { handleNext, restartAndReset } = useWorkflowEngineContext();
  const modalManager = useModalManager();

  useEffect(() => {
    Promise.resolve(fn())
      .then((result) => {
        handleNext(result);
      })
      .catch((e: ApiRequestError) => {
        if (onError) {
          onError(e);
          return;
        }

        // Default handling
        modalManager.openModal({
          type: 'Custom',
          title: 'Error',
          prohibitClose: true,
          icon: <ErrorIcon />,
          buttons: {
            children: 'Restart',
            onClick: () => {
              restartAndReset();
              modalManager.closeModal();
            },
          },
        });
      });
  }, []);

  return <Loading />;
}
