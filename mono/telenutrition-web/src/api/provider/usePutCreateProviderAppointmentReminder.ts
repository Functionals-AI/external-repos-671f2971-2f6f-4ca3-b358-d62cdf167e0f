import usePost from '../usePost';

export default function usePostCreateProviderAppointmentReminder(appointmentId: number) {
  return usePost({
    method: 'put',
    path: `/provider/appointments/${appointmentId}/reminder`,
  });
}
