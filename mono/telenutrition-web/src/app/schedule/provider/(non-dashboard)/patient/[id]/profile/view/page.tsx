'use client';

import PatientProfileViewFeature, {
  PatientProfileViewTabs,
} from '@/features/provider/patient/profile/view';
import { useRouter } from 'next/navigation';
import useGetAppQueryParam from 'hooks/useGetAppQueryParam';
import FullScreenLoading from '@/ui-components/loading/full-screen-loading';

function isTabQueryParamValid(tabQueryParam: string): tabQueryParam is PatientProfileViewTabs {
  return Object.values(PatientProfileViewTabs).includes(tabQueryParam as any);
}

export default function Page() {
  const router = useRouter();
  const tabQueryParamResult = useGetAppQueryParam('tab', 'string');

  const patientIdResult = useGetAppQueryParam('id', 'number');

  if (patientIdResult.loading || tabQueryParamResult.loading) {
    return <FullScreenLoading />;
  }

  if (!patientIdResult.ok) {
    router.push('/schedule/provider/patients');
    return <FullScreenLoading />;
  }

  let defaultTab: PatientProfileViewTabs | undefined;
  if (tabQueryParamResult.ok) {
    const tabQueryParam = tabQueryParamResult.value;
    if (isTabQueryParamValid(tabQueryParam)) {
      defaultTab = tabQueryParam;
    }
  }

  return <PatientProfileViewFeature patientId={patientIdResult.value} defaultTab={defaultTab} />;
}
