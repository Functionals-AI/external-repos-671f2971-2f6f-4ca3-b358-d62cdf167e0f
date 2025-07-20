'use client';
// To be used in /app folder

import _ from 'lodash';
import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type UseGetQueryParamReturn<ParamResultType extends string | number> =
  | { loading: true }
  | { loading: false; ok: true; value: ParamResultType }
  | { ok: false; loading: false };

export default function useGetAppQueryParam<
  ParamType extends 'string' | 'number',
  ParamResultType extends string | number = ParamType extends 'number' ? number : string,
>(key: string, type?: ParamType): UseGetQueryParamReturn<ParamResultType> {
  const params = useParams();
  const searchParams = useSearchParams();
  const [value, setValue] = useState<UseGetQueryParamReturn<ParamResultType>>({ loading: true });

  useEffect(() => {
    if (!params || !searchParams) return;

    let found;
    if (params?.[key]) {
      found = params?.[key];
    } else if (searchParams.get(key)) {
      found = searchParams.get(key);
    }

    if (!found) {
      setValue({ ok: false, loading: false });
      return;
    }

    if (typeof found === 'object') {
      setValue({ ok: false, loading: false });
      return;
    }

    if (type === 'number') {
      const valueAsNum = parseInt(found);
      if (_.isNaN(valueAsNum)) {
        setValue({ ok: false, loading: false });
        return;
      }
      setValue({ ok: true, loading: false, value: valueAsNum as ParamResultType });
      return;
    }

    if (type === 'string') {
      setValue({ ok: true, loading: false, value: found as ParamResultType });
      return;
    }
  }, [params]);

  return value;
}
