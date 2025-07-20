import { FETCH_PROVIDER_APPOINTMENTS_QUERY_KEY } from './provider/useGetProviderAppointments';
import { getFetchAppointmentByIdQueryKey } from './useGetAppointmentById';
import usePost from './usePost';

export type AppointmentCancelReason =
  "LAST_MINUTE_CANCELLATION" |
  "PATIENT_CANCELLED" |
  "PATIENT_NO_SHOW" |
  "PATIENT_NOT_COVERED_BY_INSURANCE" |
  "PATIENT_RESCHEDULED" |
  "PROVIDER_UNAVAILABLE" |
  "SCHEDULING_ERROR" |
  "CANCEL_FUTURE_VISIT_OF_PATIENT_WHO_NO_SHOWED"

type PutCancelAppointmentParams = {
  payload: {
    cancelReason: AppointmentCancelReason;
  };
};

export default function usePutCancelAppointment(params: { appointmentId: number }) {
  return usePost<PutCancelAppointmentParams, boolean>({
    method: 'put',
    path: `/scheduling/appointments/${params.appointmentId}/cancel`,
    invalidateCacheKeys: [
      FETCH_PROVIDER_APPOINTMENTS_QUERY_KEY,
      getFetchAppointmentByIdQueryKey(params.appointmentId),
    ],
  });
}
