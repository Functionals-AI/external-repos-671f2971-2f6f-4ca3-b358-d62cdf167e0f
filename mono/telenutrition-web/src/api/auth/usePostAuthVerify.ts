import type { VerificationMethodRecord, ChallengeHint as ChallengeHintSource } from '@mono/telenutrition/lib/types';
import { EmailXOrPhone } from '../../hooks/useGetEmailPhoneFromQuery';
import usePost from '../usePost';
import { UsePostRegisterParams } from './usePostRegister';

export interface UsePostAuthVerifyParams {
  payload: EmailXOrPhone & Partial<UsePostRegisterParams> | {
    token: string
    challenge: Record<string,any>
  } | {
    enrollment: string
  }
}

export type ChallengeHint = ChallengeHintSource & {
  hint: {
    verificationId: number,
    methods: VerificationMethodRecord[]
  }
}

export type UsePostAuthVerifyReturn = {
  token: string;
} & ({
  verified: true;
} | {
  verified: false;
  challenge: ChallengeHint
})

export default function usePostAuthVerify() {
  return usePost<UsePostAuthVerifyParams, UsePostAuthVerifyReturn>({
    path: '/auth/verify',
    method: 'post',
  });
}
