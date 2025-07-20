import type { Flow } from '@mono/telenutrition/lib/types';
import { FlowValueBasic } from '../modules/flows/flow-engine/workflow-engine/types';
import useGet from './useGet';

interface UseGetAddPatientFlowResult {
  flow: Flow;
  flowState: Record<string, FlowValueBasic>;
}

export default function useGetAddPatientFlow() {
  return useGet<UseGetAddPatientFlowResult>({
    path: '/scheduling/flow/config/add-patient',
  });
}
