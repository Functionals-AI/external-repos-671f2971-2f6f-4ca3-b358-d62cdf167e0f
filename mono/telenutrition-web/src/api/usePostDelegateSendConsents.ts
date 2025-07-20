import { EmailXOrPhone } from '../hooks/useGetEmailPhoneFromQuery';
import usePost from './usePost';

type UsePostDelegateSendConsentsParams = {
  payload: EmailXOrPhone;
};

export default function usePostDelegateSendConsents() {
  return usePost<UsePostDelegateSendConsentsParams>({
    path: '/scheduling/delegate/send-consents',
    method: 'post',
  });
}
