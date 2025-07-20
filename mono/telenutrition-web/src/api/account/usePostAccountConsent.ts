import usePost from '../usePost';

type UsePostAccountConsentParams = {
  payload: {
    appConsent: true;
  };
};

export default function usePostAccountConsent() {
  return usePost<UsePostAccountConsentParams>({
    path: '/account/consent',
    method: 'post',
  });
}
