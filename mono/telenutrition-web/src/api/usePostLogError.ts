import usePost from './usePost';

export interface UsePostLogErrorParams {
  payload: {
    error: string;
    stackTrace?: string;
    cid: string;
  };
}

interface UsePostLogErrorResult {
  traceId: string;
}

export default function usePostLogError() {
  return usePost<UsePostLogErrorParams, UsePostLogErrorResult>({
    path: '/scheduling/error',
    method: 'post',
  });
}
