import type { Flow } from '@mono/telenutrition/lib/types';
import { FlowValueBasic } from '../modules/flows/flow-engine/workflow-engine/types';
import useGet from './useGet';

interface UseGetAuthReferrerFlowReturn {
  flow: Flow;
  flowState: Record<string, FlowValueBasic>;
}

interface UseGetAuthReferrerFlowParams {
  flowType: 'coordinator' | 'referrer';
}

export default function useGetAuthReferrerFlow(params: UseGetAuthReferrerFlowParams) {
  return useGet<UseGetAuthReferrerFlowReturn, UseGetAuthReferrerFlowParams>({
    path: '/scheduling/flow/config/auth-referrer',
    params,
  });
}
