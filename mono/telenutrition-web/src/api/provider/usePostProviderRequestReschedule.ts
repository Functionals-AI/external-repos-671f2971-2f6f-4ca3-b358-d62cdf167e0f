import usePost from 'api/usePost';

interface PostProviderRequestRescheduleParams {
  payload: {
    rescheduleAppointmentId: number;
    isAudioOnly: boolean;
    duration: 30 | 60;
  };
}

export default function usePostProviderRequestReschedule() {
  return usePost<PostProviderRequestRescheduleParams, never>({
    path: '/provider/request/reschedule',
    method: 'post',
    invalidateCacheKeys: [['provider', 'appointments']],
  });
}
