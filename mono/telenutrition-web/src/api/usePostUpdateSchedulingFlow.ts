import { FlowValueBasic } from '../modules/flows/flow-engine/workflow-engine/types';
import usePost from './usePost';

type FlowState = Record<string, FlowValueBasic>;

export type PostFlowParamsPayload = {
  flowId: number;
  // Not location state, but JSON blob of current state of progress. Basically type is Partial<PostAppointmentParams>;
  state: FlowState;
};

export type PostFlowParams = { payload: PostFlowParamsPayload };

type PostFlowReturn = {
  createdAt: string;
  flowId: number;
  insurance: Record<string, any>;
  state: FlowState;
  timezone: string | null;
  updatedAt: string;
  userId: number;
};

export default function usePostUpdateSchedulingFlow() {
  return usePost<PostFlowParams, PostFlowReturn>({
    path: '/scheduling/update-flow',
  });
}
