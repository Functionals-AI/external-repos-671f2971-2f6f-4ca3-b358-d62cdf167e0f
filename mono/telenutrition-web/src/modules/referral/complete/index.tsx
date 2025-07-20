import { useRouter } from 'next/router';
import usePatchAccount from '../../../api/account/usePatchUpdateAccount';
import FlowTransition from '../../../components/layouts/basic/transition';
import Wizard from '../../../components/wizard';
import WizardSteps from '../../../components/wizard/wizard-steps';
import { useAppStateContext } from '../../../state/context';
import { ApiRequestError, DeveloperError } from '../../../utils/errors';
import SetPasswordForm from '../../forms/set-password';
import CreateUserFromReferral from './create-user-from-referral';
import { useModalManager } from '../../modal/manager';
import { useTranslation } from 'react-i18next';

type CompleteReferralWizardState = {
  flowId?: number;
};

interface CompleteReferralWizardProps {
  code?: string;
}

export default function CompleteReferralWizard({ code }: CompleteReferralWizardProps) {
  const { dispatch, getAppState } = useAppStateContext();
  const { post: patchAccount } = usePatchAccount();
  const router = useRouter();
  const modalManager = useModalManager();
  const { t } = useTranslation();

  return (
    <Wizard
      flowName="complete_referral_flow"
      initialState={{} as CompleteReferralWizardState}
      steps={{
        create_user_from_referral: {
          render: ({ goTo }) => (
            <CreateUserFromReferral
              code={code}
              onSuccess={(values) => {
                goTo('set_password', { updateState: (s) => ({ ...s, flowId: values.flowId }) });
              }}
            />
          ),
        },
        set_password: {
          render: ({ formState, fireFinalAnalyticEvent }) => {
            const isLoggedIn = getAppState().auth?.loggedIn;
            const { flowId } = formState;

            if (!flowId) throw new DeveloperError('Flow Id must be set');
            if (!isLoggedIn) throw new DeveloperError('User must be logged in to set password');

            return (
              <SetPasswordForm
                onSubmit={async (values) => {
                  return patchAccount({ payload: { password: values.password } })
                    .then(({ data }) => {
                      fireFinalAnalyticEvent({ ...formState, userId: data.userId });

                      dispatch({ type: 'APP_USER_FETCHED', payload: data });
                      router.push(`/schedule/flow/schedule?flow_id=${flowId}`);
                    })
                    .catch((error: ApiRequestError) => {
                      modalManager.handleApiError({
                        error,
                        subtitle: t(
                          'ThereWasAnErrorSettingYourPassword',
                          'There was an error setting your password',
                        ),
                      });
                    });
                }}
              />
            );
          },
        },
      }}
      start="create_user_from_referral"
    >
      <FlowTransition>
        <WizardSteps />
      </FlowTransition>
    </Wizard>
  );
}
