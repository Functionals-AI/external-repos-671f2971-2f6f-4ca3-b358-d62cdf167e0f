import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { InputWidget } from '@mono/telenutrition/lib/types';
import FlowStepFooter from '../modules/flows/flow-engine/flow-step/flow-step-footer';
import TextInput from './form/text-input';
import HeaderSubheader from './header-subheader';
import DateInput from './form/text-input/date-input';

interface ChallengeProps {
  form: UseFormReturn<any>;
  handleBack?: () => void;
  challenge: InputWidget[];
  handleSubmit?: () => void;
  loading?: boolean;
}

export default function EnrollmentChallenge({
  form,
  handleBack,
  challenge,
  handleSubmit,
  loading,
}: ChallengeProps) {
  const { t } = useTranslation();

  return (
    <div className="max-w-5xl space-y-6">
      <HeaderSubheader
        header={t('VerifyEnrollment', 'Verify enrollment')}
        subheader={t(
          'ConfirmFollowingFieldsToVerifyEligibility',
          'Please confirm the following fields to verify eligibility.',
        )}
      />
      <div className="pb-4 md:pb-6 flex flex-col w-full">
        {challenge.map((question) =>
          question.type === 'text:date' ? (
            <DateInput
              key={question.key}
              questionKey={question.key}
              name={question.label}
              registerOptions={{ required: true }}
            />
          ) : (
            <TextInput
              key={question.key}
              questionKey={question.key}
              name={question.label}
              widget={question.type}
              registerOptions={{ required: true }}
            />
          ),
        )}
      </div>
      <FlowStepFooter
        showBackButton={!!handleBack}
        handleBack={handleBack ?? (() => {})}
        handleSubmit={handleSubmit}
        form={form}
        loading={loading}
      />
    </div>
  );
}
