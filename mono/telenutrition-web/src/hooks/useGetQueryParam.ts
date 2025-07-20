import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

type UseGetQueryParamReturn =
  | { loading: true }
  | { loading: false; ok: true; value: string }
  | { ok: false; loading: false };

export default function useGetQueryParam(key: string): UseGetQueryParamReturn {
  const router = useRouter();
  const [value, setValue] = useState<UseGetQueryParamReturn>({ loading: true });

  useEffect(() => {
    if (router.isReady) {
      const firstAttempt = router.query[key];

      if (firstAttempt) {
        setValue({ ok: true, value: firstAttempt as string, loading: false });
        return;
      }

      const secondAttempt = router.asPath.match(new RegExp(`[&?]${key}=(.*?)(&|$)`));

      if (secondAttempt) {
        const value = secondAttempt[1];
        setValue({ ok: true, value: value as string, loading: false });
        return;
      }

      setValue({ ok: false, loading: false });
    }
  }, [router.isReady]);

  return value;
}
