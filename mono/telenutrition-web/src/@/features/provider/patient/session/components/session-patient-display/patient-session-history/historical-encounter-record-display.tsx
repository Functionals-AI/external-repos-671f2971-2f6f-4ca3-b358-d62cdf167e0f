import {
  BasicCollapsibleTrigger,
  Collapsible,
  CollapsibleContent,
} from '@/ui-components/collapsible';
import { cn } from '@/utils';
import { HistoricalEncounterData } from 'api/types';
import _ from 'lodash';
import { Trans } from 'react-i18next';
import parse from 'html-react-parser';

export default function HistoricalEncounterRecordDisplay({
  encounterData,
}: {
  encounterData: HistoricalEncounterData;
}) {
  if (!encounterData.historicalEncounter || !encounterData.historicalEncounter.rawData) {
    return (
      <div>
        <Trans>No charting data available</Trans>
      </div>
    );
  }

  return (
    <Collapsible className={cn('data-[state=open]:pb-6')}>
      <BasicCollapsibleTrigger label={'Charting data'} className="py-0 text-neutral-600" />
      <CollapsibleContent className="pl-5">
        <div className="flex flex-col gap-y-4 mt-4">
          {Object.entries(encounterData.historicalEncounter.rawData).map(([key, value]) => {
            return (
              <div key={key} className="flex flex-col">
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
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
