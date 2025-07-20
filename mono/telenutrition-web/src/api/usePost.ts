import { useContext, useState } from 'react';
import { ApiRequestError } from '../utils/errors';
import { ApiResponseSuccessPayload } from './client';
import { useTranslation } from 'react-i18next';
import useApiClient from './client';
import { QueryKey, UseFetchCacheContext } from 'hooks/useFetch/context';
import { ApiGetError } from './useGet';

export type UseApiMutationHookData<T> =
  | {
      data: T;
      error: null;
      isSubmitting: false;
    }
  | {
      data: null;
      error: ApiGetError;
      isSubmitting: false;
    }
  | {
      data: null;
      error: null;
      isSubmitting: boolean;
    };

interface PostParams {
  payload: { [k: string]: unknown } | { [k: string]: unknown }[];
}

export type PostFn<P extends PostParams, T> = (
  params: P,
  oneTimeToken?: string,
) => Promise<ApiResponseSuccessPayload<T>>;

interface UsePostReturn<P extends PostParams, T> {
  post: PostFn<P, T>;
  data: UseApiMutationHookData<T>;
  hasFired: boolean;
  resetData: () => void;
}

type PostMethod = 'post' | 'put' | 'patch';

export default function usePost<P extends PostParams, T = unknown>({
  path,
  method = 'post',
  invalidateCacheKeys,
}: {
  path: string;
  method?: PostMethod;
  invalidateCacheKeys?: (QueryKey | '*')[];
}): UsePostReturn<P, T> {
  const { i18n } = useTranslation();
  const api = useApiClient();

  // Do NOT do null check... this hook should still work event without cache.
  const cacheContext = useContext(UseFetchCacheContext);

  const [res, setRes] = useState<UseApiMutationHookData<T>>({
    data: null,
    error: null,
    isSubmitting: false,
  });
  const [hasFired, setHasFired] = useState(false);

  const callAPI: PostFn<P, T> = async (
    params,
    headerToken,
  ): Promise<ApiResponseSuccessPayload<T>> => {
    setRes({ data: null, error: null, isSubmitting: true });

    const postFnMap: Record<PostMethod, typeof api.post> = {
      post: api.post,
      put: api.put,
      patch: api.patch,
    };

    const post = postFnMap[method];

    setHasFired(true);
    const res = await post(path, params.payload, {
      headers: {
        ...(i18n.language ? { 'Accept-Language': i18n.language } : {}),
        ...(headerToken ? { Authorization: `Bearer ${headerToken}` } : {}),
      },
    }).catch((error) => {
      setRes({ data: null, isSubmitting: false, error });
      throw new ApiRequestError(error, 'post-error');
    });

    if (!res.meta.ok) {
      setRes({ data: null, isSubmitting: false, error: { message: res.meta.error, status: 500 } });
      throw new ApiRequestError(
        res.meta.message ?? 'Failed Request',
        res.meta.error,
        res.meta.trace,
        res.meta.extra,
      );
    }

    if (invalidateCacheKeys?.length) {
      invalidateCacheKeys.forEach((key) => {
        if (key === '*') {
          cacheContext?.invalidateAllCache();
        } else {
          cacheContext?.invalidateCacheKey(key);
        }
      });
    }

    setRes({ data: res.data as T, isSubmitting: false, error: null });
    return res as ApiResponseSuccessPayload<T>;
  };

  function resetData() {
    setRes({ data: null, isSubmitting: false, error: null });
  }

  return { post: callAPI, data: res, hasFired, resetData };
}
