import Card from '@/ui-components/card';
import Container from '@/ui-components/container';
import { ScrollingGroupProvider } from '@/modules/scrolling-group-manager/context';
import useScrollingGroupManager from '@/modules/scrolling-group-manager/useScrollingGroupManager';
import { ReactNode } from 'react';
import { AppointmentRecord, CompleteAppEncounterData } from 'api/types';
import { cn } from '@/utils';
import ScrollingGroup from '@/modules/scrolling-group-manager/group';
import _ from 'lodash';
import StepsNav from '../patient/session/components/steps-nav';
import VisitChartingDetails from './visit-charting-details';
import HyperlinkedText from '@/ui-components/hyperlinked-text';
import { DeveloperError } from 'utils/errors';
import { QuestionnaireDisplayValue } from "@mono/telenutrition/lib/types";
import { Trans } from "react-i18next";

// This page is for in-app completed encounters
export default function ChartingNotes({
  encounterData,
  appointment,
  readOnly,
}: {
  encounterData: CompleteAppEncounterData;
  appointment: AppointmentRecord;
  readOnly: boolean;
}) {
  const scrollingGroupManager = useScrollingGroupManager();
  const { encounter } = encounterData;

  if (!encounter) {
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

  if (!('displayChartingData' in encounterData)) {
    throw new DeveloperError(
      'Should not be able to access charting notes without display charting data',
    );
  }

  return (
    <Container>
      <div className="flex flex-col md:flex-row flex-1 gap-4 h-full">
        <VisitChartingDetails appointment={appointment} encounter={encounter} readOnly={readOnly} />
        <Card className="flex w-full max-h-[80vh] h-full" style={{ flex: 4 }}>
          {!encounterData.displayChartingData ? (
            <div>
              <h4>
                <Trans>Unable to calculate charting data from past visit.</Trans>
              </h4>
            </div>
          ) : (
            <div className="flex flex-1">
              <div className="border-r border-r-neutral-115 p-4 flex flex-col gap-y-4 w-60 h-[80vh] sticky top-0">
                <StepsNav
                  {...scrollingGroupManager}
                  groups={(
                    encounterData.displayChartingData.filter(
                      (topLevel) => topLevel.type === 'group',
                    ) as Extract<QuestionnaireDisplayValue, { type: 'group' }>[]
                  )
                    .filter((group) => group.groupKey !== 'member_details')
                    .map((group) => ({ title: group.title, widgets: group.children }))}
                />
              </div>
              <div className="flex-1 h-full">
                <div
                  ref={scrollingGroupManager.containerRef}
                  className={'overflow-y-scroll py-4 h-full overflow-x-hidden px-4'}
                >
                  <ScrollingGroupProvider {...scrollingGroupManager}>
                    <ChartingDataDisplay
                      displayValues={encounterData.displayChartingData}
                      renderGroup={({ renderChildren, group, depth }) => {
                        if (['member_details'].includes(group.groupKey)) {
                          return null;
                        }

                        const children = renderChildren();

                        if (!children)
                          return (
                            <ScrollingGroup key={group.groupKey} name={group.groupKey}>
                              <div>
                                <h3 className={cn('text-xl text-neutral-600')}>{group.title}</h3>
                                <p>-</p>
                              </div>
                            </ScrollingGroup>
                          );

                        return (
                          <ScrollingGroup key={group.groupKey} name={group.groupKey}>
                            <div className={cn('flex flex-col gap-y-4')}>
                              <h3
                                className={cn(
                                  'text-2xl text-neutral-600',
                                  depth === 1 && 'text-xl',
                                )}
                              >
                                {group.title}
                              </h3>
                              {children}
                            </div>
                          </ScrollingGroup>
                        );
                      }}
                    />
                  </ScrollingGroupProvider>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </Container>
  );
}

type ChartingDataDisplayProps = {
  depth?: number;
  displayValues: QuestionnaireDisplayValue[];
  renderGroup: ({
    renderChildren,
    group,
  }: {
    depth: number;
    renderChildren: () => ReactNode | null;
    group: {
      type: 'group';
      title: string;
      groupKey: string;
      children: QuestionnaireDisplayValue[];
    };
  }) => ReactNode;
};

export function ChartingDataDisplay({
  displayValues,
  renderGroup,
  depth = 0,
}: ChartingDataDisplayProps) {
  return (
    <div className={cn('flex flex-col pt-2 gap-y-3')}>
      {displayValues?.map((value) => {
        if (value.type === 'group') {
          return renderGroup({
            group: value,
            depth: depth,
            renderChildren: () =>
              value.children.length > 0 ? (
                <ChartingDataDisplay
                  displayValues={value.children}
                  renderGroup={renderGroup}
                  depth={depth + 1}
                />
              ) : null,
          });
        }

        if (value.type === 'text') {
          return (
            <div key={value.question} className="flex flex-col">
              <p className="text-sm text-neutral-1500">{value.question}</p>
              <p className="text-base font-bold text-neutral-1500">
                <HyperlinkedText text={value.text} />
              </p>
              {value.bullets && (
                <ul className="list-disc pl-4 text-base font-bold text-neutral-1500">
                  {value.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        }
      })}
    </div>
  );
}
