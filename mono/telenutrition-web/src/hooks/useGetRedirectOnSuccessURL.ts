import _ from 'lodash';
import { useRouter } from 'next/router';

const useGetRedirectOnSuccessURL = ({ fallback }: { fallback: string }): string => {
  const router = useRouter();
  const { redirect_on_success: redirectOnSuccess } = router.query;

  if (_.isString(redirectOnSuccess)) {
    const split = redirectOnSuccess.split(',');
    if (!split.length) return fallback;
    if (split.length === 1) return split[0];

    const main = split[0];
    const remaining = split.slice(1).join(',');
    return `${main}?redirect_on_success=${remaining}`;
  }
  if (_.isArray(redirectOnSuccess)) {
    if (!redirectOnSuccess.length) return fallback;

    const main = redirectOnSuccess[0];
    const remaining = redirectOnSuccess.slice(1).join(',');

    return `${main}?redirect_on_success=${remaining}`;
  }

  return fallback;
};

export default useGetRedirectOnSuccessURL;
