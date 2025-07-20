import { IdentityFormFields } from '../../modules/forms/set-identity';
import usePost from '../usePost';
import { PostAuthReturn } from './types';

interface UsePostAuthFederationParams {
  payload: {
    token: string;
    identity?: IdentityFormFields;
  };
}

type UsePostAuthFederationReturn = PostAuthReturn;

export default function usePostAuthFederation() {
  return usePost<UsePostAuthFederationParams, UsePostAuthFederationReturn>({
    method: 'post',
    path: '/auth/federation',
  });
}
