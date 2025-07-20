import usePostDelegateSendConsents from '../../../../api/usePostDelegateSendConsents';
import FlowTransition from '../../../../components/layouts/basic/transition';
import Wizard from '../../../../components/wizard';
import WizardSteps from '../../../../components/wizard/wizard-steps';
import { EmailXOrPhone } from '../../../../hooks/useGetEmailPhoneFromQuery';
import InstructPatient from './instruct-patient';
import SendConsents from './send-consents';

interface DelegateConsentWizardProps {
  onComplete: () => void;
}

export default function DelegateConsentWizard({ onComplete }: DelegateConsentWizardProps) {
  const { post: postDelegateSendConsents, data } = usePostDelegateSendConsents();

  return (
    <Wizard
      flowName="delegate-consent"
      start="send-consents"
      steps={{
        'send-consents': {
          render: ({ goTo }) => (
            <SendConsents
              onSkipStep={onComplete}
              onSubmit={(values) => {
                return postDelegateSendConsents({ payload: values }).then(() => {
                  goTo('instruct-patient');
                });
              }}
            />
          ),
        },
        'instruct-patient': {
          render: ({ goTo }) => (
            <InstructPatient
              onBack={() => goTo('send-consents')}
              onContinue={() => {
                onComplete();
              }}
            />
          ),
        },
      }}
      initialState={{} as EmailXOrPhone}
    >
      {({ currStepKey }) => (
        <FlowTransition transitionKey={currStepKey}>
          <WizardSteps />
        </FlowTransition>
      )}
    </Wizard>
  );
}
