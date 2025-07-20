import { SubmitHandler, useForm } from 'react-hook-form';
import HeaderSubheader from '../../../components/header-subheader';
import usePostAuthReferral from '../../../api/auth/usePostAuthReferral';
import TextInput from '../../../components/form/text-input';
import FlowWidget from '../../flows/flow-engine/widgets/flow-widget';
import Button from '../../../components/button';
import { useTranslation } from 'react-i18next';
import FForm from '../../../components/f-form';
import { ApiRequestError } from '../../../utils/errors';
import { useState } from 'react';
import Alert from '../../../components/alert';
import { useModalManager } from '../../modal/manager';
import SupportButton from '../../../components/support-button';
import { useRouter } from 'next/router';

interface CreateUserFromReferralProps {
  onSuccess: (params: { flowId: number }) => void;
  code?: string;
}

interface CreateUserFromReferralFormFields {
  code: string;
  firstName: string;
  lastName: string;
}

export default function CreateUserFromReferral({ onSuccess, code }: CreateUserFromReferralProps) {
  const form = useForm<CreateUserFromReferralFormFields>({
    mode: 'onChange',
    defaultValues: { code },
  });
  const {
    post: postAuthReferral,
    data: { isSubmitting },
  } = usePostAuthReferral();
  const { t } = useTranslation();
  const [apiError, setApiError] = useState<string | null>(null);
  const modalManager = useModalManager();
  const router = useRouter();

  const onSubmit: SubmitHandler<CreateUserFromReferralFormFields> = (values) => {
    const { firstName, lastName, code } = values;

    postAuthReferral({
      payload: { firstName, lastName, referralCode: code },
    })
      .then(({ data }) => {
        if (!data.flowId) {
          modalManager.openModal({
            type: 'Custom',
            title: t('ErrorGeneratingSchedulingSession', 'Error Generating Scheduling Session'),
            content: (
              <div>
                <p>
                  {t(
                    'WeCouldNotCreateASchedulingSessionBasedOnReferral',
                    'We could not create a scheduling session based on your referral.',
                  )}
                </p>
                <p>
                  {t(
                    'PleaseGoToTheDashboardOrContactSupport',
                    'Please go to the dashboard and schedule from there, or contact support',
                  )}
                </p>
              </div>
            ),
            buttons: [
              <SupportButton key="btn-support" />,
              // Allow dashboard, because if POST is successful, but there is no flowId, the account was created.
              <Button key="btn-dashboard" onClick={() => router.push('/schedule/dashboard')} variant="secondary">
                {t('Dashboard', 'Dashboard')}
              </Button>,
            ],
          });
          return;
        }
        onSuccess({ flowId: data.flowId });
      })
      .catch((e: ApiRequestError) => {
        if (e.code === 'validation') {
          setApiError(
            `${t('Invalid', 'Invalid referral code or name.')} ${
              e.trace ? `Trace ID: ${e.trace}` : ''
            }`,
          );
        } else {
          modalManager.openModal({
            type: 'Error',
            code: e.code,
            trace: e.trace,
            title: t('Error', 'Error'),
            subtitle: t('GeneralError', 'There was an error processing your request'),
          });
        }
      });
  };

  return (
    <FForm {...{ form, onSubmit }}>
      <HeaderSubheader
        header={t(
          'EnterYourReferralCode',
          'Enter your referral code and information to complete your referral.',
        )}
      />
      {apiError && (
        <Alert
          title={t('RequestError', 'Request Error:')}
          subtitle={apiError}
          onClose={() => setApiError(null)}
        />
      )}
      <TextInput
        questionKey="code"
        registerOptions={{ required: true }}
        name={t('Code', 'Code')}
        widget="text"
      />
      <FlowWidget
        getFlowStateDisplayValue={() => null}
        getFlowStateValue={() => null}
        widget={{
          type: 'columns',
          name: 'col1',
          widgets: [
            {
              type: 'text',
              key: 'firstName',
              label: t('FirstName', 'First Name'),
              required: true,
            },
            {
              type: 'text',
              key: 'lastName',
              label: t('LastName', 'Last Name'),
              required: true,
            },
          ],
        }}
      />
      <div className="flex py-4 pr-8 justify-end w-full">
        <Button size="large" loading={isSubmitting} disabled={!form.formState.isValid} type="submit">
          {t('Next', 'Next')}
        </Button>
      </div>
    </FForm>
  );
}
