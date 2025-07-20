import usePost from '../usePost';
import { PostAuthReturn } from './types';

export default function usePostAuthToken() {
  return usePost<{ payload: {} }, PostAuthReturn>({
    path: '/auth/token',
    method: 'post',
  });
}
