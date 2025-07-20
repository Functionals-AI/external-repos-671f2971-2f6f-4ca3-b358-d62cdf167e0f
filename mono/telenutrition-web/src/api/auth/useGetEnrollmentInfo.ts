import { IdentityFormFields } from '../../modules/forms/set-identity';
import useGet from '../useGet';

interface UseGetEnrollmentInfoParams {
  token: string;
};

export interface EnrollmentInfo {
  type: number;
  accountId?: number;
  limitReached?: boolean;
  loginInfo?: {
    email?: string;
    phone?: string;
  }
  hint: Partial<IdentityFormFields>;
  isEligible?: boolean;
}

export default function useGetEnrollmentInfo(
  props:
    | {
        params: UseGetEnrollmentInfoParams;
        doInitialGet?: true;
      }
    | {
        doInitialGet: false;
      },
) {
  return useGet<EnrollmentInfo, UseGetEnrollmentInfoParams>({
    path: '/auth/enrollment',
    params: 'params' in props ? props.params : undefined,
    ...('doInitialGet' in props ? { doInitialGet: props.doInitialGet } : {}),
  });
}
