import usePost from './usePost';
import type { Flow as IFlow } from '@mono/telenutrition/lib/types';

type PostFlowV2Params = {
  payload: {
    patientId: number;
  };
};

type PostFlowV2Return = {
  flow: IFlow;
  state: Record<string, string | number | string[] | boolean>;
  flowId: number;
};

export default function usePostCreateFlow() {
  return usePost<PostFlowV2Params, PostFlowV2Return>({
    path: '/scheduling/create-flow',
  });
}
