'use client';

import { TimezoneContext } from '@/modules/dates/context';
import { useFetchProviderTimezone } from 'api/provider/useGetProviderTimezone';
import { useContext, useEffect } from 'react';

export default function UseProviderTimezone() {
  const { data, isLoading, error } = useFetchProviderTimezone();
  const ctx = useContext(TimezoneContext);

  useEffect(() => {
    if (data) {
      ctx?.setTimezone(data.timezone);
    }
  }, [data]);

  return null;
}
