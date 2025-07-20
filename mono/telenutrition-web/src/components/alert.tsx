import { useTranslation } from 'react-i18next';
import classNames from '../utils/classNames';

interface AlertProps {
  title?: string | null;
  subtitle?: string | null;
  onClose: () => void;
  className?: string;
}

export default function Alert({ title, subtitle, onClose, className }: AlertProps) {
  const { t } = useTranslation();
  return (
    <div
      className={classNames(
        'bg-status-red-100 border border-status-red-400 text-status-red-600 px-4 py-3 pr-10 rounded relative',
        className,
      )}
      role="alert"
    >
      {title ? <strong className="font-bold mr-2">{title}</strong> : null}
      {subtitle ? <span className="block sm:inline">{subtitle}</span> : null}
      <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
        <svg
          className="fill-current h-6 w-6 text-status-red-400"
          role="button"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          onClick={onClose}
        >
          <title>{t('Close', 'Close')}</title>
          <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
        </svg>
      </span>
    </div>
  );
}
