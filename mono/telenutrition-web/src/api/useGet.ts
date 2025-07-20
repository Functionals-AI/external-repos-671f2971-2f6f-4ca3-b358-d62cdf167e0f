import { useState, useEffect } from 'react';
import useApiClient from './client';
import { ApiRequestError } from '../utils/errors';
import { useTranslation } from 'react-i18next';

export type ApiGetError = {
  message: string;
  status: number | string;
  trace?: string;
  extra?: number;
};

export type UseApiHookData<T> =
  | {
      data: T;
      error: null;
      isLoading: false;
    }
  | {
      data: null;
      error: ApiGetError;
      isLoading: false;
    }
  | {
      data: null;
      error: null;
      isLoading: boolean;
    };

export type UseGetResponse<T, Params> = UseApiHookData<T> & {
  refetch: () => void;
  doGet: (params: { getParams?: Params; headerToken?: string }) => Promise<T>;
  reset: () => void;
};

type UseGetParams = Record<string, string | number | boolean | string[] | number[]>;

export default function useGet<T = unknown, Params = UseGetParams>({
  path,
  params,
  doInitialGet = true,
  headerToken,
}: {
  path: string;
  params?: Params;
  doInitialGet?: boolean;
  headerToken?: string;
}): UseGetResponse<T, Params> {
  const api = useApiClient();
  const { i18n } = useTranslation();
  const [hasInitialFetched, setHasInitialFetched] = useState(false);
  const [shouldRefetch, setShouldRefetch] = useState(false);
  const [data, setData] = useState<UseApiHookData<T>>({
    data: null,
    error: null,
    isLoading: doInitialGet ? true : false,
  });

  function doGet({
    getParams,
    headerToken,
  }: {
    getParams?: Params;
    headerToken?: string;
  }): Promise<T> {
    setData({ error: null, data: null, isLoading: true });

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
              extra: res.meta.extra,
            },
          });
          throw new ApiRequestError(
            res.meta.message ?? res.meta.error,
            res.meta.error ?? 'get-error',
            res.meta.trace,
            res.meta.extra,
          );
        } else {
          setData({ isLoading: false, data: res.data as T, error: null });
        }

        return res.data as T;
      });
  }

  useEffect(() => {
    if (!doInitialGet) {
      setHasInitialFetched(true);
      return;
    }

    if (hasInitialFetched && !shouldRefetch) return;

    doGet({ getParams: params, headerToken })
      .catch((e) => {
        setData((d) => ({
          isLoading: false,
          data: null,
          error: {
            message: 'There was an error with your request',
            status: e.code,
            trace: 'trace' in e ? e.trace : undefined,
            extra: 'extra' in e ? e.extra : undefined,
          },
        }));
      })
      .finally(() => {
        setHasInitialFetched(true);
        setShouldRefetch(false);
      });
  }, [shouldRefetch]);

  function refetch() {
    setShouldRefetch(true);
  }

  function reset() {
    setData({ isLoading: false, data: null, error: null });
  }

  return { ...data, refetch, doGet, reset };
}
