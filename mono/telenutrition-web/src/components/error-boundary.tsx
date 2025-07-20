import { TFunction } from 'i18next';
import React, { ErrorInfo } from 'react';
import { useTranslation } from 'react-i18next';
import { useModalManager } from '../modules/modal/manager';
import Button from './button';
import SupportButton from './support-button';
import usePostLogError, { UsePostLogErrorParams } from '../api/usePostLogError';
import Loading from './loading';
import { PostFn } from '../api/usePost';
import { ApiRequestError } from '../utils/errors';
import { AppState } from '../state/types';
import { useAppStateContext } from '../state/context';
import { ReportIssueButton} from '@/smart-components/report-issue-button'

type Props = {
  children: React.ReactNode;
  t: TFunction;
  modalManager: ReturnType<typeof useModalManager>;
  postLogError: PostFn<UsePostLogErrorParams, unknown>;
  getAppState: () => AppState;
};

type ErrorLoggingComplete = { hasLogged: true } & ({ traceId: string } | { error: true });

type ErrorLogging = { hasLogged: false } | ErrorLoggingComplete;

type State = { hasError: boolean; caughtError: Error | null, errorLogging: ErrorLogging; additionalErrorInfo: string | null };

/**
 * General catch-all for thrown errors on client side.
 * Sends to API to generate traceId to show to user for support.
 */
class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      hasError: false,
      caughtError: null,
      errorLogging: { hasLogged: false },
      additionalErrorInfo: null,
    };
  }

  componentDidMount() {
    const { postLogError, getAppState } = this.props;

    window.onerror = function (message, source, lineNum, colNum, error) {
      const errorMessage = error?.message ?? 'An unknown exception was thrown in the application';
      const stack = error?.stack ?? `source: ${source}; line_num: ${lineNum}; col_num: ${colNum}`;
      postLogError({
        payload: {
          stackTrace: stack,
          error: errorMessage,
          cid: getAppState().cid!,
        },
      }).catch(() => {});

      // Return true to suppress the default browser error message
      return true;
    };
  }

  componentWillUnmount() {
    window.onerror = function () {};
  }

  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, caughtError: error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { postLogError, getAppState, t } = this.props;

    // This is probably caused by an external library (such as google translate)
    // that is directly manipulating the DOM.
    if (error.name === 'NotFoundError') {
      this.setState({
        caughtError: error,
        additionalErrorInfo: t(
          'TheErrorMayBeCausedByBrowserExtension',
          'The error may be caused by a browser extension, such as Google Translate. Try disabling the extension and try again.',
        ),
      });
    }

    postLogError({
      payload: {
        error: JSON.stringify(error.message),
        stackTrace: errorInfo.componentStack,
        cid: getAppState().cid!,
      },
    })
      .then((res) => {
        this.setState({ caughtError: error, errorLogging: { hasLogged: true, traceId: res.meta.trace } });
      })
      .catch((res) => {
        if (res instanceof ApiRequestError && res.trace !== undefined) {
          this.setState({ caughtError: error, errorLogging: { hasLogged: true, traceId: res.trace } });
        } else {
          this.setState({ caughtError: error, errorLogging: { hasLogged: true, error: true } });
        }
      });
  }

  render() {
    const { t } = this.props;
    const { hasError, caughtError, errorLogging, additionalErrorInfo } = this.state;

    if (hasError) {
      return (
        <div className="flex items-center justify-center flex-col gap-y-10 mt-20 max-w-3xl px-8 mx-auto">
          <h1 className="text-8xl text-f-dark-green">{t('Oops', 'Oops!')}</h1>
          <h2 className="text-3xl">
            {t('ThereWasAnErrorWithTheApplication', 'There was an error with the application.')}
          </h2>
          {additionalErrorInfo && <h4>{additionalErrorInfo}</h4>}
          {!errorLogging.hasLogged ? (
            <Loading />
          ) : (
            <>
              <p className="text-lg font-bold">
                {t('PleaseContactSupportOrTryAgain', 'Please contact support or try again')}
              </p>
              {'traceId' in errorLogging && <p>Trace ID: {errorLogging.traceId}</p>}
              <div className="flex justify-around w-3/4">
                <SupportButton variant="secondary" size="x-large" />
                <ReportIssueButton error={caughtError} />
                <Button
                  type="button"
                  onClick={() => this.setState({ hasError: false, additionalErrorInfo: null })}
                  size="x-large"
                >
                  {t('TryAgain', 'Try Again')}
                </Button>
              </div>
            </>
          )}
        </div>
      );
    }

    return <>{this.props.children}</>;
  }
}

export default function Wrapper({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const modalManager = useModalManager();
  const { post: postLogError } = usePostLogError();
  const { getAppState } = useAppStateContext();

  return (
    <ErrorBoundary
      t={t}
      modalManager={modalManager}
      postLogError={postLogError}
      getAppState={getAppState}
    >
      {children}
    </ErrorBoundary>
  );
}
