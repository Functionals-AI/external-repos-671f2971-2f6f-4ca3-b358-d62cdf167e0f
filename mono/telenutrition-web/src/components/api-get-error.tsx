import { ExclamationCircleIcon } from '@heroicons/react/solid';
import Button from './button';
import { useTranslation } from 'react-i18next';
import SupportButton from './support-button';
import { ApiGetError as TApiGetError } from '../api/useGet';
import { ReportIssueButton } from '@/smart-components/report-issue-button'

interface ApiGetErrorProps {
  message?: string[] | string | null;
  refetch: () => void;
  error: TApiGetError | null;
}

export default function ApiGetError(props: ApiGetErrorProps) {
  const { t } = useTranslation();
  const message =
    props.message ?? t('ThereWasAnErrorWithYourRequest', 'There was an error with your request');
  return (
    <div className="flex flex-col items-center gap-y-6">
      <ExclamationCircleIcon className="w-20 h-20 fill-f-red" />
      {!!message && (
        <>
          {Array.isArray(message) ? (
            <>
              {message.map((msg) => (
                <p key={msg}>{msg}</p>
              ))}
            </>
          ) : (
            <p>{message}</p>
          )}
        </>
      )}
      {props.error?.trace && <p>Trace Id: {props.error.trace}</p>}
      <div className="flex gap-x-8">
        <Button onClick={props.refetch}>{t('TryAgain', 'Try Again')}</Button>
        <ReportIssueButton error={{ message: props.error ? props.error.message : props.message, trace: props.error?.trace }} />
        <SupportButton variant="secondary" />
      </div>
    </div>
  );
}
