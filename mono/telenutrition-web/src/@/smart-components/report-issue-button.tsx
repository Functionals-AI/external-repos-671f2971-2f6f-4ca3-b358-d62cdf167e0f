import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/ui-components/button';
import Icon from '@/ui-components/icons/Icon';

export function getIssueReportSubmissionUrl(errorMessage?: string): string {
  const origin = window?.location?.href;
  const retoolAppBaseUrl = process.env.RETOOL_APP_BASE_URL
    ? process.env.RETOOL_APP_BASE_URL
    : `https://admin.foodsmart${window.location.hostname === 'foodsmart.com' ? '' : '-stg'}.com/apps/`;
  const submissionUrl = retoolAppBaseUrl.concat('daeae73c-7122-11ef-9354-c3a8fe96abfa');
  const queryParams = new URLSearchParams(errorMessage ? { origin, errorMessage } : { origin });
  const fullUrl = [submissionUrl, queryParams].join('?');

  return fullUrl;
}

export function openIssueReportPage(errorMessage?: string): void {
  const issueReportSubmissionUrl = getIssueReportSubmissionUrl(errorMessage);

  window?.open(issueReportSubmissionUrl);
}

// TODO: remove this when intercom_ENG_2121 is live
export function ReportIssueNavItem() {
  const { t } = useTranslation();
  const reportAnIssueText = t('Report an issue');

  return (
    <Button
      variant="tertiary"
      className="w-fit px-2"
      title={reportAnIssueText}
      aria-label={reportAnIssueText}
      onClick={() => openIssueReportPage()}
    >
      <Icon name="alert-circle" color={'neutral-200'} />
    </Button>
  );
}

type ErrorLike =
  | (Error & { trace?: string | null | undefined })
  | {
      message?: string | string[] | null | undefined;
      trace?: string | null | undefined;
    };

interface ReportIssueButtonProps {
  error?: ErrorLike | Error | null;
}

export function ReportIssueButton(props: ReportIssueButtonProps) {
  const { error } = props;
  const { t } = useTranslation();
  const message = useMemo(
    () => (Array.isArray(error?.message) ? error.message.join('\n') : error?.message),
    [error],
  );
  const trace = useMemo(() => (error && 'trace' in error ? error.trace : null), [error]);

  const fullMessage = `${trace ? `[Trace: ${trace}]\n` : ''}${message}`;
  const reportAnIssueText = t('Report an issue');

  return (
    <>
      <Button
        variant="secondary"
        title={reportAnIssueText}
        aria-label={reportAnIssueText}
        leftIcon={{ name: 'bug' }}
        onClick={() => openIssueReportPage(fullMessage)}
      >
        {reportAnIssueText}
      </Button>
    </>
  );
}
