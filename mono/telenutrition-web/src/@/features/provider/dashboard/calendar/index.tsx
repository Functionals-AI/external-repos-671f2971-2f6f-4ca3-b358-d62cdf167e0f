import { useMemo } from 'react';
import { groupBy } from 'lodash';

import { useProviderDashboardContext } from '../context';
import {
  useFetchProviderAppointments,
  UseGetProviderAppointmentsResult,
} from 'api/provider/useGetProviderAppointments';
import DayView from './single-day-calendar';
import ContainerLoading from '@/ui-components/loading/container-loading';
import GetErrorDislpay from '@/modules/errors/get-error-display';
import WeekView from './week-view-calendar';
import PollOverbookingSlots from '../poll-overbooking-slots';
import SidePanel from '../side-panel';
import { SidePanelProvider } from '../side-panel/context';

export default function ProviderCalendarWrapper() {
  const { data, isLoading, error, refetch } = useFetchProviderAppointments();
  const { providerOverbookingSlotsData, timezone } = useProviderDashboardContext();

  if (isLoading) return <ContainerLoading />;
  if (error) return <GetErrorDislpay refetch={refetch} error={error} />;

  return (
    <SidePanelProvider appointmentData={data} timezone={timezone}>
      {providerOverbookingSlotsData && (
        <PollOverbookingSlots providerOverbookingSlotsData={providerOverbookingSlotsData} />
      )}
      <div className="flex gap-4 px-4 py-4 h-full overflow-y-scroll">
        <div className="h-full flex flex-col w-full gap-2">
          <ProviderCalendar data={data} />
        </div>
        <div className="hidden md:block flex-grow h-full relative" style={{ minWidth: '20rem' }}>
          <SidePanel />
        </div>
      </div>
    </SidePanelProvider>
  );
}

function ProviderCalendar({ data }: { data: UseGetProviderAppointmentsResult }) {
  const { viewType } = useProviderDashboardContext();
  const appointmentsByDay = useMemo(() => groupBy(data.slots, (slot) => slot.date), [data.slots]);

  if (viewType === 'single-day') {
    return <DayView appointmentsByDay={appointmentsByDay} timezone={data.timezone} />;
  }

  if (viewType === 'week') {
    return <WeekView appointmentsByDay={appointmentsByDay} timezone={data.timezone} />;
  }

  return null;
}
