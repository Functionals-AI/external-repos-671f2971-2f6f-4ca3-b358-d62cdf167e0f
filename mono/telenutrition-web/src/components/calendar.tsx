import ReactCalendar, { CalendarProps as ReactCalendarProps } from 'react-calendar';
import { useTranslation } from 'react-i18next';

type CalendarProps = ReactCalendarProps;

export default function Calendar(props: CalendarProps) {
  const { i18n } = useTranslation();
  return <ReactCalendar next2Label={null} prev2Label={null} {...props} locale={i18n.language} />;
}
