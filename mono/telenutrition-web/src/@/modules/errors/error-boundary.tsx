'use client'; // Error boundaries must be Client Components

import { Button } from '@/ui-components/button';
import usePostLogError from 'api/usePostLogError';
import { useEffect, useState } from 'react';
import { Trans } from 'react-i18next';
import localStorageHelpers from 'utils/localStorageHelpers';
import { ReportIssueButton} from '@/smart-components/report-issue-button'

const SUPPORT_LINK = 'https://zipongosupport.zendesk.com/hc/en-us';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showMore, setShowMore] = useState(false);
  const { post: postLogError, data } = usePostLogError();

  useEffect(() => {
    postLogError({
      payload: {
        error: `${error.name}; ${error.message}`,
        stackTrace: error.stack,
        cid: localStorageHelpers.get('cid') ?? 'unknown_cid',
      },
    })
      .then(() => {})
      .catch((e) => {});
  }, [error]);

  return (
    <div className="h-full w-full flex flex-col gap-y-4 items-center justify-center">
      <h4>
        <Trans>There was an error with the request</Trans>
      </h4>
      {error.name && <p className="font-semibold text-lg">Error: {error.name}</p>}
      {error.message && <p>{error.message}</p>}
      {data.data?.traceId && <p>Trace ID: {data.data.traceId}</p>}
      <div className="flex gap-x-8">
        <Button variant="secondary" onClick={() => window.open(SUPPORT_LINK, '_blank')}>
          <Trans>Contact support</Trans>
        </Button>
        <ReportIssueButton error={error} />
        <Button onClick={reset}>
          <Trans>Try again</Trans>
        </Button>
      </div>
      <div className="mt-8 flex flex-col gap-y-2">
        <Button variant="tertiary" onClick={() => setShowMore(!showMore)}>
          {!showMore ? <Trans>Show more</Trans> : <Trans>Show less</Trans>}
        </Button>
        {showMore && JSON.stringify(error)}
      </div>
    </div>
  );
}
