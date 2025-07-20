import { AsTime } from '@/modules/dates';
import { Button } from '@/ui-components/button';
import OverflowMenu, { OverflowMenuItem } from '@/ui-components/dropdown-menu/overflow-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/ui-components/popover';
import { cn } from '@/utils';
import { AppointmentRecord } from 'api/types';
import { DateTime } from 'luxon';
import { CSSProperties, PropsWithChildren, useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import ScheduledCell from '../single-day-calendar/calendar-item/scheduled-calendar-item';
import { SlotTimingType } from '../types';
import { Badge } from '@/ui-components/badge';
import { CalendarItemConflictingHour } from '@/selectors/calendarItemsSelector';
import { useModal } from '@/modules/modal';
import Icon from '@/ui-components/icons/Icon';
import useMemberHelpers from '@/modules/member/useMemberHelpers';
import { CalendarHourItemCellContent } from '../calendar-item-hour-cell';
import { useOpenCalendarItemState } from '../single-day-calendar/calendar-item/open-calendar-item';
import { useProviderDashboardContext } from '../../context';
import useOverbooking from 'hooks/useOverbooking';

interface UnavailableCalendarItemProps {
  date: Date;
  timeDisplay: string;
  duration: 30 | 60;
  slotTimingType: SlotTimingType;
}

interface AvailableCalendarItemProps {
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

function CellSkeleton({
  children,
  className,
  style,
  dataTestId,
  slotTimingType,
}: PropsWithChildren<{
  className?: string;
  style?: CSSProperties;
  dataTestId?: string;
  slotTimingType: SlotTimingType;
}>) {
  return (
    <div
      data-testid={dataTestId}
      style={style}
      className={cn(
        'border-r border-r-neutral-150 h-full p-2',
        className,
        slotTimingType.type === 'past' &&
          'opacity-60 hover:opacity-100 transition-opacity duration-200',
      )}
    >
      {children}
    </div>
  );
}

function CellPopoverTrigger({ className, children }: PropsWithChildren<{ className?: string }>) {
  return (
    <PopoverTrigger data-testid="cell-popover-trigger" className={cn(className)}>
      {children}
    </PopoverTrigger>
  );
}

function CellPopoverContent({
  className,
  children,
  style,
}: PropsWithChildren<{ className?: string; style?: CSSProperties }>) {
  return (
    <PopoverContent
      sideOffset={-50}
      className={cn('p-4 flex flex-col gap-y-4 border-l-8 w-96', className)}
      style={style}
    >
      {children}
    </PopoverContent>
  );
}

function UnavailableCell({
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
      (v) => v.startTimestamp === date.toISOString(),
    );
  }, [providerOverbookingSlotsData, date]);

  const { postProviderOverbookingSlots } = useOverbooking();

  function openUnfreezeSlotModal() {
    modal.openPrimary({
      type: 'unfreeze-slot',
      date,
      timeDisplay,
      duration,
    });
  }

  const showOverbooking = hasVacancy;

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
    <CellSkeleton
      slotTimingType={slotTimingType}
      dataTestId={duration === 60 ? 'unavailable-60min' : 'unavailable-30min'}
      style={{
        backgroundImage:
          'repeating-linear-gradient(-45deg, var(--neutral-100) 0 10px, var(--neutral-105) 10px 20px)',
      }}
    >
      <div className="flex justify-between h-8">
        <p className="text-sm text-neutral-400 z-10">
          <Trans>Frozen</Trans>
        </p>
        <div>
          {slotTimingType.type !== 'past' && (
            <OverflowMenu
              items={items}
              type={showOverbooking ? 'visible' : 'hover-only'}
              showIndicator={showOverbooking}
            />
          )}
        </div>
      </div>
    </CellSkeleton>
  );
}

function AvailableCell(props: AvailableCalendarItemProps) {
  const { t } = useTranslation();
  const {
    openFreezeSlotModal,
    openScheduleSessionModal,
    onDemandAvailability,
    attemptFillOnDemandSlot,
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
    <CellSkeleton
      slotTimingType={props.slotTimingType}
      dataTestId={duration === 60 ? 'available-60min' : 'available-30min'}
      className={cn(duration === 30 && 'items-center py-0')}
    >
      <div className="flex justify-end h-full">
        <div>
          {props.slotTimingType.type !== 'past' && (
            <OverflowMenu
              items={items}
              type={showOverbooking ? 'visible' : 'hover-only'}
              showIndicator={showOverbooking}
            />
          )}
        </div>
      </div>
    </CellSkeleton>
  );
}

function AppointmentCell({
  appointment,
  slotTimingType,
}: {
  appointment: AppointmentRecord;
  slotTimingType: SlotTimingType;
}) {
  return <ScheduledCell appointment={appointment} cellSize="sm" slotTimingType={slotTimingType} />;
}

function ConflictingCell({
  item,
  slotTimingType,
}: {
  item: CalendarItemConflictingHour;
  slotTimingType: SlotTimingType;
}) {
  const modal = useModal();
  const { t } = useTranslation();
  const memberHelpers = useMemberHelpers();

  function openResolveConflictsModal() {
    modal.openPrimary({
      type: 'resolve-conflicts',
      timeSlot: item.topOfHourTimeslot,
    });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <CalendarHourItemCellContent
          className="bg-status-red-100 cursor-pointer"
          slotTimingType={slotTimingType}
          dataTestId="conflicting-cell"
        >
          <p className="text-status-red-800 font-semibold">
            <Trans>Conflicts</Trans>
          </p>
          <CellPopoverContent className="border-l-status-red-800 bg-status-red-100">
            <div className="flex justify-between">
              <div className="flex flex-col">
                <h4>
                  <Trans>Session conflicts</Trans>
                </h4>
                <Badge leftIconName={'alert-octagon'} variant="statusRed">
                  {item.appointments.length} <Trans>conflicts</Trans>
                </Badge>
              </div>
              <Button onClick={openResolveConflictsModal} theme="destructive">
                <Icon size="sm" color="white" name="wrench" />
                <Trans>Fix</Trans>
              </Button>
            </div>
            <div className="flex gap-x-4">
              <div className="flex flex-col">
                <p className="mb-2 text-status-red-800">
                  <Trans>Member</Trans>
                </p>
                {item.appointments.map((appointment) => (
                  <p key={appointment.appointmentId}>
                    {appointment.status === 'o'
                      ? t('Open')
                      : memberHelpers.getDisplayNameFromAppointment({ appointment })}
                  </p>
                ))}
              </div>
              <div className="flex flex-col">
                <p className="mb-2 text-status-red-800">Time</p>
                {item.appointments.map((appointment) => (
                  <p key={appointment.appointmentId}>
                    <AsTime withTimezone={false}>{appointment.startTimestamp}</AsTime> -{' '}
                    <AsTime withTimezone={false}>
                      {DateTime.fromISO(appointment.startTimestamp)
                        .plus({
                          minutes: appointment.duration,
                        })
                        .toJSDate()}
                    </AsTime>
                  </p>
                ))}
              </div>
            </div>
          </CellPopoverContent>
        </CalendarHourItemCellContent>
      </PopoverTrigger>
    </Popover>
  );
}

const Cells = {
  UnavailableCell,
  AvailableCell,
  AppointmentCell,
  ConflictingCell,
};

export default Cells;
