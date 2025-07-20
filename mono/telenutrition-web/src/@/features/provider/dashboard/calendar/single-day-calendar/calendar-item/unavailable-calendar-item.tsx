import { useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { DateTime } from 'luxon';

import OverflowMenu, { OverflowMenuItem } from '@/ui-components/dropdown-menu/overflow-menu';
import { useModal } from '@/modules/modal';
import useOverbooking from 'hooks/useOverbooking';
import { cn } from '@/utils';
import { CalendarHourItemCellContent } from '../../calendar-item-hour-cell';
import { SlotTimingType } from '../../types';
import { useProviderDashboardContext } from '../../../context';

// TODO: convert to luxon
interface UnavailableCalendarItemProps {
  date: Date;
  timeDisplay: string;
  duration: 30 | 60;
  slotTimingType: SlotTimingType;
}

export default function UnavailableCalendarItem({
  date,
  timeDisplay,
  duration,
  slotTimingType,
}: UnavailableCalendarItemProps) {
  const { t } = useTranslation();
  const modal = useModal();
  const { providerOverbookingSlotsData } = useProviderDashboardContext();
  const hasVacancy = useMemo(() => {
    if (!providerOverbookingSlotsData?.data?.vacancies) return false;
    return !!providerOverbookingSlotsData.data.vacancies.find(
      (v) => v.startTimestamp === DateTime.fromJSDate(date).toUTC().toISO(),
    );
  }, [providerOverbookingSlotsData, date]);

  const { postProviderOverbookingSlots } = useOverbooking();

  const showOverbooking = hasVacancy;

  function openUnfreezeSlotModal() {
    modal.openPrimary({
      type: 'unfreeze-slot',
      date,
      timeDisplay,
      duration,
    });
  }

  const items = [
    showOverbooking
      ? [
          {
            label: t('Fill on demand...'),
            icon: 'immediate',
            onClick: () => {
              postProviderOverbookingSlots({
                startTimestamp: date.toISOString(),
                duration,
                fromFrozen: true,
              });
            },
          },
          'separator',
        ]
      : null,
    {
      label: t('Unfreeze slot'),
      onClick: openUnfreezeSlotModal,
    },
  ]
    .flat()
    .filter((i) => !!i) as OverflowMenuItem[];
  // our current version of ts doesnt support filter

  return (
    <CalendarHourItemCellContent
      slotTimingType={slotTimingType}
      dataTestId={duration === 60 ? 'unavailable-hour' : 'unavailable-30min'}
      className={cn('border-l-0 pl-4 py-6 group', duration === 30 && 'items-center py-0')}
      style={{
        backgroundImage:
          'repeating-linear-gradient(-45deg, var(--neutral-100) 0 10px, var(--neutral-105) 10px 20px)',
      }}
    >
      <p className={cn('text-base text-type-secondary')}>
        <Trans>Frozen</Trans>
      </p>
      {slotTimingType.type !== 'past' && (
        <OverflowMenu
          items={items}
          type={showOverbooking ? 'visible' : 'hover-only'}
          showIndicator={showOverbooking}
        />
      )}
    </CalendarHourItemCellContent>
  );
}
