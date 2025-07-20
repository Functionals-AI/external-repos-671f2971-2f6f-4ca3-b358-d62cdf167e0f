import usePost from 'api/usePost';
import { FETCH_PROVIDER_TASKS_QUERY_KEY } from './useFetchProviderTasks';

interface PostProviderTaskParams {
  payload: {
    task: {
      name: string;
      note?: string;
      dueDate?: string;
      priority: 'low' | 'medium' | 'high';
    };
  };
}

export default function usePostProviderTask() {
  return usePost<PostProviderTaskParams, never>({
    method: 'post',
    path: '/provider/tasks',
    invalidateCacheKeys: [FETCH_PROVIDER_TASKS_QUERY_KEY],
  });
}
