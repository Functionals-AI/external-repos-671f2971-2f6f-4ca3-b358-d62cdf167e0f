import _ from 'lodash';
import { useWorkflowEngineContext } from '../../flow-engine/workflow-engine/context';
import { useEffect, useState } from 'react';
import EnrollmentChallenge from '../../../../components/enrollment-challenge';
import Loading from '../../../../components/loading';
import usePostPatients from '../../../../api/usePostPatients';
import { ApiRequestError } from '../../../../utils/errors';
import { useModalManager } from '../../../../modules/modal/manager';
import { useTranslation } from 'react-i18next';
import type { InputWidget } from '@mono/telenutrition/lib/types';

export default function AddPatientStep() {
  const { form, handleBack, handleNext, getFlowStateValuesFlat } = useWorkflowEngineContext();

  const {
    post: postPatients,
    data: { isSubmitting },
  } = usePostPatients();
  const [enrollmentChallenge, setEnrollmentChallenge] = useState<InputWidget[]>();
  const state = getFlowStateValuesFlat();
  const modalManager = useModalManager();
  const { t } = useTranslation();

  const showError = (e: Error) =>
    modalManager.handleApiError({
      error: e,
      subtitle: t('ErrorAddingPatient', 'Error adding patient'),
    });

  useEffect(() => {
    postPatients({ payload: { state } })
      .then((res) => handleNext(res.data))
      .catch((e) => {
        if (e instanceof ApiRequestError && e.code === 'verification') {
          const challenge = e.extra?.challenge;
          if (challenge) {
            setEnrollmentChallenge(challenge);
            return;
          }
        }
        showError(e);
      });
  }, []);

  return !enrollmentChallenge ? (
    <Loading />
  ) : (
    <div className="max-w-5xl m-auto px-6 flex flex-col gap-y-4">
    <EnrollmentChallenge
      handleBack={handleBack}
      form={form}
      challenge={enrollmentChallenge}
      loading={isSubmitting}
      handleSubmit={() => {
        const values = form.getValues();
        const payload = {
          state,
          ...(values && { challenge: values }),
        };

        return postPatients({ payload })
          .then((res) => handleNext(res.data))
          .catch((e) => {
            if (e instanceof ApiRequestError) {
              if (e.code === 'verification') {
                const failed: string[] = e.extra?.failed;
                if (!_.isEmpty(failed)) {
                  for (const key of failed) {
                    form.setError(key, { message: 'Verification failed' });
                  }
                  return;
                }
              }
            }
            showError(e);
          });
      }}
    />
    </div>
  );
}
