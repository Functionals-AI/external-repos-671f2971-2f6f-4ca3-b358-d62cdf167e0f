import usePost from 'api/usePost';
import {
  DeterminedScreeningQuestionnaire,
  getFetchProviderAppointmentQueryKey,
} from './useFetchProviderAppointmentDetail';

type PostProviderAppointmentQuestionnaireParams = {
  payload: {
    questionnaireType: string;
    formData: unknown;
    experimental?: boolean;
  };
};

export default function usePostProviderAppointmentQuestionnaire(appointmentId: number) {
  return usePost<PostProviderAppointmentQuestionnaireParams, DeterminedScreeningQuestionnaire>({
    path: `/provider/appointments/${appointmentId}/questionnaires`,
    method: 'post',
    invalidateCacheKeys: [getFetchProviderAppointmentQueryKey(appointmentId), ['appointment-encounter']],
  });
}
