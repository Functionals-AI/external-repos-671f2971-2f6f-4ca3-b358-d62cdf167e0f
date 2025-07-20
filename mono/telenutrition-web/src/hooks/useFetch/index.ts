'use client';

import { useState, useEffect, useCallback } from 'react';
import useApiClient, {
  ApiResponseFailureMeta,
  ApiResponsePayload,
  ApiResponseSuccessMeta,
} from 'api/client';
import { ApiRequestError } from 'utils/errors';
import { useTranslation } from 'react-i18next';
import { QueryKey, useFetchCache } from './context';
import _ from 'lodash';

export type ApiGetError = {
  message: string;
  status: number | string;
  trace?: string;
};

export type UseApiHookData<T> =
  | {
      data: T;
      error: null;
      isLoading: false;
      meta?: ApiResponseSuccessMeta;
    }
  | {
      data: null;
      error: ApiGetError;
      isLoading: false;
      meta: ApiResponseFailureMeta;
    }
  | {
      data: null;
      error: null;
      isLoading: true;
      meta: null;
    };

export type UseFetchResponse<T> = UseApiHookData<T> & {
  refetch: () => void;
};

type UseFetchParams = Record<string, string | number | boolean | string[] | number[]>;

export type UseFetchTypes<Params extends UseFetchParams, Result> = {
  Params: Params;
  Result: Result;
};

type UseFetchOptions<Params> = {
  params?: Params;
  headerToken?: string;
  backgroundRefetch?: boolean;
  paginated?: boolean;
};

export default function useFetch<Types extends UseFetchTypes<UseFetchParams, any>>({
  path,
  queryKey,
  options,
}: {
  path: string;
  queryKey: QueryKey;
  options?: UseFetchOptions<Types['Params']>;
}): UseFetchResponse<Types['Result']> {
  const api = useApiClient();
  const { getCacheValue, updateCache, cache, invalidateCacheKey } = useFetchCache();
  const { i18n } = useTranslation();
  const [data, setData] = useState<UseApiHookData<Types['Result']>>({
    data: null,
    error: null,
    isLoading: true,
    meta: null,
  });

  const doGet = useCallback(
    async ({
      getParams,
      headerToken,
    }: {
      getParams?: Types['Params'];
      headerToken?: string;
    }): Promise<Types['Result']> => {
      if (!options?.backgroundRefetch) {
        setData({ error: null, data: null, isLoading: true, meta: null });
      }

      return api
        .get(path, {
          params: getParams,
          headers: {
            ...(i18n.language ? { 'Accept-Language': i18n.language } : {}),
            ...(headerToken ? { Authorization: `Bearer ${headerToken}` } : {}),
          },
        })
        .then((res) => {
          if (!res.meta.ok) {
            setData({
              isLoading: false,
              data: null,
              error: {
                message: res.meta.message ?? res.meta.error,
                status: 400,
                trace: res.meta.trace,
              },
              meta: res.meta,
            });
            throw new ApiRequestError(
              res.meta.message ?? res.meta.error,
              res.meta.error ?? 'get-error',
              res.meta.trace,
              res.meta.extra,
            );
          } else {
            setData({
              isLoading: false,
              data: res.data as Types['Result'],
              error: null,
              meta: res.meta,
            });
            updateCache(queryKey, { ...res }, { ttl: options?.paginated ? 3000 : undefined });
          }

          return res.data as Types['Result'];
        });
    },
    [api, i18n.language, options, path, queryKey, updateCache],
  );

  const queryKeyString = queryKey.join(',');

  useEffect(() => {
    const cachedValue = getCacheValue<Types['Result']>(queryKey);
    if (cachedValue) {
      if (_.isEqual(cachedValue.data, data.data)) return;

      setData({ isLoading: false, data: cachedValue.data, error: null, meta: cachedValue.meta });
      return;
    }

    doGet({ getParams: options?.params, headerToken: options?.headerToken }).catch(
      (e: ApiRequestError) => {
        setData((d) => ({
          isLoading: false,
          data: null,
          error: {
            message: e.message ?? 'There was an error with your request',
            status: e.code,
            trace: 'trace' in e ? e.trace : undefined,
          },
          meta: d.meta as ApiResponseFailureMeta,
        }));
      },
    );
  }, [cache, queryKeyString]);

  const refetch = useCallback(() => {
    invalidateCacheKey(queryKey);
  }, [invalidateCacheKey, queryKey]);

  return { ...data, refetch };
}
