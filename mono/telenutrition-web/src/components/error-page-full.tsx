import Link from 'next/link';
import Button from './button';
import HeaderSubheader from './header-subheader';
import { useTranslation } from 'react-i18next';

interface ErrorPageFullProps {
  link?: string;
  message?: string;
  status?: string | number;
}

export default function ErrorPageFull(props: ErrorPageFullProps) {
  const { t } = useTranslation();
  const message =
    props.message ??
    t(
      'NeedToRestartSchedulingProcess',
      'You need to restart the scheduling process to access this page',
    );
  const { link = '/schedule', status } = props;
  return (
    <>
      <HeaderSubheader header="Page not accessible" />
      <div className="bg-white">
        <div className="max-w-7xl mx-auto text-center py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
          <h3>
            {status ? `${status}: ` : ''}
            {message}
          </h3>
          <div className="mt-8 flex justify-center">
            <div className="inline-flex rounded-md shadow">
              <Link href={link}>
                <Button>{t('StartOver', 'Start over')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
