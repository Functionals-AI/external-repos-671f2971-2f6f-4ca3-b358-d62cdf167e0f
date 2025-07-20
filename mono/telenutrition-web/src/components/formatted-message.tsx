import { ReactElement, ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import parse from 'html-react-parser';
export default function FormattedMessage({
  defaultMessage,
  id,
  values,
  components,
}: {
  defaultMessage: string;
  id: string;
  values?: Record<string, ReactNode>;
  components?: Record<string, ReactElement>;
}) {
  const { t } = useTranslation();
  // return <Trans i18nKey={id} defaults={defaultMessage} values={values} components={components} />;
  return <>{parse(t(id, defaultMessage, values))}</>;
}
