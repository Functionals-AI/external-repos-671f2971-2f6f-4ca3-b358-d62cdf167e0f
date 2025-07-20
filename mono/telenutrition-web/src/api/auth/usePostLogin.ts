import usePost from '../usePost';
import { PostAuthReturn } from './types';

type UsePostLoginParams = {
  payload:
    | {
        email: string;
        password: string;
      }
    | {
        phone: string;
        password: string;
      };
};

export type UsePostLoginReturn = PostAuthReturn;

export default function usePostLogin() {
  return usePost<UsePostLoginParams, UsePostLoginReturn>({
    path: '/auth/login',
    method: 'post',
  });
}
