import { FETCH_PROVIDER_APPOINTMENTS_QUERY_KEY } from './provider/useGetProviderAppointments';
import { FETCH_SCHEDULING_APPOINTMENTS_QUERY_KEY } from './useGetAppointments';
import usePost from './usePost';

type UsePostAppointmentNPSParams = {
  payload: {
    score: number;
    comments: string;
    serviceScore: number;
    serviceComments: string;
    additionalFeedback: string;
  };
};

export default function usePostAppointmentNPS(params: { appointmentId: string }) {
  return usePost<UsePostAppointmentNPSParams, void>({
    path: `/scheduling/appointments/${params.appointmentId}/nps`,
    method: 'post',
    invalidateCacheKeys: [
      FETCH_SCHEDULING_APPOINTMENTS_QUERY_KEY,
      FETCH_PROVIDER_APPOINTMENTS_QUERY_KEY,
    ],
  });
}
