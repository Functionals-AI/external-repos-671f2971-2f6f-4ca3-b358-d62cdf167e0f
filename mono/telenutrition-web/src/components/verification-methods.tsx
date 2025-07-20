import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import usePostVerificationMethods from "../api/usePostVerificationMethod";
import Alert from "./alert";
import Button from "./button";
import FForm from "./f-form";
import RadioGroup from "./form/radio-group";
import type { VerificationMethod, VerificationMethodRecord } from '@mono/telenutrition/lib/types';

interface VerificationMethodProps {
  header: React.ReactNode;
  verificationId: number;
  methods: VerificationMethodRecord[];
  onComplete: (method: VerificationMethod) => void;
}

type VerificationMethodFormValues = { verificationMethod: VerificationMethod };

export default function VerificationMethods({ header, verificationId, methods, onComplete }: VerificationMethodProps) {
  const { t } = useTranslation();
  const form = useForm<VerificationMethodFormValues>({ mode: 'onChange' });
  const [error, setError] = useState<string | null>(null);
  const {
    post: postVerificationMethod,
    data: { isSubmitting },
  } = usePostVerificationMethods();

  const handleSubmit: SubmitHandler<VerificationMethodFormValues> = ({ verificationMethod }) => {
    postVerificationMethod({
      payload: {
        verificationId,
        method: verificationMethod
      }
    }).then(() => onComplete(verificationMethod))
  }

  return (
    <FForm {...{ form, onSubmit: handleSubmit }}>
      { header }
      {error && (
        <Alert
          title={t('ErrorSendingVerificationCode', 'Error sending verification code')}
          subtitle={error}
          onClose={() => setError(null)}
        />
      )}
      <RadioGroup
        centered={false}
        questionKey="verificationMethod"
        label={t(
          'SelectAMethodToSendVerificationCode',
          'Select a method to send a verification code',
        )}
        options={methods.map(method => ({
          title: method.label,
          id: method.method
        }))}
        registerOptions={{ required: true }}
      />
      <div className="flex justify-end">
        <Button size="large" loading={isSubmitting} disabled={!form.formState.isValid} type="submit">
          {t('SendCode', 'Send Code')}
        </Button>
      </div>
    </FForm>
  )
}