'use client';

import PatientSessionFeature from '@/features/provider/patient/session';
import { useFeatureFlags } from '@/modules/feature-flag';
import FullScreenLoading from '@/ui-components/loading/full-screen-loading';
import useGetAppQueryParam from 'hooks/useGetAppQueryParam';
import { useRouter } from 'next/navigation';

export default function Page() {
  const featureFlags = useFeatureFlags();
  const router = useRouter();

  const appointmentIdResult = useGetAppQueryParam('appointmentId', 'number');

  if (appointmentIdResult.loading) {
    return <FullScreenLoading />;
  }

  if (!appointmentIdResult.ok) {
    router.replace('/schedule/provider/dashboard');
    return <FullScreenLoading />;
  }

  if (!featureFlags.hasFeature('provider_in_session_0_9_DEV_16928')) {
    router.replace(`/schedule/provider/session/${appointmentIdResult.value}/meeting-alpha`);
    return;
  }

  return <PatientSessionFeature />;
}
