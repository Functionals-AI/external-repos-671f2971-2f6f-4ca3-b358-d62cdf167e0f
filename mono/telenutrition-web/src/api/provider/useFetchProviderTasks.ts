import type { ProviderTaskRecord } from '@mono/telenutrition/lib/types';
import useFetch, { UseFetchTypes } from 'hooks/useFetch';

export type FetchProviderTasksResult = {
  tasks: ProviderTaskRecord[];
};

export const FETCH_PROVIDER_TASKS_QUERY_KEY = ['provider', 'tasks'];

type Types = UseFetchTypes<never, FetchProviderTasksResult>;

export default function useFetchProviderTasks() {
  return useFetch<Types>({
    path: '/provider/tasks',
    queryKey: FETCH_PROVIDER_TASKS_QUERY_KEY,
  });
}
