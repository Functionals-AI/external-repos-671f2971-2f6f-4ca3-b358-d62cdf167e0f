import { FlowValueBasic } from '../modules/flows/flow-engine/workflow-engine/types';
import usePost from './usePost';

interface UsePostReferralParams {
  payload: {
    state: Record<string, FlowValueBasic>;
  };
}

/** Use this after referral flow is complete */
export default function usePostReferral() {
  return usePost<UsePostReferralParams, {}>({
    method: 'post',
    path: '/scheduling/referral',
  });
}
