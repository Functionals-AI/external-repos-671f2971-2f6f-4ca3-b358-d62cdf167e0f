import { Button } from '@/ui-components/button';
import { TimeSlot } from '@/selectors/calendarItemsSelector/helpers';
import { useModal } from '@/modules/modal';
import RescheduleBlock from './reschedule-block';
import { useRescheduleCalendarContext } from '../context';

interface BlockedTimeslotProps {
  timeslot: TimeSlot;
  duration: 30 | 60;
}

export default function BlockedTimeslot({ timeslot, duration }: BlockedTimeslotProps) {
  const { config } = useRescheduleCalendarContext();
  const modal = useModal();

  function openUnfreezeHourModal() {
    modal.openSecondary({
      type: 'unfreeze-slot',
      timeDisplay: timeslot.display,
      date: timeslot.dateTime.toJSDate(),
      duration,
    });
  }

  return (
    <RescheduleBlock.Row>
      <RescheduleBlock.Label disabled timeslot={timeslot} />
      <RescheduleBlock.Content disallowed>
        <p>Frozen</p>
        {!config.hideUnfreezeButton && (
          <Button onClick={openUnfreezeHourModal} size="sm" variant="tertiary">
            Unfreeze
          </Button>
        )}
      </RescheduleBlock.Content>
    </RescheduleBlock.Row>
  );
}
