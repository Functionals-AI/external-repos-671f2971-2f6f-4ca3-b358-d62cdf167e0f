import { FetchProviderOverbookingSlotsResult } from 'api/provider/useFetchProviderOverbookingSlots';
import { UseFetchResponse } from 'hooks/useFetch';
import { useEffect } from 'react';

interface PollOverbookingSlotsProps {
  providerOverbookingSlotsData: UseFetchResponse<FetchProviderOverbookingSlotsResult>;
}

export default function PollOverbookingSlots({
  providerOverbookingSlotsData,
}: PollOverbookingSlotsProps) {
  useEffect(() => {
    const interval = setInterval(() => {
      providerOverbookingSlotsData.refetch();
    }, 30 * 1000);

    return () => clearInterval(interval);
  }, [providerOverbookingSlotsData]);

  return <></>;
}
