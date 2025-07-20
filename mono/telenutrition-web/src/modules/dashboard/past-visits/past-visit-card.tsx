import React from 'react';
import { DateTime } from 'luxon';
import { Trans } from 'react-i18next';

import { useModal } from '@/modules/modal';
import Card from '@/ui-components/card';
import Icon from '@/ui-components/icons/Icon';
import { UserEncounterRecord } from 'api/types';
import { Button } from '@/ui-components/button';

export default function PastVisitCard({ encounter }: { encounter: UserEncounterRecord }) {
  const modal = useModal();

  const startDateTime = encounter.actualStarttime
    ? DateTime.fromISO(encounter.actualStarttime)
    : null;
  const endDateTime = encounter.actualEndtime ? DateTime.fromISO(encounter.actualEndtime) : null;

  return (
    <Card className="mb-4">
      <div className="p-2 flex flex-col ">
        <div className="flex pb-2 border-b border-b-neutral-150 border-solid">
          <div className="pr-2 pl-1 pb-1 pt-1 border-r border-r-neutral-150 border-dotted">
            <div className="text-sm">{startDateTime?.toFormat('LLL').toUpperCase() ?? ''}</div>
            <div className="font-bold text-xl">{startDateTime?.toFormat('dd') ?? ''}</div>
            <div className="text-sm">{startDateTime?.toFormat('yyyy') ?? ''}</div>
          </div>
          <div className="flex flex-col flex-1 p-2">
            <div className="flex">
              <div className="flex-1 text-neutral-400">
                <Trans>Patient</Trans>
              </div>
              <div style={{ flex: 2 }}>{encounter.patientName}</div>
            </div>
            {startDateTime && endDateTime && (
              <div className="flex">
                <div className="flex-1 text-neutral-400">
                  <Trans>Time</Trans>
                </div>
                <div style={{ flex: 2 }}>
                  {startDateTime.toLocaleString(DateTime.TIME_SIMPLE)} -{' '}
                  {endDateTime.toLocaleString(DateTime.TIME_SIMPLE)}
                </div>
              </div>
            )}
            <div className="flex">
              <div className="flex-1 text-neutral-400">
                <Trans>Provider</Trans>
              </div>
              <div style={{ flex: 2 }}>{encounter.providerName}</div>
            </div>
          </div>
        </div>

        <div className="pt-3 pb-1 flex flex-row">
          <Button
            variant="tertiary"
            onClick={() => {
              modal.openPrimary({
                type: 'after-visit-summary',
                showCloseButton: true,
                encounter,
              });
            }}
          >
            <Icon color="darkGreen" name="arrow-right" />
            <Trans>View After Visit Summary</Trans>
          </Button>
        </div>
      </div>
    </Card>
  );
}
