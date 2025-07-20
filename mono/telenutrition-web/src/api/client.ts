import axios, { AxiosRequestConfig } from 'axios';
import { useState } from 'react';
import { useAppStateContext } from '../state/context';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export type PayloadErrType = 'validation' | 'service' | 'not-found' | 'token' | 'booked';

export type ApiResponseSuccessMeta = {
  ok: true;
  total?: number;
  next?: string;
  trace: string;
  offset?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

export type ApiResponseSuccessPayload<T> = {
  meta: ApiResponseSuccessMeta;
  data: T;
};

export type ApiResponseFailureMeta = {
  ok: false;
  error: PayloadErrType;
  message?: string;
  extra?: any;
  trace: string;
}

export type ApiResponseFailurePayload = {
  meta: ApiResponseFailureMeta;
  data: undefined;
};

export type ApiResponsePayload<T = unknown> =
  | ApiResponseSuccessPayload<T>
  | ApiResponseFailurePayload;

export default function useApiClient() {
  const { handleApiError, handlePostSuccess } = useAppStateContext();
  const [client] = useState(() => {
    const client = axios.create({ baseURL: BASE_URL });
    client.interceptors.response.use(
      (response) => response,
      (error) => {
        return handleApiError(error);
      },
    );

    return client;
  });

  return {
    get: async <T = unknown>(
      path: string,
      options?: AxiosRequestConfig,
    ): Promise<ApiResponsePayload<T>> => {
      return client
        .get(path, options)
        .then(({ data }: { data: ApiResponsePayload }) => data as ApiResponsePayload<T>);
    },
    post: async (
      path: string,
      payload: { [k: string]: unknown } | { [k: string]: unknown }[],
      options?: AxiosRequestConfig,
    ): Promise<ApiResponsePayload> => {
      return client.post(path, payload, options).then(({ data }: { data: ApiResponsePayload }) => {
        // Handle auth paths
        return handlePostSuccess(path, data);
      });
    },
    put: async <T extends { [k: string]: unknown } | { [k: string]: unknown }[]>(
      path: string,
      payload: T,
      options?: AxiosRequestConfig,
    ): Promise<ApiResponsePayload> => {
      return client
        .put(path, payload, options)
        .then(({ data }: { data: ApiResponsePayload }) => data);
    },
    patch: async (
      path: string,
      payload: { [k: string]: unknown } | { [k: string]: unknown }[],
      options?: AxiosRequestConfig,
    ): Promise<ApiResponsePayload> => {
      return client
        .patch(path, payload, options)
        .then(({ data }: { data: ApiResponsePayload }) => data);
    },
  };
}
