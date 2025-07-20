import { useContext } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { DateTime } from 'luxon';

import { Button } from '@/ui-components/button';
import { useProviderDashboardContext } from '../../context';
import { OverbookingSlot } from 'api/provider/useFetchProviderOverbookingSlots';
import useOverbooking from 'hooks/useOverbooking';
import { TimezoneContext } from '@/modules/dates/context';

interface Props {
  vacancy: OverbookingSlot;
  available?: boolean;
}

export default function OnDemandSlot({ vacancy, available }: Props) {
  const { t } = useTranslation();

  const { selectHighlightSlot, clearHighlightSlot } = useProviderDashboardContext();

  const { postProviderOverbookingSlots } = useOverbooking();
  const timezoneContextValue = useContext(TimezoneContext);
  const timezone =
    timezoneContextValue?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  const dateTime = DateTime.fromISO(vacancy.startTimestamp).setZone(timezone);

  return (
    <div
      className="flex group p-2 mb-2 justify-between !cursor-default hover:bg-fs-pale-green-100 rounded-md transition-colors"
      onMouseEnter={() => selectHighlightSlot(vacancy)}
      onMouseLeave={() => clearHighlightSlot()}
      data-testid={`on-demand-slot`}
    >
      <div>
        <div>
          {dateTime.toLocaleString(DateTime.TIME_SIMPLE)} (
          {t('{{duration}}min', {
            duration: vacancy.duration,
          })}
          )
        </div>
        <div className="text-neutral-600">{dateTime.toLocaleString(DateTime.DATE_MED)}</div>
      </div>
      <div className="flex items-center">
        <Button
          dataTestId="fill-on-demand-button"
          className="invisible group-hover:visible"
          variant="secondary"
          size="sm"
          onClick={() => {
            postProviderOverbookingSlots({
              startTimestamp: vacancy.startTimestamp,
              duration: vacancy.duration,
              fromFrozen: !available,
            }).then();
            clearHighlightSlot();
          }}
        >
          <Trans>Fill On Demand</Trans>
        </Button>
      </div>
    </div>
  );
}
