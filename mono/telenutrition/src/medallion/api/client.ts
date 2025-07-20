import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { IContext } from '@mono/common/src/context';
import axiosRetry from 'axios-retry';

type OnRetryFunction = (retryCount: number, error: Error, requestConfig: AxiosRequestConfig) => void;

function setOnRetry(axiosInstance: AxiosInstance, onRetry: OnRetryFunction) {
  const retryConfig = {
      retries: 5,
      retryDelay: (retryCount) => Math.pow(2, retryCount) * 1000,
      retryCondition: (error) =>
        axiosRetry.isNetworkOrIdempotentRequestError(error) ||
        (error.response ? error.response.status >= 500 : false),
      onRetry: onRetry,
    };
    axiosRetry(axiosInstance, retryConfig);
}

function getClient(context: IContext, tag: string, onRetry: OnRetryFunction | null = null): AxiosInstance {
  const axiosInstance = axios.create();
  
  if (onRetry) {
    setOnRetry(axiosInstance, onRetry);
  } else {
    const { logger } = context;
    tag = `${tag}.retryAxios`

    setOnRetry(axiosInstance, (retryCount: number, error: Error, requestConfig: AxiosRequestConfig) => {
      logger.warn(context, tag, `API Error from ${requestConfig.url}`, { error: error.message });
      logger.warn(context, tag, `Retry attempt #${retryCount} in ${Math.pow(2, retryCount)} seconds..`);
    });
  }
  return axiosInstance;
}

export default getClient;
