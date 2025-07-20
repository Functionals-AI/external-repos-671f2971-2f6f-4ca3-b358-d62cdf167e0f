import { useModal } from '@/modules/modal';
import OverflowMenu, { OverflowMenuItem } from '@/ui-components/dropdown-menu/overflow-menu';
import { DateTime } from 'luxon';
import { CalendarHourItemCellContent } from '../../calendar-item-hour-cell';
import { cn } from '@/utils';
import { useTranslation } from 'react-i18next';
import { SlotTimingType } from '../../types';
import { AppointmentRecord } from 'api/types';
import { OverbookingSlot } from 'api/provider/useFetchProviderOverbookingSlots';
import { useRouter } from 'next/navigation';
import useMemberHelpers from '@/modules/member/useMemberHelpers';
import { useDateHelpers } from '@/modules/dates';
import { useProviderDashboardContext } from '../../../context';
import useOverbooking from 'hooks/useOverbooking';

interface OpenCalendarItemProps {
  appointmentIds: {
    primary: number;
    secondary?: number;
  };
  dateDisplay: string;
  timeDisplay: string;
  dateTime: DateTime;
  slotTimingType: SlotTimingType;
  appointmentsByDay: Record<string, AppointmentRecord[]>;
}

export function useOpenCalendarItemState({
  appointmentIds,
  dateDisplay,
  timeDisplay,
  dateTime,
  slotTimingType,
  appointmentsByDay,
}: OpenCalendarItemProps) {
  const modal = useModal();
  const router = useRouter();
  const memberHelpers = useMemberHelpers();
  const dateHelpers = useDateHelpers();
  const { providerOverbookingSlotsData } = useProviderDashboardContext();

  const { postProviderOverbookingSlots, isSubmitting } = useOverbooking();

  function openScheduleSessionModal() {
    modal.openPrimary({
      type: 'schedule-session',
      appointmentIds,
      dateDisplay,
      timeDisplay,
      dateTime: dateTime,
    });
  }

  function openFreezeSlotModal() {
    modal.openPrimary({
      type: 'freeze-slot',
      appointmentIds,
      dateDisplay,
      timeDisplay,
      dateTime: dateTime,
      appointmentsByDay: appointmentsByDay,
    });
  }

  function goToSession({ appointmentId }: { appointmentId: number }) {
    router.push(`/schedule/provider/session/${appointmentId}/meeting`);
  }

  function attemptFillOnDemandSlot(slot: OverbookingSlot) {
    postProviderOverbookingSlots({ startTimestamp: slot.startTimestamp, duration: slot.duration });
  }

  const onDemandAvailability = providerOverbookingSlotsData?.data?.vacancies.find((slot) => {
    if (slot.duration === 60) {
      const appts = appointmentsByDay[dateTime.toFormat('LL/dd/yyyy')];
      for (const appt of appts) {
        const midSlot = DateTime.fromISO(slot.startTimestamp).set({ minute: 30 }).toUTC().toISO();
        if (appt.startTimestamp === midSlot && !appt.bookable) {
          return false;
        }
      }
    }
    return (
      DateTime.fromISO(slot.startTimestamp).toUTC().startOf('minute').toISO() ===
      dateTime.toUTC().startOf('minute').toISO()
    );
  });

  return {
    openFreezeSlotModal,
    attemptFillOnDemandSlot,
    openScheduleSessionModal,
    onDemandAvailability,
    isFillOnDemandSubmitting: isSubmitting,
  };
}

export default function OpenCalendarItem(props: OpenCalendarItemProps) {
  const { t } = useTranslation();
  const {
    openScheduleSessionModal,
    openFreezeSlotModal,
    attemptFillOnDemandSlot,
    onDemandAvailability,
  } = useOpenCalendarItemState(props);

  const duration = !!props.appointmentIds.secondary ? 60 : 30;

  const showOverbooking = !!onDemandAvailability;

  const items = [
    showOverbooking
      ? [
          {
            label: t('Fill on demand...'),
            icon: 'immediate',
            onClick: () => attemptFillOnDemandSlot(onDemandAvailability),
          },
          'separator',
        ]
      : null,
    {
      label: t('Schedule session...'),
      type: 'default',
      onClick: openScheduleSessionModal,
    },
    {
      label: t('Freeze slot...'),
      type: 'default',
      onClick: openFreezeSlotModal,
    },
  ]
    .flat()
    .filter((i) => !!i) as OverflowMenuItem[];
  // our current version of ts doesnt support filter

  return (
    <CalendarHourItemCellContent
      slotTimingType={props.slotTimingType}
      dataTestId={duration === 60 ? 'available-hour' : 'available-30min'}
      className={cn(
        duration === 30 && 'items-center py-0',
        'group',
        props.slotTimingType.type === 'future'
          ? 'bg-white'
          : props.slotTimingType.type === 'past'
            ? 'bg-white'
            : 'bg-white',
      )}
    >
      {props.slotTimingType.type !== 'past' && (
        <OverflowMenu
          type={showOverbooking ? 'visible' : 'hover-only'}
          showIndicator={showOverbooking}
          items={items}
        />
      )}
    </CalendarHourItemCellContent>
  );
}
