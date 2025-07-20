import type { Flow } from '@mono/telenutrition/lib/types';
import { FlowValueBasic } from '../modules/flows/flow-engine/workflow-engine/types';
import useGet from './useGet';

export interface UseGetReferralFlowReturn {
  flow: Flow;
  flowState: Record<string, FlowValueBasic>;
}

export default function useGetReferralFlow() {
  return useGet<UseGetReferralFlowReturn>({
    path: '/scheduling/flow/config/referral',
  });
}
