import useGet from '../useGet';
import type { AuthRole } from '@mono/telenutrition/lib/types';

export enum AccountIds {
  BankOfAmerica = 63
}

export type UserRecord = {
  userId: number;
  roles?: AuthRole[];
  firstName?: string;
  lastName?: string;
  zipCode?: string;
  birthday?: Date;
  email?: string;
  phone?: string;
  fsEligibleId?: number;
  accountId?: number;
};

export type UseGetAccountReturn = UserRecord & {
  isIdentified: boolean;
  isRegistered: boolean;
  hasPassword: boolean;
  isDelegate: boolean;
  isReferral: boolean;
  hasAppConsent: boolean;
  partialData?: Partial<UserRecord>; // temp: only for existing unidentified users
  hasSSO: boolean;
};

export default function useGetAccount({ doInitialGet }: { doInitialGet?: boolean }) {
  return useGet<UseGetAccountReturn>({
    path: '/account',
    ...(doInitialGet !== undefined ? { doInitialGet } : {}),
  });
}
