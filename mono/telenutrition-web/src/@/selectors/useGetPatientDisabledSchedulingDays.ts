import useFetchProviderPatientAppointments from 'api/provider/useFetchProviderPatientAppointments';
import { ApiGetError } from 'api/useGet';
import { DateTime, Interval } from 'luxon';

function getDisabledDaysFromScheduledAppointment(dt: DateTime): DateTime[] {
  const startOfWeek = dt.weekday === 7 ? dt.startOf('day') : dt.startOf('week').minus({ day: 1 });
  const endOfWeek = startOfWeek.plus({ days: 7 });
  const unavailableDates = Interval.fromDateTimes(startOfWeek, endOfWeek)
    .splitBy({ day: 1 })
    .map((d) => d.start)
    .filter((d) => d && d.isValid) as DateTime[];

  return unavailableDates;
}

export function getDisabledDaysFromScheduledAppointmentDates(appointmentDates: DateTime[]) {
  return appointmentDates.reduce((allUnavailable, apptDT) => {
    const unavailableDates = getDisabledDaysFromScheduledAppointment(apptDT);
    return [...allUnavailable, ...unavailableDates];
  }, [] as DateTime[]);
}

type GetPatientDisabledSchedulingDaysReturn =
  | { loading: true }
  | { loading: false; error: ApiGetError; refetch: () => void }
  | { loading: false; error: null; disabledDays: DateTime[] };

// Returns list of days that cannot be scheduled for this patient due to limit of 1 appointment per 7 days
export default function useGetPatientDisabledSchedulingDays({
  patientId,
  rescheduleAppointmentId,
}: {
  patientId: number;
  rescheduleAppointmentId?: number;
}): GetPatientDisabledSchedulingDaysReturn {
  const providerPatientAppointmentsData = useFetchProviderPatientAppointments(patientId);
  if (providerPatientAppointmentsData.isLoading) {
    return { loading: true };
  }
  if (providerPatientAppointmentsData.error) {
    return {
      loading: false,
      error: providerPatientAppointmentsData.error,
      refetch: providerPatientAppointmentsData.refetch,
    };
  }

  const nonCanceledAppointments = providerPatientAppointmentsData.data.appointments.filter(
    (appt) => appt.appointment.status !== 'x',
  );

  const appointments = nonCanceledAppointments.filter((appt) => {
    const apptDate = DateTime.fromISO(appt.appointment.startTimestamp);
    return apptDate >= DateTime.now().startOf('week').minus({ day: 1 });
  });

  const filteredAppointments = rescheduleAppointmentId
    ? appointments.filter((appt) => appt.appointment.appointmentId !== rescheduleAppointmentId)
    : appointments;

  const disabledDaysForPatient = getDisabledDaysFromScheduledAppointmentDates(
    filteredAppointments.map((appt) => DateTime.fromISO(appt.appointment.startTimestamp)),
  );

  return {
    loading: false,
    error: null,
    disabledDays: disabledDaysForPatient,
  };
}
