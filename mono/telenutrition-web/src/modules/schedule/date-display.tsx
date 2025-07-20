import { useTranslation } from 'react-i18next';

export default function DateDisplay({ date }: { date: string | null }) {
  const { i18n } = useTranslation();

  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-neutral-400" />
      </div>
      <div className="relative flex justify-center">
        <span className="px-3 bg-white text-lg font-medium text-neutral-1500">
          {date &&
            new Date(date).toLocaleString(i18n.language, {
              month: 'long',
              day: '2-digit',
              year: 'numeric',
            })}
        </span>
      </div>
    </div>
  );
}
