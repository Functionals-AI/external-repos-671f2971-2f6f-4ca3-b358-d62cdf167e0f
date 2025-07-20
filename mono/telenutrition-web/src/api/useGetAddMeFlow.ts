import type { Flow } from '@mono/telenutrition/lib/types';
import { FlowValueBasic } from '../modules/flows/flow-engine/workflow-engine/types';
import useGet from './useGet';

interface UseGetAddMeFlowResult {
  flow: Flow;
  flowState: Record<string, FlowValueBasic>;
}

export default function useGetAddMeFlow() {
  return useGet<UseGetAddMeFlowResult>({
    path: '/scheduling/flow/config/add-me',
  });
}
