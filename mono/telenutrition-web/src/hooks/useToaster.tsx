import { Button, ButtonProps } from '@/ui-components/button';
import { Toast, toast } from 'react-hot-toast';
import SuccessIcon from '../../public/success.svg';
import AlertIcon from '../../public/alert-icon.svg';
import InfoIcon from '../../public/info-icon.svg';
import WarnIcon from '../../public/warn-icon.svg';
import { ReactNode } from 'react';
import { XIcon } from '@heroicons/react/solid';
import { ApiRequestError } from 'utils/errors';
import LinkButton, { LinkButtonProps } from '@/ui-components/button/link';
import { openIssueReportPage } from '@/smart-components/report-issue-button'

type ToastOptions = Partial<
  Pick<
    Toast,
    'id' | 'icon' | 'duration' | 'ariaProps' | 'className' | 'style' | 'position' | 'iconTheme'
  >
>;

type BasicToastParams = {
  title?: string;
  message?: ReactNode;
  options?: ToastOptions;
  cta?: LinkButtonProps;
};

interface ToastComponentProps {
  message?: ReactNode;
  title: string;
  icon: ReactNode;
  id: string;
  type: 'success' | 'info' | 'fail' | 'warn';
  subMessage?: string;
  cta?: LinkButtonProps;
  reportableErrorText?: string;
}

function ToastComponent({ message, title, icon, id, subMessage, type, cta, reportableErrorText }: ToastComponentProps) {
  return (
    <div className="flex gap-x-2">
      {icon}
      <div className="flex-1 flex flex-col max-w-md w-full">
        <h3 className="heading-xxs">{title}</h3>
        {message == undefined ? null : typeof message === 'string' ? <p>{message}</p> : message}
        {subMessage && <p className="text-sm text-neutral-1500">{subMessage}</p>}
        {cta && (
          <div className="flex justify-start mt-1">
            <LinkButton {...cta} />
          </div>
        )}
        {reportableErrorText && (
            <LinkButton className="mt-2" onClick={() => openIssueReportPage(reportableErrorText)}>Report Issue</LinkButton>
        )}
      </div>
      <div>
        <Button
          variant="quaternary"
          onClick={() => toast.dismiss(id)}
          style={{ height: '24px', width: '24px' }}
        >
          <XIcon width={16} height={16} className="fill-neutral-1500 text-neutral-1500" />
        </Button>
      </div>
    </div>
  );
}

export default function useToaster() {
  const defaults: ToastOptions = {
    duration: 10000,
    style: {
      padding: '8px 0',
      margin: '0',
      maxWidth: 'unset',
      boxShadow: 'var(--shadow-hi)',
    },
  };

  return {
    success: ({ title, message, options, cta }: BasicToastParams) => {
      return toast(
        (t) => (
          <ToastComponent
            type="success"
            message={message}
            title={title ?? ''}
            icon={<SuccessIcon width={24} height={24} className={'text-status-green-400'} />}
            id={t.id}
            cta={cta}
          />
        ),
        {
          ...defaults,
          style: {
            ...defaults.style,
            ...options?.style,
            borderLeft: '8px solid var(--status-green-200)',
          },
          ...options,
        },
      );
    },

    fail: ({ title, message, options, cta }: BasicToastParams) => {
      return toast(
        (t) => (
          <ToastComponent
            type="fail"
            message={message}
            title={title ?? ''}
            icon={<AlertIcon width={24} height={24} className={'text-status-red-400'} />}
            id={t.id}
            cta={cta}
            reportableErrorText={[title, message].filter(Boolean).join('\n')}
          />
        ),
        {
          ...defaults,
          style: {
            ...defaults.style,
            ...options?.style,
            borderLeft: '8px solid var(--status-red-400)',
          },
          ...options,
        },
      );
    },

    warn: ({ title, message, options, cta }: BasicToastParams) => {
      return toast(
        (t) => (
          <ToastComponent
            type="warn"
            message={message}
            title={title ?? ''}
            icon={<WarnIcon width={24} height={24} className={'text-status-amber-200'} />}
            id={t.id}
            cta={cta}
          />
        ),
        {
          ...defaults,
          style: {
            ...defaults.style,
            ...options?.style,
            borderLeft: '8px solid var(--status-amber-150)',
          },
          ...options,
        },
      );
    },

    info: ({ title, message, options, cta }: BasicToastParams) => {
      return toast(
        (t) => (
          <ToastComponent
            type="info"
            message={message}
            title={title ?? ''}
            icon={<InfoIcon width={24} height={24} className={'text-blue-400'} />}
            id={t.id}
            cta={cta}
          />
        ),
        {
          ...defaults,
          style: {
            ...defaults.style,
            ...options?.style,
            borderLeft: '8px solid var(--blue-400)',
          },
          ...options,
        },
      );
    },

    apiError: ({
      error,
      message,
      title,
      options,
    }: {
      title: string;
      message?: string;
      error: unknown;
      options?: ToastOptions;
    }) => {
      let trace: string | undefined;
      let subtitle: string | undefined;
      if (error instanceof ApiRequestError) {
        trace = error.trace;
        subtitle = message ?? error.message;
      } else if (error instanceof Error) {
        subtitle = message ?? error.message;
      }
      const subMessage = trace ? `Trace ID: ${trace}` : undefined
      return toast(
        (t) => (
          <ToastComponent
            type="fail"
            message={subtitle}
            title={title}
            icon={<AlertIcon width={24} height={24} className={'text-status-red-400'} />}
            id={t.id}
            subMessage={subMessage}
            reportableErrorText={[title, subtitle, subMessage].filter(Boolean).join('\n')}
          />
        ),
        {
          ...defaults,
          style: {
            ...defaults.style,
            ...options?.style,
            borderLeft: '8px solid #F52A2A',
          },
          duration: 50000,
          ...options,
        },
      );
    },
  };
}
