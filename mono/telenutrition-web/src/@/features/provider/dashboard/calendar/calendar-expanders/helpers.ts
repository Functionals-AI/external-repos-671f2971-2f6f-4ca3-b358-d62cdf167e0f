import { CalendarItemHour } from '@/selectors/calendarItemsSelector';

export function getFirstAndLastHours(calendarItems: CalendarItemHour[], timezone: string) {
  // First hour is slot with at least one booked appt or open slot on it (60min or 30min)
  const calendarItemsWithBookedAppointment = calendarItems
    .filter((item) => {
      if (item.type === '60-minute-appointment' || item.type === '60-minute-available') return true;
      if (item.type === '30-minute-slots') {
        return item.topOfHourAppt || item.middleOfHourAppt;
      }
    })
    .sort((a, b) => (a.topOfHourTimeslot.dateTime > b.topOfHourTimeslot.dateTime ? 1 : -1));

  // 7AM is defualt working start time
  let firstVisibleHour = 7;

  // 5PM is defualt working start time
  let lastVisibleHour = 17;

  if (calendarItemsWithBookedAppointment.length) {
    firstVisibleHour = Math.min(
      ...calendarItemsWithBookedAppointment.map(
        (item) => item.topOfHourTimeslot.dateTime.setZone(timezone).hour,
      ),
      firstVisibleHour,
    );
    lastVisibleHour = Math.max(
      ...calendarItemsWithBookedAppointment.map(
        (item) => item.topOfHourTimeslot.dateTime.setZone(timezone).hour,
      ),
      lastVisibleHour,
    );
  }

  return { firstVisibleHour, lastVisibleHour };
}
