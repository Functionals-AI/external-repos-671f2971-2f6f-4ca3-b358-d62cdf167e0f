import { SubmitHandler, useForm, UseFormReturn } from 'react-hook-form';
import _ from 'lodash';
import FForm from '../../components/f-form';
import { useState } from 'react';
import EnrollmentChallenge from '../../components/enrollment-challenge';
import type { InputWidget } from '@mono/telenutrition/lib/types';

export type ChallengeFormFields = Record<string, any>

interface ChallengeFormProps {
  challenge: InputWidget[];
  onSubmit: (values: ChallengeFormFields, form: UseFormReturn) => void;
}

export default function EnrollmentChallengeForm({ challenge, onSubmit }: ChallengeFormProps) {
  const form = useForm<ChallengeFormFields>({ mode: 'onChange' });
  const [loading, setLoading] = useState(false);

  const handleSubmit: SubmitHandler<ChallengeFormFields> = (values) => {
    setLoading(true);
    Promise.resolve(onSubmit(values, form)).finally(() => setLoading(false));
  }

  return (
    <FForm form={form} onSubmit={handleSubmit}>
      <EnrollmentChallenge
        form={form}
        challenge={challenge}
        loading={loading}
      />
    </FForm>
  );
}
