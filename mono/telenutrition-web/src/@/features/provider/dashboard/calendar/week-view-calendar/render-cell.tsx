import { CalendarItemHour, isAppointmentBooked } from '@/selectors/calendarItemsSelector';
import Cells from './cells';
import { TimeSlot } from '@/selectors/calendarItemsSelector/helpers';
import { AppointmentRecord } from 'api/types';
import { getSlotTimingType } from '../helpers';
// import TimeIndicationLine, { useTimeIndicationLine } from '../time-indication-line';
import { SlotTimingType } from '../types';
import { DateTime } from 'luxon';
import { useProviderDashboardContext } from '../../context';

export default function RenderCellWrapper({
  item,
  appointmentsByDay,
}: {
  item: CalendarItemHour | null;
  appointmentsByDay: Record<string, AppointmentRecord[]>;
}) {
  const { highlightSlot } = useProviderDashboardContext();

  if (!item) return null;

  const slotTimingType = getSlotTimingType({
    dateTime: item.topOfHourTimeslot.dateTime,
    duration: 60,
  });
  // const timeIndicationLine = useTimeIndicationLine({ slotTimingType, cellDuration: 60 });
  const date = item.topOfHourTimeslot.dateTime;

  let highlightElement = null;
  if (highlightSlot) {
    const highlightDateTime = DateTime.fromISO(highlightSlot.startTimestamp);

    const startOfHour = highlightDateTime.startOf('hour');

    if (item.topOfHourTimeslot.dateTime.diff(startOfHour).as('hours') === 0) {
      if (highlightSlot.duration === 60) {
        highlightElement = (
          <div className="transition-colors opacity-60 absolute bg-fs-pale-green-100 w-full h-full border-green-300 border-2" />
        );
      } else if (highlightSlot.duration === 30) {
        if (highlightDateTime.minute === 30) {
          highlightElement = (
            <div className="transition-colors opacity-60 absolute bg-fs-pale-green-100 w-full top-1/2 bottom-0 border-green-300 border-2" />
          );
        } else {
          highlightElement = (
            <div className="transition-colors opacity-60 absolute bg-fs-pale-green-100 w-full top-0 bottom-1/2 border-green-300 border-2" />
          );
        }
      }
    }
  }

  return (
    <div
      // ref={timeIndicationLine.parentRef}
      className="group relative h-full"
      data-test={item.topOfHourTimeslot.dateTime.toFormat('LL/dd/yyyy HH:mm')}
    >
      {highlightElement}
      <RenderCell
        item={item}
        slotTimingType={slotTimingType}
        date={date}
        appointmentsByDay={appointmentsByDay}
      />
      {/* {timeIndicationLine.show && <TimeIndicationLine positionY={timeIndicationLine.positionY} />} */}
    </div>
  );
}

function RenderCell({
  item,
  slotTimingType,
  date,
  appointmentsByDay,
}: {
  item: CalendarItemHour;
  slotTimingType: SlotTimingType;
  date: DateTime;
  appointmentsByDay: Record<string, AppointmentRecord[]>;
}) {
  const dateDisplay = date.toFormat('LLLL dd');
  if (item.type === '60-minute-unavailable') {
    return (
      <Cells.UnavailableCell
        slotTimingType={slotTimingType}
        date={item.topOfHourTimeslot.dateTime.toJSDate()}
        timeDisplay={item.topOfHourTimeslot.display}
        duration={60}
      />
    );
  }

  if (item.type === '60-minute-available') {
    return (
      <Cells.AvailableCell
        slotTimingType={slotTimingType}
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
    return <Cells.AppointmentCell appointment={item.appointment} slotTimingType={slotTimingType} />;
  }

  if (item.type === 'has-conflicting') {
    return <Cells.ConflictingCell item={item} slotTimingType={slotTimingType} />;
  }

  return (
    <div className="flex flex-col h-full">
      <Render30MinuteCell
        item={item}
        timeslot={item.topOfHourTimeslot}
        appointment={item.topOfHourAppt}
        dateDisplay={dateDisplay}
        appointmentsByDay={appointmentsByDay}
      />
      <Render30MinuteCell
        item={item}
        timeslot={item.middleOfHourTimeslot}
        appointment={item.middleOfHourAppt}
        dateDisplay={dateDisplay}
        appointmentsByDay={appointmentsByDay}
        dateTime={item.middleOfHourTimeslot.dateTime}
      />
    </div>
  );
}

function Render30MinuteCell({
  appointment,
  timeslot,
  item,
  dateDisplay,
  appointmentsByDay,
  dateTime,
}: {
  timeslot: TimeSlot;
  appointment?: AppointmentRecord;
  item: CalendarItemHour;
  dateDisplay: string;
  appointmentsByDay: Record<string, AppointmentRecord[]>;
  dateTime?: DateTime;
}) {
  const slotTimingType = getSlotTimingType({ dateTime: timeslot.dateTime, duration: 30 });
  if (!appointment) {
    return (
      <Cells.UnavailableCell
        slotTimingType={slotTimingType}
        date={dateTime ? dateTime.toJSDate() : item.topOfHourTimeslot.dateTime.toJSDate()}
        timeDisplay={item.topOfHourTimeslot.display}
        duration={30}
      />
    );
  }

  if (isAppointmentBooked(appointment)) {
    return <Cells.AppointmentCell slotTimingType={slotTimingType} appointment={appointment} />;
  }

  return (
    <Cells.AvailableCell
      slotTimingType={slotTimingType}
      dateTime={timeslot.dateTime}
      appointmentIds={{ primary: appointment.appointmentId }}
      timeDisplay={timeslot.display}
      dateDisplay={dateDisplay}
      appointmentsByDay={appointmentsByDay}
    />
  );
}
