import type { AppointmentRecord } from '@mono/telenutrition/lib/types';
import usePost from 'api/usePost';
import { FETCH_PROVIDER_APPOINTMENTS_QUERY_KEY } from './useGetProviderAppointments';
import { FETCH_SCHEDULING_APPOINTMENTS_QUERY_KEY } from 'api/useGetAppointments';

type PostProviderAppointmentsParams = {
  payload: {
    state: {
      cid: string;
      patient_id: number;
      appointment_ids: number[];
    } & (
      | {
          appointment_type_id: number;
        }
      | {
          audio_only: boolean;
          // Duration is determined by appointment_ids length
        }
    );
  };
};

type PostProviderAppointmentsResult = AppointmentRecord;

export default function usePostProviderAppointments() {
  return usePost<PostProviderAppointmentsParams, PostProviderAppointmentsResult>({
    path: '/provider/appointments',
    method: 'post',
    invalidateCacheKeys: [
      FETCH_PROVIDER_APPOINTMENTS_QUERY_KEY,
      FETCH_SCHEDULING_APPOINTMENTS_QUERY_KEY,
    ],
  });
}
