'use client';

import ProviderPerformanceMetricsFeature from '@/features/provider/performance-metrics';
import { useFeatureFlags } from '@/modules/feature-flag';
import { useRouter } from 'next/navigation';

export default function Page() {
  const featureFlags = useFeatureFlags();
  const router = useRouter();

  if (!featureFlags.hasFeature('provider_performance_metrics_ENG_1736')) {
    router.replace(`/schedule/provider/dashboard`);
    return;
  }

  return <ProviderPerformanceMetricsFeature />;
}
