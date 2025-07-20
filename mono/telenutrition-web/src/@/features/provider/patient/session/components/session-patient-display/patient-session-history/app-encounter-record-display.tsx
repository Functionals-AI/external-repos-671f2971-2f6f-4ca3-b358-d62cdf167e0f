import { ChartingDataDisplay } from '@/features/provider/session-details/charting-notes';
import {
  BasicCollapsibleTrigger,
  Collapsible,
  CollapsibleContent,
} from '@/ui-components/collapsible';
import { cn } from '@/utils';
import { CompleteAppEncounterData } from 'api/types';

interface AppEncounterRecordDisplayProps {
  encounterData: CompleteAppEncounterData;
}

export default function AppEncounterRecordDisplay({
  encounterData,
}: AppEncounterRecordDisplayProps) {
  return (
    <>
      {encounterData.displayChartingData && (
        <ChartingDataDisplay
          displayValues={encounterData.displayChartingData}
          renderGroup={({ renderChildren, group, depth }) => {
            if (['member_details'].includes(group.groupKey)) {
              return null;
            }

            const children = renderChildren();

            if (!children) return null;

            return (
              <div key={group.title}>
                <Collapsible className={cn('data-[state=open]:pb-6')}>
                  <BasicCollapsibleTrigger label={group.title} className="py-0 text-neutral-600" />
                  <CollapsibleContent className="pl-5">{children}</CollapsibleContent>
                </Collapsible>
                {depth === 0 && <div className="h-[1px] w-full mt-2 bg-neutral-150" />}
              </div>
            );
          }}
        />
      )}
    </>
  );
}
