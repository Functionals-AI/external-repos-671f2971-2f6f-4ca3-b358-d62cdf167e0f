import _ from 'lodash';
import HeaderSubheader from '../../../../components/header-subheader';
import { DeveloperError } from '../../../../utils/errors';
import ScheduleAppointmentContainer from '../../../schedule';
import { useWorkflowEngineContext } from '../../flow-engine/workflow-engine/context';
import { useRouter } from 'next/router';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AppointmentData } from '../../../../api/useGetAppointments';
import type { ProviderRecordShort } from '@mono/telenutrition/lib/types';
import { DateTime } from 'luxon';

interface CalendarFlowStepProps {
  onNoAppointments?: 'go-to-dashboard' | 'restart-flow';
}

export default function CalendarFlowStep({
  onNoAppointments = 'go-to-dashboard',
}: CalendarFlowStepProps) {
  const router = useRouter();
  const { handleBack, form, handleNext, getFlowStateValue, currentStep, restartAndReset } =
    useWorkflowEngineContext();
  const currentStepRef = useRef(currentStep);
  const { t } = useTranslation();

  const handleComplete = ({
    appointment,
    provider,
  }: {
    appointment: AppointmentData;
    provider: ProviderRecordShort;
  }) => {
    const startTime = DateTime.fromISO(appointment.startTimestamp, { setZone: true });
    form.handleSubmit(() =>
      handleNext({
        appointment: {
          appointment_ids: appointment.appointmentIds,
          duration: appointment.duration,
          start_timestamp: appointment.startTimestamp,
          provider_id: provider.providerId,
          provider_name: provider.name,
          provider_photo: provider.photo,
          provider_initials: provider.initials,
          start_at: startTime.toFormat('h:mma'),
          start_date: startTime.toFormat('MM/dd/yyyy')
        },
      }),
    )();
  };

  const state = getFlowStateValue('state') as string | null;
  const patient_id = getFlowStateValue('patient_id') as string | null;
  const is_follow_up = getFlowStateValue('is_follow_up') as string | null;
  const paymentMethodId = getFlowStateValue('payment_method_id') as number | null;

  const goToDashboard = () => router.push('/schedule/dashboard');
  const restartFlow = () => {
    restartAndReset();
  };

  if (state === undefined || state === null) {
    throw new DeveloperError('State must be taken before calendar displayed.');
  }

  if (patient_id === undefined || patient_id === null) {
    throw new DeveloperError('Patient Id must be taken before calendar displayed');
  }

  if (is_follow_up === undefined || is_follow_up === null) {
    throw new DeveloperError('Must know if appointment is follow up to see appointment slots');
  }

  if (paymentMethodId == undefined || paymentMethodId === null) {
    throw new DeveloperError('Payment method id is required');
  }

  return (
    <div className="max-w-5xl m-auto px-6 space-y-6">
      <HeaderSubheader
        header={t('SelectDietitianAndVisitTime', 'Select a dietitian and visit time')}
        subheader={t(
          'UseCalendarToChooseBestTime',
          'Use the calendar to choose the best time for your virtual visit.',
        )}
      />
      <ScheduleAppointmentContainer
        onBack={currentStepRef.current === 0 ? undefined : handleBack}
        onComplete={handleComplete}
        onNoAppointments={onNoAppointments === 'restart-flow' ? restartFlow : goToDashboard}
        onNoAppointmentsButtonText={
          onNoAppointments === 'restart-flow'
            ? t('Restart', 'Restart')
            : t('GoToDashboard', 'Go To Dashboard')
        }
        appointmentQueryData={{
          patientId: patient_id,
          isFollowUp: is_follow_up,
          paymentMethodId,
        }}
      />
    </div>
  );
}
