import { FETCH_PROVIDER_APPOINTMENTS_QUERY_KEY } from './provider/useGetProviderAppointments';
import { FETCH_SCHEDULING_APPOINTMENTS_QUERY_KEY } from './useGetAppointments';
import usePost from './usePost';

export type PostAppointmentParams = {
  state: string;
  timezone?: string;
  appointment_type_id: number;
  providers?: string;
  appointment_ids: number[];
  first_name: string;
  last_name: string;
  dob: string;
  email?: string;
  mobile_phone?: string;
  home_phone?: string;
  address: string;
  address2?: string;
  city: string;
  zipcode: string;
  // payment
  method: string;
  employer_id?: string;
  insurance_id?: string;
  member_id?: string;
  group_id?: string;
  promo?: string;
};

export type UsePostAppointmentsParams = {
  payload: {
    flow: PostAppointmentParams;
    cid: string;
    flowId: number;
  };
};

export type UsePostAppointmentsReturn = {
  appointment: {
    appointmentId: number;
    appointmentTypeId: number;
    departmentId: number;
    duration: number;
    patientId: number;
    providerId: number;
    status: string; // 'f';
  };
};

export default function usePostAppointments() {
  return usePost<UsePostAppointmentsParams, UsePostAppointmentsReturn>({
    path: '/scheduling/appointments',
    invalidateCacheKeys: [
      FETCH_SCHEDULING_APPOINTMENTS_QUERY_KEY,
      FETCH_PROVIDER_APPOINTMENTS_QUERY_KEY,
      ['provider', 'overbooking'],
      ['scheduling', 'overbooking'],
    ],
  });
}
