import { UseFormReturn } from 'react-hook-form';
import Button from '../../../../components/button';
import type { FlowStepFooterConfig } from '@mono/telenutrition/lib/types';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface FlowStepFooterProps {
  showBackButton: boolean;
  handleBack: () => void;
  handleSubmit?: () => void;
  form: UseFormReturn<any>;
  footerConfig?: FlowStepFooterConfig;
  loading?: boolean;
}

export default function FlowStepFooter({
  showBackButton,
  handleSubmit,
  handleBack,
  form,
  footerConfig,
  loading,
}: FlowStepFooterProps) {
  const showBackButtonRef = useRef(showBackButton);
  const { t } = useTranslation();

  if (!!footerConfig?.hide) return <div />;

  return (
    <div className="flex justify-between">
      <div className="order-2">
        {!footerConfig?.nextButton?.hide && (
          <Button
            size="large"
            variant={'primary'}
            loading={loading}
            disabled={!form.formState.isValid}
            type={!!handleSubmit ? 'button' : 'submit'}
            {...(handleSubmit && { onClick: handleSubmit })}
          >
            {footerConfig?.nextButton?.text ?? t('Next', 'Next')}
          </Button>
        )}
      </div>
      <div className="order-1">
        {showBackButtonRef.current && !footerConfig?.backButton?.hide && (
          <Button size="small" variant="secondary" type="button" onClick={handleBack}>
            {footerConfig?.backButton?.text ?? t('Back', 'Back')}
          </Button>
        )}
      </div>
    </div>
  );
}
