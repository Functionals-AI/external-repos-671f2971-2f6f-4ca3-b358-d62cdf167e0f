import CalendarItemHourCell from '../calendar-item-hour-cell';
import UnavailableCalendarItem from './calendar-item/unavailable-calendar-item';
import { DateTime } from 'luxon';
import OpenCalendarItem from './calendar-item/open-calendar-item';
import ScheduledCalendarItem from './calendar-item/scheduled-calendar-item';
import { CalendarItemHour } from '@/selectors/calendarItemsSelector';
import { TimeSlot } from '@/selectors/calendarItemsSelector/helpers';
import { AppointmentRecord } from 'api/types';
import { getCalendarHourSlotBanner, getSlotTimingType } from '../helpers';
import { SlotTimingType, isAppointmentBooked } from '../types';
import ConflictingCalendarItem from './calendar-item/conflicting-calendar-item';
import TimeIndicationLine, { useTimeIndicationLine } from '../time-indication-line';
import { useProviderDashboardContext } from '../../context';

type CalendarHourItemSlotProps = {
  date: DateTime;
  item: CalendarItemHour;
  hourSlotTimingType: SlotTimingType;
  appointmentsByDay: Record<string, AppointmentRecord[]>;
};

export default function CalendarHourItemSlot(props: CalendarHourItemSlotProps) {
  const { highlightSlot } = useProviderDashboardContext();

  const { hourSlotTimingType, item } = props;

  const timeIndicationLine = useTimeIndicationLine({
    slotTimingType: hourSlotTimingType,
    cellDuration: 60,
  });

  let highlightElement = null;
  if (highlightSlot) {
    const highlightDateTime = DateTime.fromISO(highlightSlot.startTimestamp);

    const startOfHour = highlightDateTime.startOf('hour');

    if (item.topOfHourTimeslot.dateTime.diff(startOfHour).as('hours') === 0) {
      if (highlightSlot.duration === 60) {
        highlightElement = (
          <div className="transition-colors opacity-60 absolute bg-fs-pale-green-100 w-full h-full border-fs-green-300 border-2 border-l-4" />
        );
      } else if (highlightSlot.duration === 30) {
        if (highlightDateTime.minute === 30) {
          highlightElement = (
            <div className="transition-colors opacity-60 absolute bg-fs-pale-green-100 w-full top-1/2 bottom-0 border-fs-green-300 border-2 border-l-4" />
          );
        } else {
          highlightElement = (
            <div className="transition-colors opacity-60 absolute bg-fs-pale-green-100 w-full top-0 bottom-1/2 border-fs-green-300 border-2 border-l-4" />
          );
        }
      }
    }
  }

  return (
    <CalendarItemHourCell
      ref={timeIndicationLine.parentRef}
      banner={getCalendarHourSlotBanner(props.item, props.hourSlotTimingType) ?? undefined}
      timeLabel={props.item.topOfHourTimeslot.display}
      size="md"
      content={
        <>
          {highlightElement}
          <CalendarHourItemSlotContent {...props} />
          {timeIndicationLine.show && (
            <TimeIndicationLine positionY={timeIndicationLine.positionY} />
          )}
        </>
      }
    />
  );
}

function CalendarHourItemSlotContent({
  date,
  item,
  hourSlotTimingType,
  appointmentsByDay,
}: CalendarHourItemSlotProps) {
  const dateDisplay = date.toFormat('LLLL dd');

  if (item.type === '60-minute-unavailable') {
    return (
      <UnavailableCalendarItem
        slotTimingType={hourSlotTimingType}
        date={item.topOfHourTimeslot.dateTime.toJSDate()}
        timeDisplay={item.topOfHourTimeslot.display}
        duration={60}
      />
    );
  }

  if (item.type === '60-minute-available') {
    return (
      <OpenCalendarItem
        slotTimingType={hourSlotTimingType}
        dateTime={item.topOfHourTimeslot.dateTime}
        timeDisplay={item.topOfHourTimeslot.display}
        dateDisplay={dateDisplay}
        appointmentIds={{
          primary: item.appointmentIds.primary,
          secondary: item.appointmentIds.secondary,
        }}
        appointmentsByDay={appointmentsByDay}
      />
    );
  }

  if (item.type === '60-minute-appointment') {
    return (
      <ScheduledCalendarItem
        appointment={item.appointment}
        slotTimingType={hourSlotTimingType}
        showAudioVideoIcon
        cellSize="md"
      />
    );
  }

  if (item.type === 'has-conflicting') {
    return (
      <ConflictingCalendarItem
        timeSlot={item.topOfHourTimeslot}
        slotTimingType={hourSlotTimingType}
      />
    );
  }

  return (
    <>
      <div className="border-b border-b-neutral-150 flex-1">
        <Render30MinuteSlot
          appointment={item.topOfHourAppt}
          timeslot={item.topOfHourTimeslot}
          date={date}
          dateDisplay={dateDisplay}
          appointmentsByDay={appointmentsByDay}
        />
      </div>
      <div className="flex-1">
        <Render30MinuteSlot
          appointment={item.middleOfHourAppt}
          timeslot={item.middleOfHourTimeslot}
          date={item.middleOfHourTimeslot.dateTime.set({ minute: 30 })}
          dateDisplay={dateDisplay}
          appointmentsByDay={appointmentsByDay}
        />
      </div>
    </>
  );
}

function Render30MinuteSlot({
  appointment,
  timeslot,
  date,
  dateDisplay,
  appointmentsByDay,
}: {
  appointment?: AppointmentRecord;
  timeslot: TimeSlot;
  date: DateTime;
  dateDisplay: string;
  appointmentsByDay: Record<string, AppointmentRecord[]>;
}) {
  const slotTimingType = getSlotTimingType({ dateTime: timeslot.dateTime, duration: 30 });

  if (!appointment) {
    return (
      <UnavailableCalendarItem
        slotTimingType={slotTimingType}
        duration={30}
        date={date.toJSDate()}
        timeDisplay={timeslot.display}
      />
    );
  }

  if (isAppointmentBooked(appointment)) {
    return (
      <ScheduledCalendarItem
        appointment={appointment}
        slotTimingType={slotTimingType}
        showAudioVideoIcon
        cellSize="md"
      />
    );
  }

  return (
    <OpenCalendarItem
      slotTimingType={slotTimingType}
      dateTime={timeslot.dateTime}
      appointmentIds={{ primary: appointment.appointmentId }}
      timeDisplay={timeslot.display}
      dateDisplay={dateDisplay}
      appointmentsByDay={appointmentsByDay}
    />
  );
}
