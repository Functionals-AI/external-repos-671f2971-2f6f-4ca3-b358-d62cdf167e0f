import usePost from '../usePost';
import { PostAuthReturn } from './types';

export type UsePostRegisterParams = {
  payload: {
    token: string;
    password?: string;
    appConsent: boolean;
    anthemConsent?: boolean;
  };
};

export type UsePostRegisterReturn = PostAuthReturn;

export default function usePostRegister() {
  return usePost<UsePostRegisterParams, UsePostRegisterReturn>({
    path: '/auth/register',
    method: 'post',
  });
}
