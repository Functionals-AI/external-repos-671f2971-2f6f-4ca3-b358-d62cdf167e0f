'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginProviderLandingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    router.push(`/schedule/provider/login?${searchParams}`);
  }, [searchParams]);

  return null;
}
