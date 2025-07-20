import { useTranslation } from "react-i18next";
import EnterVerificationCode from "../../forms/verification-code";
import HeaderSubheader from "../../../components/header-subheader";
import FlowTransition from "../../../components/layouts/basic/transition";
import VerificationMethods from "../../../components/verification-methods";
import type { VerificationMethodRecord } from '@mono/telenutrition/lib/types';
import Wizard from "../../../components/wizard";
import WizardSteps from "../../../components/wizard/wizard-steps";
import { EmailXOrPhone } from "../../../hooks/useGetEmailPhoneFromQuery";

interface PatientVerificationWizardProps {
  verificationId: number;
  methods: VerificationMethodRecord[];
  onSubmit: (values: any) => Promise<any>;
}
export default function PatientVerificationWizard({ verificationId, methods, onSubmit }: PatientVerificationWizardProps) {
  const { t } = useTranslation();
  return (
    <Wizard
      flowName="patient-verification"
      start="verification-methods"
      steps={{
        'verification-methods': {
          render: ({ goTo }) => (
            <VerificationMethods
              header={<HeaderSubheader
                header={t('PatientVerification', 'Patient Verification')}
                subheader={t('PatientExistsForIdentity', 'A patient already exists for this identity. Please verify using one of the methods below to transfer ownership of this patient')} />}
              verificationId={verificationId}
              methods={methods}
              onComplete={(method) => {
                const target = methods.find(m => m.method == method)!.target;
                goTo('verification-code', {
                  updateState: (s) => ({
                    ...(method == 'email' ? { email: target } : { phone: target }),
                  })
                });
              }} />
          )
        },
        'verification-code': {
          render: ({ goTo, formState }) => (
            <EnterVerificationCode
              askBirthday={false}
              onTryAgain={() => goTo('verification-methods')}
              emailXOrPhone={formState}
              onSubmit={onSubmit} />
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
