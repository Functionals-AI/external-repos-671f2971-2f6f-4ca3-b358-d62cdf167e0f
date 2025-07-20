import { useEffect } from 'react';
import usePostEvent from '../api/usePostEvent';
import { useRouter } from 'next/router';

export default function useEventPageLogger() {
  const router = useRouter();
  const { post: postEvent } = usePostEvent({ pathname: router.pathname });

  useEffect(() => {
    // run setTimeout to give next time to save CID in store before posting event.
    const timeout = setTimeout(() => {
      postEvent({
        type: 'view',
        name: 'webpage',
      });
    }, 1);

    return () => clearTimeout(timeout);
  }, [router.pathname]);
}
