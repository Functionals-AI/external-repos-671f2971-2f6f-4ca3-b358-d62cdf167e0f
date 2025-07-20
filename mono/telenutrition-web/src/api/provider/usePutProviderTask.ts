import usePost from 'api/usePost';
import { FETCH_PROVIDER_TASKS_QUERY_KEY } from './useFetchProviderTasks';

type PutProviderTaskParams = {
  payload: {
    task: {
      name?: string;
      note?: string;
      priority?: 'low' | 'medium' | 'high';
      status: string;
    };
  };
};

export default function usePutProviderTask(taskId: number) {
  return usePost<PutProviderTaskParams>({
    path: `/provider/tasks/${taskId}`,
    method: 'put',
    invalidateCacheKeys: [FETCH_PROVIDER_TASKS_QUERY_KEY],
  });
}
