import { UseGetAccountReturn } from './useGetAccount';
import usePost from '../usePost';

type UsePatchUpdateAccountParams = {
  payload: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    zipCode?: string;
    birthday?: string;
    password?: string;
  };
};

type UsePatchUpdateAccountReturn = UseGetAccountReturn;

export default function usePatchUpdateAccount() {
  return usePost<UsePatchUpdateAccountParams, UsePatchUpdateAccountReturn>({
    path: '/account',
    method: 'patch',
  });
}
