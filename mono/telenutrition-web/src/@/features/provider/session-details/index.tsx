import ChartingNotes from './charting-notes';
import { FetchAppointmentEncounterInfoResult } from 'api/encounter/useFetchAppointmentEncounterInfo';
import HistoricalEncounterDisplay from './historical-encounter-display';
import { DeveloperError } from 'utils/errors';
import {
  isAppEncounterData,
  isAppEncounterDataComplete,
  isHistoricalEncounterData,
} from 'api/types';

export default function SessionDetailsFeature({
  data,
  readOnly = false,
}: {
  data: FetchAppointmentEncounterInfoResult;
  readOnly?: boolean;
}) {
  if (isAppEncounterData(data.encounterData)) {
    throw new DeveloperError(
      'Encounter data is not complete - should not allow access to display page.',
    );
  }
  if (isAppEncounterDataComplete(data.encounterData)) {
    return (
      <ChartingNotes
        readOnly={readOnly}
        appointment={data.appointmentDetails.appointment}
        encounterData={data.encounterData}
      />
    );
  } else if (isHistoricalEncounterData(data.encounterData)) {
    return (
      <HistoricalEncounterDisplay
        appointment={data.appointmentDetails.appointment}
        encounterData={data.encounterData}
        readOnly={readOnly}
      />
    );
  }

  throw new DeveloperError(`Unknown encounter type: ${JSON.stringify(data)}`);
}
