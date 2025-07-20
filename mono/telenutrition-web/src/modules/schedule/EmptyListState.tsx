import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

interface ListEmptyStateProps {
  selectedDates?: null | [Date, Date];
}

export const ListEmptyState = ({ selectedDates }: ListEmptyStateProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex justify-center px-12 py-4">
      {!!selectedDates ? (
        <p>
          {t('NoAppointmentsForWeek', 'There are no appointments for the week of {{week}}', {
            week: `${dayjs(selectedDates[0]).format('MMMM D')} - ${dayjs(selectedDates[1]).format(
              'MMMM D',
            )}`,
          })}
          {t(
            'PleaseUseCalendarToSelectTime',
            'Use the calendar to browse other weeks or months to find an appointment time.',
          )}
          <br />
          <br />
          {t(
            'DontSeeTimeThatWorks',
            `Don't see a time that works for you on our current schedule?`,
          )}
          {t(
            'PleaseClickHereToRequestAppointment',
            'Please click {{link}} to request an appointment',
            {
              link: `<a
                  className="text-blue-600"
                  href="https://phreesia.me/CentralVisitRequest"
                  target="_blank"
                >
                  {t('Here', 'here')}
                </a>`,
              interpolation: { escapeValue: false },
            },
          )}
        </p>
      ) : (
        <div>{t('NoDateRangeSelected', 'No date range selected')}</div>
      )}
    </div>
  );
};
