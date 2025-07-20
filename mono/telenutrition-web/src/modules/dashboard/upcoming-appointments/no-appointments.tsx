import { useTranslation } from 'react-i18next';
import CalendarNoAppointments from '../../../../public/calendar-no-appointments.svg';

export default function NoAppointments() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center overflow-hidden">
      <CalendarNoAppointments />
      <h3 className="font-bold text-3xl text-neutral-700">
        {t('NoAppointmentsCurrentlyScheduled', 'No Appointments Currently Scheduled')}
      </h3>
    </div>
  );
}
