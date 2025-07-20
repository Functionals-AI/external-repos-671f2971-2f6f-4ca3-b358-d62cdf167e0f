import usePost from '../usePost';

export interface UsePostResetPasswordParams {
  payload:
    | {
        email: string;
      }
    | {
        phone: string;
      };
}

interface UsePostResetPasswordResult {
  verificationId: number;
}

export default function usePostResetPassword() {
  return usePost<UsePostResetPasswordParams, UsePostResetPasswordResult>({
    path: '/auth/reset-password',
    method: 'post',
  });
}
