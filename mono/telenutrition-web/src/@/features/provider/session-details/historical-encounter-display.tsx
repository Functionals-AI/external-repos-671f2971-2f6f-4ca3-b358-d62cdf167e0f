import Container from '@/ui-components/container';
import { Trans } from 'react-i18next';
import _ from 'lodash';
import Card from '@/ui-components/card';
import parse from 'html-react-parser';
import { AppointmentRecord, HistoricalEncounterData } from 'api/types';
import VisitChartingDetails from './visit-charting-details';

export default function HistoricalEncounterDisplay({
  encounterData,
  appointment,
  readOnly,
}: {
  encounterData: HistoricalEncounterData;
  appointment: AppointmentRecord;
  readOnly: boolean;
}) {
  if (!encounterData.historicalEncounter) {
    return (
      <Container>
        <div className="flex flex-col gap-y-2">
          <h4>Unknown visit information</h4>
          <p>Appointment ID: {appointment.appointmentId}</p>
          <p>Appointment status: {appointment.status}</p>
          <p>Patient ID: {appointment.patientId}</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="flex flex-col md:flex-row flex-1 gap-4 h-full">
        <VisitChartingDetails
          appointment={appointment}
          encounter={encounterData.historicalEncounter}
          readOnly={readOnly}
        />
        <Card className="flex flex-col w-full max-h-[80vh] h-full py-4 px-2 overflow-y-scroll">
          <h3 className="heading-s text-neutral-600 ml-2">
            <Trans>Charting data</Trans>
          </h3>
          <div className="flex flex-1">
            <div className={'overflow-y-scroll py-4 h-full overflow-x-hidden px-4'}>
              {encounterData.historicalEncounter && encounterData.historicalEncounter.rawData ? (
                <div className="flex flex-col gap-y-4">
                  {Object.entries(encounterData.historicalEncounter.rawData).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-sm text-neutral-1500">{_.startCase(key)}</p>
                      {value && typeof value === 'string' ? (
                        <p className="text-base font-bold text-neutral-1500">
                          <style>
                            {`
                            div > pre {
                              text-wrap: wrap !important;
                            }
                          `}
                          </style>
                          {parse(
                            JSON.stringify(
                              value.replaceAll('\t', '     ').replaceAll('\n', '<br>'),
                            ).slice(1, -1),
                          )}
                        </p>
                      ) : (
                        <div>{JSON.stringify(value)}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <Trans>No encounter information found</Trans>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </Container>
  );
}
