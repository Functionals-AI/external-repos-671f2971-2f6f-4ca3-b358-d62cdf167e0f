import { Button } from '@/ui-components/button';
import { CalendarHourItemCellContent } from '../../calendar-item-hour-cell';
import { cn } from '@/utils';
import { Trans } from 'react-i18next';
import { TimeSlot } from '@/selectors/calendarItemsSelector/helpers';
import { useModal } from '@/modules/modal';
import { SlotTimingType } from '../../types';

interface ConflictingCalendarItemProps {
  timeSlot: TimeSlot;
  slotTimingType: SlotTimingType;
}

export default function ConflictingCalendarItem({
  timeSlot,
  slotTimingType,
}: ConflictingCalendarItemProps) {
  const modal = useModal();
  function openResolveConflictsModal() {
    modal.openPrimary({
      type: 'resolve-conflicts',
      timeSlot,
    });
  }

  return (
    <CalendarHourItemCellContent
      slotTimingType={slotTimingType}
      dataTestId="conflicting-hour"
      className={cn('border-l-status-red-400 bg-status-red-100')}
    >
      <h4 className="text-status-red-800">
        <Trans>Conflicting Appointments</Trans>
      </h4>
      <Button onClick={openResolveConflictsModal} variant="primary" theme="destructive">
        <Trans>Fix Issues</Trans>
      </Button>
    </CalendarHourItemCellContent>
  );
}
