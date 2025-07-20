import Icon from '@/ui-components/icons/Icon';
import { AsBasicDate } from '@/modules/dates';
import AppEncounterRecordDisplay from './app-encounter-record-display';
import HistoricalEncounterRecordDisplay from './historical-encounter-record-display';
import { ProviderPatientAppointment } from 'api/provider/useFetchProviderPatientAppointments';

export default function HistoryDetail({ session }: { session: ProviderPatientAppointment }) {
  return (
    <div className="flex flex-col">
      <p className="flex gap-x-2 items-center text-neutral-1500">
        <Icon name="calendar" size="md" color="neutral-200" />
        <AsBasicDate format="full">{session.appointment.startTimestamp}</AsBasicDate>
      </p>
      <div className="flex gap-x-2">
        <div className="px-3 py-2">
          <div className="w-[1px] h-full bg-neutral-150" />
        </div>
        <div className="flex flex-col flex-1 pt-2">
          {session.encounterData?.type === 'app-complete' ? (
            <AppEncounterRecordDisplay encounterData={session.encounterData} />
          ) : session.encounterData?.type === 'historical' ? (
            <HistoricalEncounterRecordDisplay encounterData={session.encounterData} />
          ) : (
            <p className="text-neutral-600 mt-2 mb-2">Incomplete</p>
          )}
        </div>
      </div>
    </div>
  );
}
