import { ApiResponseSuccessPayload } from '../client';
import type { AuthRole } from '@mono/telenutrition/lib/types';

export type PostAuthReturn<Extra extends Record<string, string | number> = {}> = {
  token: string;
  identity: { fid: string; src: number } | { uid: number };
  roles: AuthRole[];
  userId?: number;
  hasPassword: boolean;
  hasAppConsent: boolean;
} & Extra;

export function isResponsePostAuthReturn(
  obj: ApiResponseSuccessPayload<any | unknown>,
): obj is ApiResponseSuccessPayload<PostAuthReturn> {
  return (
    typeof obj.data === 'object' &&
    'token' in obj.data &&
    'roles' in obj.data &&
    'identity' in obj.data
  );
}
