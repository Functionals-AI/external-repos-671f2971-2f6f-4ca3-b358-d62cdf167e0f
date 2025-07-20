import { useTranslation } from "react-i18next";
import usePostAuthVerify, { ChallengeHint } from "../../../api/auth/usePostAuthVerify";
import { useModalManager } from "../../modal/manager";
import usePostVerificationMethods from "../../../api/usePostVerificationMethod";
import EnterVerificationCode from "../../forms/verification-code";
import EnrollmentChallengeForm from "../../forms/enrollment-challenge";
import { useState } from "react";
import FlowTransition from "../../../components/layouts/basic/transition";
import PatientVerificationWizard from "./patient-verification";

type Verification = {
  token: string;
  challenge: ChallengeHint;
}

interface RegistrationVerificationWizardProps {
  verification: Verification;
  onVerified: (token: string) => Promise<any>;
}

export default function RegistrationVerificationWizard(props: RegistrationVerificationWizardProps) {
  const { post: postAuthVerify } = usePostAuthVerify();
  const [verification, setVerification] = useState<Verification>(props.verification);
  const { t } = useTranslation();
  const modalManager = useModalManager()
  const { challenge } = verification

  const onSubmit = (fields: any) => {
    const payload = { token: verification.token, challenge: fields }
    return postAuthVerify({ payload }).then(({ data }) => {
      if (data.verified) {
        return props.onVerified(data.token)
      } else {
        setVerification(data);
      }
    }).catch(error => {
      modalManager.handleApiError({
        error,
        title: t('Verification Failed'),
        subtitle: t('PleaseContactSupportOrTryAgain', 'Please contact support or try again'),
      });
    })
  }
  return (
    <FlowTransition transitionKey={challenge.type}>
      <VerificationStep
        challenge={challenge}
        onSubmit={onSubmit}/>
    </FlowTransition>
  );
}

interface VerificationStepProps {
  challenge: ChallengeHint,
  onSubmit: (fields: any) => Promise<any>
}

function VerificationStep({ challenge, onSubmit }: VerificationStepProps) {
  const { t } = useTranslation();
  const modalManager = useModalManager()
  const { post: postVerificationMethod } = usePostVerificationMethods();

  switch(challenge.type) {
    case 'email':
    case 'phone':
      const emailOrPhone = challenge.type == 'email' ?
        { email: challenge.hint.label } :
        { phone: challenge.hint.label};

      return <EnterVerificationCode
        askBirthday={false}
        onTryAgain={() => {
          postVerificationMethod({
            payload: {
              verificationId: challenge.hint.verificationId,
              method: challenge.type == 'email' ? 'email' : 'sms'
            }
          }).then(() => {
            modalManager.openModal({
              type: "Custom",
              title: t("Success", "Success"),
              content: t("VerificationCodeResent", "Your verification code was re-sent")
            })
          }).catch(e => {
            modalManager.handleApiError({
              error: e,
              subtitle: t('ErrorSendingVerificationCode', 'Error sending verification code'),
            });
          })
        }}
        emailXOrPhone={emailOrPhone}
        onSubmit={onSubmit}
      />
    case 'enrollment':
    case 'eligibility':
      return <EnrollmentChallengeForm
        challenge={challenge.hint}
        onSubmit={onSubmit}
      />
    case 'patient':
      return <PatientVerificationWizard
        verificationId={challenge.hint.verificationId}
        methods={challenge.hint.methods}
        onSubmit={onSubmit}
      />
  }
}

