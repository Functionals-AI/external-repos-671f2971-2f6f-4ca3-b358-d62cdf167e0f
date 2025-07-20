import { useAppStateContext } from '../state/context';
import usePost from './usePost';
import { v4 as uuidv4 } from 'uuid';

export type PostEvent = {
  id: string;
  app: string;
  type:
    | 'view'
    | 'form_submission'
    | 'workflow_view'
    | 'submission_success'
    | 'click'
    | 'flow_initialized'
    | 'flow_restarted';
  name: string;
  time: number;
  meta: {
    cid?: string;
    uid?: string;
    platform: 'web';
    device: string;
    location: string;
    referrer: string;
    params: string;
    timezone: string;
    version: string;
  };
  data?: Record<string, number | string | number[] | string[]>;
};

interface UsePostEventsParams {
  payload: PostEvent[];
}

export default function usePostEvent(options: { ignorePost?: boolean; pathname: string }) {
  const { getAppState } = useAppStateContext();

  const { post, ...rest } = usePost<UsePostEventsParams>({ path: '/scheduling/events' });

  const customPost = (
    fields: Required<Pick<PostEvent, 'type' | 'name'>> & Pick<PostEvent, 'data'>,
  ) => {
    if (options.ignorePost) return;

    const { cid } = getAppState();
    const event: PostEvent = {
      ...fields,
      id: uuidv4(),
      app: 'telenutrition',
      time: (Date.now() / 1000) | 0,
      meta: {
        cid: cid || undefined,
        platform: 'web',
        device: navigator.userAgent,
        location: options.pathname,
        params: window.location.search.substring(1),
        referrer: document.referrer,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        version: process.env.NEXT_PUBLIC_VERSION || '',
      },
    };

    console.log('Logging event: ', event);

    return post({ payload: [event] });
  };

  return { ...rest, post: customPost };
}
