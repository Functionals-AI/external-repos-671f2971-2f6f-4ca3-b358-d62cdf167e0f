import { useEffect, useMemo } from 'react';
import { DateTime } from 'luxon';

import {
  AppointmentData,
  GroupedAppointmentsByProvider,
  useFetchAppointments,
} from 'api/useGetAppointments';
import WeekViewHourOptionPicker from '@/smart-components/week-view-hour-option-picker';
import { AppointmentRecord } from 'api/types';
import type { PatientRecord } from '@mono/telenutrition/lib/types';
import { useWeekPicker } from '@/modules/calendar/week-view';
import { FieldValues, UseFormReturn } from 'react-hook-form';
import { getSubform } from '@/modules/form/form';
import { useTranslation } from 'react-i18next';
import useGetPatientDisabledSchedulingDays from '@/selectors/useGetPatientDisabledSchedulingDays';
import ContainerLoading from '@/ui-components/loading/container-loading';
import GetErrorDislpay from '@/modules/errors/get-error-display';

interface AppointmentPickerFormFields {
  appointmentTime: string | null;
  selectedAppointmentData?: AppointmentData;
}

interface Props<T extends FieldValues> {
  providerId?: number;
  patient: PatientRecord;
  form: UseFormReturn<T & AppointmentPickerFormFields>;
  appointmentTimeKey?: string;
  appointmentKey?: string;
  timezone: string;
  rescheduleAppointment?: AppointmentRecord;
}

export default function AppointmentPicker<T extends FieldValues>({
  providerId,
  patient,
  form: parentForm,
  timezone,
  rescheduleAppointment,
}: Props<T>) {
  const form = getSubform<AppointmentPickerFormFields>(parentForm);
  const weekPicker = useWeekPicker(patient.timezone);
  const { t } = useTranslation();
  const appointmentTime = form.watch('appointmentTime');

  const { data, refetch } = useFetchAppointments({
    fromTime: DateTime.fromJSDate(weekPicker.selectedDates[0]).startOf('day').toISO() || undefined,
    toTime:
      DateTime.fromJSDate(weekPicker.selectedDates[0]).plus({ days: 7 }).startOf('day').toISO() ||
      undefined,
    timezone,
    ...(rescheduleAppointment
      ? {
          rescheduleForAppointmentId: rescheduleAppointment.appointmentId,
        }
      : {
          isFollowUp: true,
          patientId: patient.patientId,
        }),
    providerIds: providerId?.toString(),
  });
  const getPatientDisabledSchedulingDays = useGetPatientDisabledSchedulingDays({
    patientId: patient.patientId,
    rescheduleAppointmentId: rescheduleAppointment?.appointmentId,
  });
  useEffect(() => {
    if (!providerId) return;
    refetch();
  }, [providerId, refetch, weekPicker.selectedDates]);

  const openingsByDate = useMemo(() => {
    const hash: Record<string, GroupedAppointmentsByProvider | undefined> = {};
    for (const date of weekPicker.selectedDates) {
      const key = DateTime.fromJSDate(date).toFormat('MM/dd/y');
      const slot = data?.slots[key]?.filter((s) => s.providerId === providerId);
      hash[key] = slot?.[0];
    }

    return hash;
  }, [providerId, data?.slots, weekPicker.selectedDates]);

  useEffect(() => {
    const appointments = Object.values(openingsByDate).flatMap((s) => s?.appointments);
    const appointment = appointments.find((a) => a?.startTimestamp === appointmentTime);

    form.setValue('selectedAppointmentData', appointment);
  }, [appointmentTime, openingsByDate, form, timezone]);

  if (getPatientDisabledSchedulingDays.loading) {
    return <ContainerLoading />;
  }
  if (getPatientDisabledSchedulingDays.error) {
    return (
      <GetErrorDislpay
        error={getPatientDisabledSchedulingDays.error}
        refetch={getPatientDisabledSchedulingDays.refetch}
      />
    );
  }

  return (
    <WeekViewHourOptionPicker
      form={form}
      patient={patient}
      openingsByDate={openingsByDate}
      weekPicker={weekPicker}
      id="appointmentTime"
      timezone={timezone}
      rules={{ required: true }}
      disabledDatesWithTooltip={getPatientDisabledSchedulingDays.disabledDays.map((dt) => ({
        date: dt,
        tooltip: t('Members cannot schedule more than one appointment per week.'),
      }))}
    />
  );
}
