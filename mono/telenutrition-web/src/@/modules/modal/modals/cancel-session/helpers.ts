import { TimezoneContext } from '@/modules/dates/context';
import { AppointmentRecord } from 'api/types';
import { AppointmentCancelReason } from 'api/usePutCancelAppointment';
import { DateTime } from 'luxon';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

export type ReasonData = {
  value: AppointmentCancelReason;
  label: string;
  disclaimer?: string;
  requireAcknowledgment?: { label: string; acknowledgment: string };
  disabled?: boolean;
};

export function useCancelReasons({
  appointment,
}: {
  appointment: AppointmentRecord;
}): ReasonData[] {
  const { t } = useTranslation();
  const timezone = useContext(TimezoneContext)?.timezone ?? 'America/Angeles';

  const now = DateTime.now().setZone(timezone);
  const today = DateTime.now().setZone(timezone).startOf('day');
  const apptStartOfDay = DateTime.fromISO(appointment.startTimestamp)
    .setZone(timezone)
    .startOf('day');

  const apptStartTime = DateTime.fromISO(appointment.startTimestamp).setZone(timezone);
  const apptEndTime = apptStartTime.plus({ minutes: appointment.duration });
  const isAppointmentInPast = apptEndTime < now;
  const hasAppointmentStarted = apptStartTime < now;
  const isSameDayAppointment =
    apptStartOfDay.toFormat('LL/dd/yyyy') == today.toFormat('LL/dd/yyyy');

  const isAppointmentWithin4HoursOrAfter =
    now > DateTime.fromISO(appointment.startTimestamp).setZone(timezone).minus({ hours: 4 });

  const reasons: Record<Exclude<AppointmentCancelReason, 'PATIENT_RESCHEDULED'>, ReasonData> = {
    PROVIDER_UNAVAILABLE: {
      value: 'PROVIDER_UNAVAILABLE',
      label: t('Provider unavailable'),
      disclaimer: isAppointmentInPast
        ? t(
            'Your provider management team may follow up for additional information on this occurrence.',
          )
        : undefined,
    },
    PATIENT_CANCELLED: { value: 'PATIENT_CANCELLED', label: t('Member cancelled') },
    SCHEDULING_ERROR: { value: 'SCHEDULING_ERROR', label: t('Scheduling error') },
    PATIENT_NOT_COVERED_BY_INSURANCE: {
      value: 'PATIENT_NOT_COVERED_BY_INSURANCE',
      label: t('Member not covered by insurance'),
    },
    CANCEL_FUTURE_VISIT_OF_PATIENT_WHO_NO_SHOWED: {
      value: 'CANCEL_FUTURE_VISIT_OF_PATIENT_WHO_NO_SHOWED',
      label: t('Cancel future visit of member who no-showed'),
    },
    LAST_MINUTE_CANCELLATION: {
      value: 'LAST_MINUTE_CANCELLATION',
      label: t('Member last minute cancellation'),
      disclaimer: t(
        'We will automatically send a reminder text to the member for them to reschedule',
      ),
      requireAcknowledgment: {
        label: t(
          'Before Cancelling the visit as a Last Minute Cancellation, you must have contacted the member and the member indicated that they need a last minute cancellation.',
        ),
        acknowledgment: t('I confirm the member requested a Last Minute Cancellation'),
      },
    },
    PATIENT_NO_SHOW: {
      value: 'PATIENT_NO_SHOW',
      label: t('Member no-show'),
      disclaimer: t(
        'We will automatically send a reminder text to the member for them to reschedule',
      ),
      requireAcknowledgment: {
        label: t(
          'Before Cancelling the Visit as a No Show, you must reach out to the member twice by phone.',
        ),
        acknowledgment: t('I confirm the member did not respond to my outreach.'),
      },
    },
  };

  function filterReasons(
    enabledKeys: AppointmentCancelReason[],
  ): (ReasonData & { disabled?: boolean })[] {
    return Object.values(reasons)
      .map((r) => {
        const enabled = enabledKeys.some((k) => k === r.value);

        return {
          ...r,
          disabled: !enabled,
        };
      })
      .sort((r) => (r.disabled ? 1 : -1));
  }

  if (hasAppointmentStarted) {
    return filterReasons([
      'PROVIDER_UNAVAILABLE',
      'PATIENT_CANCELLED',
      'SCHEDULING_ERROR',
      'PATIENT_NOT_COVERED_BY_INSURANCE',
      'CANCEL_FUTURE_VISIT_OF_PATIENT_WHO_NO_SHOWED',
      'LAST_MINUTE_CANCELLATION',
      'PATIENT_NO_SHOW',
    ]);
  }

  return filterReasons([
    'PROVIDER_UNAVAILABLE',
    'PATIENT_CANCELLED',
    'SCHEDULING_ERROR',
    'PATIENT_NOT_COVERED_BY_INSURANCE',
    'CANCEL_FUTURE_VISIT_OF_PATIENT_WHO_NO_SHOWED',
    ...(isAppointmentWithin4HoursOrAfter
      ? ['LAST_MINUTE_CANCELLATION' as AppointmentCancelReason]
      : []),
  ]);
}
