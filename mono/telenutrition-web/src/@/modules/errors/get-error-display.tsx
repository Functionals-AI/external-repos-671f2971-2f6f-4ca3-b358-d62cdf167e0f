import { Button } from '@/ui-components/button';
import { ApiGetError } from 'api/useGet';
import { Trans } from 'react-i18next';
import { ReportIssueButton} from '@/smart-components/report-issue-button'

export const SUPPORT_LINK = 'https://zipongosupport.zendesk.com/hc/en-us';

interface GetErrorDislpayProps {
  error: ApiGetError;
  refetch: () => void;
}

export default function GetErrorDislpay({ error, refetch }: GetErrorDislpayProps) {
  return (
    <div className="h-full w-full flex flex-col gap-y-4 items-center justify-center">
      <h4>
        <Trans>There was an error with the request</Trans>
      </h4>
      {error.message && <p>{error.message}</p>}
      {error.trace && <p>Trace ID: {error.trace}</p>}
      <div className="flex gap-x-8">
        <Button variant="secondary" onClick={() => window.open(SUPPORT_LINK, '_blank')}>
          <Trans>Contact support</Trans>
        </Button>

        <ReportIssueButton error={error} />
        <Button onClick={refetch}>
          <Trans>Try again</Trans>
        </Button>
      </div>
    </div>
  );
}
