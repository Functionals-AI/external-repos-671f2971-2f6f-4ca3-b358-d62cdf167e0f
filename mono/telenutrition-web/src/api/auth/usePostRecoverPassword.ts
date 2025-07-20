import { EmailXOrPhone } from '../../hooks/useGetEmailPhoneFromQuery';
import usePost from '../usePost';
import { PostAuthReturn } from './types';

export interface UsePostRecoverPasswordParams {
  payload: EmailXOrPhone & {
    code: number;
    birthday: string;
    newPassword: string;
  };
}

type UsePostRecoverPasswordReturn = PostAuthReturn;

/**
 * This can verify email or reset password.
 * This will return a token, since users can be 'authed' without a passwords
 */
export default function usePostRecoverPassword() {
  return usePost<UsePostRecoverPasswordParams, UsePostRecoverPasswordReturn>({
    path: '/auth/recover',
    method: 'post',
  });
}
