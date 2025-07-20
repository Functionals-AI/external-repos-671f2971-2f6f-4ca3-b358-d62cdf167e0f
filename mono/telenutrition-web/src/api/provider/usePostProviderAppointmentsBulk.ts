import usePost from 'api/usePost';
import { FETCH_PROVIDER_APPOINTMENTS_QUERY_KEY } from './useGetProviderAppointments';
import { AthenaAppointmentRecord } from 'api/types';
import { FETCH_SCHEDULING_APPOINTMENTS_QUERY_KEY } from 'api/useGetAppointments';
import { FETCH_PROVIDER_PATIENTS_QUERY_KEY } from './useFetchProviderPatients';

type PostProviderAppointmentsBulkParams = {
  payload: {
    cid: string;
    patient_id: number;
    appointments: {
      appointment_ids: number[];
      audio_only: boolean;
      is_follow_up: boolean;
    }[];
  };
};

export interface PostProviderBulkScheduleError {
  error: string;
  errorMessage: string;
  appointment: {
    appointmentIds: number[];
    appointmentTypeId: number;
  };
}

interface PostProviderAppointmentsBulkResult {
  successes: AthenaAppointmentRecord[];
  errors: PostProviderBulkScheduleError[];
}

export default function usePostProviderAppointmentsBulk() {
  return usePost<PostProviderAppointmentsBulkParams, PostProviderAppointmentsBulkResult>({
    path: '/provider/appointments/bulk',
    method: 'post',
    invalidateCacheKeys: [
      FETCH_PROVIDER_APPOINTMENTS_QUERY_KEY,
      FETCH_SCHEDULING_APPOINTMENTS_QUERY_KEY,
      FETCH_PROVIDER_PATIENTS_QUERY_KEY,
    ],
  });
}
