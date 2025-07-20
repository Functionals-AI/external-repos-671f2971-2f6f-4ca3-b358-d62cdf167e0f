import type { Flow } from '@mono/telenutrition/lib/types';
import { FlowValueBasic } from '../modules/flows/flow-engine/workflow-engine/types';
import useGet from './useGet';

interface UseGetFlowParams {
  flowId: number;
}

interface UseGetFlowReturn {
  flowRecord: {
    createdAt: string;
    flowId: number;
    flowType: string;
    insurance: string;
    state: Record<string, FlowValueBasic>;
    updatedAt: string;
    userId: number;
    appointmentId?: number;
  };
  flowConfig: Flow;
}

export default function useGetFlow(params: UseGetFlowParams) {
  return useGet<UseGetFlowReturn>({ path: `/scheduling/flows/${params.flowId}` });
}
