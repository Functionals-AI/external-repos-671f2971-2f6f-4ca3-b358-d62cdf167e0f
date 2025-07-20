'use client';

import PatientSessionAlphaFeature from '@/features/provider/patient/session-alpha';
import useGetAppQueryParam from 'hooks/useGetAppQueryParam';
import { useRouter } from 'next/navigation';
import FullScreenLoading from '@/ui-components/loading/full-screen-loading';

export default function Page() {
  const appointmentIdResult = useGetAppQueryParam('appointmentId', 'number');
  const router = useRouter();

  if (appointmentIdResult.loading) {
    return <FullScreenLoading />;
  }
  if (!appointmentIdResult.ok) {
    router.push('/schedule/provider/dashboard');
    return <FullScreenLoading />;
  }

  return <PatientSessionAlphaFeature appointmentId={appointmentIdResult.value} />;
}
