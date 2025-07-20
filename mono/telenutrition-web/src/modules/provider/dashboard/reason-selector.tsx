import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { inputClasses } from '../../../components/form/helpers';
import { cn } from '@/utils';
import { AppointmentCancelReason } from 'api/usePutCancelAppointment';

interface ReasonSelectorProp {
  reason: string;
  setReason: (newReason: AppointmentCancelReason) => void;
  disabled?: boolean;
}

const ReasonSelector = ({ reason, setReason, disabled }: ReasonSelectorProp) => {
  const { t } = useTranslation();
  const options: { text: string; value: AppointmentCancelReason }[] = useMemo(
    () => [
      { text: t('Provider Unavailable', 'Provider Unavailable'), value: 'PROVIDER_UNAVAILABLE' },
      {
        text: t('PatientLastMinuteCancellation', 'Patient Last Minute Cancellation'),
        value: 'LAST_MINUTE_CANCELLATION',
      },
      { text: t('Patient cancelled', 'Patient cancelled'), value: 'PATIENT_CANCELLED' },
      { text: t('Scheduling error', 'Scheduling error'), value: 'SCHEDULING_ERROR' },
      {
        text: t('Patient not covered by insurance', 'Patient not covered by insurance'),
        value: 'PATIENT_NOT_COVERED_BY_INSURANCE',
      },
      {
        text: t(
          'CancelFutureVisitOfPatientWhoNoShowed',
          'Cancel future visit of patient who no-showed',
        ),
        value: 'CANCEL_FUTURE_VISIT_OF_PATIENT_WHO_NO_SHOWED',
      },
    ],
    [],
  );
  return (
    <select
      disabled={disabled}
      aria-label="select a reason"
      id={reason}
      className={cn(inputClasses, 'cursor-pointer')}
      value={reason}
      onChange={(e) => setReason(e.target.value as AppointmentCancelReason)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.text}
        </option>
      ))}
    </select>
  );
};

export default ReasonSelector;
