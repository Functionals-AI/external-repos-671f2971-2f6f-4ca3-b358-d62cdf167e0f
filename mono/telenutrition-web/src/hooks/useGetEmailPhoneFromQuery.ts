import _ from 'lodash';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

// At least one of the two is required
export type EmailOrPhone = { email: string; phone?: string } | { phone: string; email?: string };
// Only one or the other, not both
export type EmailXOrPhone = { email: string } | { phone: string };

export function convertEmailOrPhoneToEmailXOrPhone(emailOrPhone: EmailOrPhone): EmailXOrPhone {
  if ('phone' in emailOrPhone && !!emailOrPhone.phone) return { phone: emailOrPhone.phone };
  return { email: emailOrPhone.email as string };
}

export function getQueryFromEmailOrPhone(obj: EmailOrPhone & Record<string, string>): string {
  const query = _.map(_.pick(obj, ['email', 'phone']), (value, key) => `${key}=${value}`).join('&');
  return query;
}

/**
 * Parses query params to find email or phone.
 * If neither found, redirects to given url
 * If found, returns value
 */
export default function useGetEmailPhoneFromQuery({ redirectOnFail }: { redirectOnFail: string }) {
  const router = useRouter();
  const [routerState, setRouterState] = useState<null | EmailOrPhone>(null);

  useEffect(() => {
    if (router.isReady) {
      const emailQueryKey = 'email';
      const emailQuery = router.asPath.match(new RegExp(`[?&]${emailQueryKey}=([^&#]*)`));

      const email = emailQuery?.[1];

      const phoneQueryKey = 'phone';
      const phoneQuery = router.asPath.match(new RegExp(`[?&]${phoneQueryKey}=([^&#]*)`));

      const phone = phoneQuery?.[1];

      const state = {
        ...(!!phone && _.isString(phone) && { phone }),
        ...(!!email && _.isString(email) && { email }),
      };

      if (!state.email && !state.phone) {
        router.push(redirectOnFail);
        return;
      }

      setRouterState(state as EmailOrPhone);
    }
  }, [router.isReady]);

  return routerState;
}
