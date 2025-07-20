import type { Flow } from '@mono/telenutrition/lib/types';
import { FlowValueBasic } from '../modules/flows/flow-engine/workflow-engine/types';
import useGet from './useGet';

interface UseGetProviderSchedulingFlowParams {
  // comma separated list here
  appointmentIds: string;
  patientId: string;
  cid: string;
  providerId?: number;
}

export interface UseGetProviderSchedulingFlowReturn {
  flow: Flow;
  flowState: Record<string, FlowValueBasic>;
}

export default function useGetProviderSchedulingFlow(params: UseGetProviderSchedulingFlowParams) {
  return useGet<UseGetProviderSchedulingFlowReturn, UseGetProviderSchedulingFlowParams>({
    path: '/scheduling/flow/config/provider-scheduling',
    params,
  });
}
