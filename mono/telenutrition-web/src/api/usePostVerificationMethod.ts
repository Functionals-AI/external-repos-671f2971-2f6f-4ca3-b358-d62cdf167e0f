import type { VerificationMethod } from '@mono/telenutrition/lib/types';
import usePost from './usePost';

export type PostVerificationPayload = {
  verificationId: number;
  method: VerificationMethod;
};

export type PostVerificationParams = { payload: PostVerificationPayload };

export default function usePostVerificationMethods() {
  return usePost<PostVerificationParams, void>({
    path: '/scheduling/patients/verifications/methods',
  });
}
