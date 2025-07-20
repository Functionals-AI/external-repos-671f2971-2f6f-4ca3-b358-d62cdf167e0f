import { CalendarItemHour } from '@/selectors/calendarItemsSelector';
import { AppointmentRecord } from 'api/types';
import { Trans } from 'react-i18next';
import { DeveloperError } from 'utils/errors';

const SCHEDULED_STATUSES = ['f', '1', '2', '3', '4'];

const isScheduledAppointment = (appt: AppointmentRecord) =>
  SCHEDULED_STATUSES.some((status) => status === appt.status);

interface RenderCellProps {
  item: { item: CalendarItemHour; type: 'top' | 'middle' };
}

export default function RenderCell({ item }: RenderCellProps) {
  if (item.item.type === '60-minute-unavailable') {
    return <div className="w-full h-full bg-neutral-115"></div>;
  }

  if (item.item.type === '60-minute-available') {
    return <div className="w-full h-full bg-status-green-100"></div>;
  }

  if (item.item.type === '60-minute-appointment') {
    return (
      <div className="w-full h-full bg-fs-green-100 text-sm flex items-center px-2">Scheduled</div>
    );
  }

  if (item.item.type === 'has-conflicting') {
    return (
      <div className="w-full h-full bg-status-red-100 text-sm flex items-center px-2 text-status-red-800">
        <Trans>Conflicts</Trans>
      </div>
    );
  }

  if (item.item.type === '30-minute-slots') {
    const appt = item.type === 'top' ? item.item.topOfHourAppt : item.item.middleOfHourAppt;
    if (!appt) {
      return <div className="w-full h-full bg-neutral-115"></div>;
    } else if (isScheduledAppointment(appt)) {
      return (
        <div className="w-full h-full bg-fs-green-100 text-sm flex items-center px-2">
          <Trans>Scheduled</Trans>
        </div>
      );
    } else if (appt.status === 'o') {
      return <div className="w-full h-full bg-status-green-100"></div>;
    }
  }

  throw new DeveloperError('Unhandled case for cell rendering in availability feature.');
}
