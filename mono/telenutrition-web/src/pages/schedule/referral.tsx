import { useEffect } from 'react';
import Loading from '../../components/loading';
import { useRouter } from 'next/router';

export default function ReferralPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/schedule/auth/referrer');
  }, []);

  return <Loading />;
}
