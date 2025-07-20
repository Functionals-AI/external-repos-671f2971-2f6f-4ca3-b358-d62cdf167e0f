import { TimeSlot, get30MinuteTimeslotsPerHour } from '@/selectors/calendarItemsSelector/helpers';
import { DateTime } from 'luxon';

import { AppointmentRecord } from 'api/types';
import { OverbookingSlot } from 'api/provider/useFetchProviderOverbookingSlots';

export type ProviderBookedAppointment = Omit<AppointmentRecord, 'status'> & { status: 'f' };

export function isAppointmentBooked(
  appointment: AppointmentRecord,
): appointment is ProviderBookedAppointment {
  return ['f', '1', '2', '3', '4'].includes(appointment.status);
}

export type ProviderAvailableAppointmentSlot = Omit<AppointmentRecord, 'status'> & {
  status: 'o';
};

export function isAppointmentSlotAvailable(
  appointment?: AppointmentRecord,
): appointment is ProviderAvailableAppointmentSlot {
  return appointment?.status === 'o' && appointment.bookable !== false;
}

export function hasOverbooking30Min(
  startTimeStamp?: string | null,
  overbookingSlots?: OverbookingSlot[],
) {
  if (!startTimeStamp || !overbookingSlots) return false;
  for (const slot of overbookingSlots) {
    if (slot.startTimestamp === startTimeStamp) return true;
  }
  return false;
}

type CalendarItemHourBase = {
  topOfHourTimeslot: TimeSlot;
  middleOfHourTimeslot: TimeSlot;
};

export type CalendarItemBookedHour = CalendarItemHourBase & {
  type: '60-minute-appointment';
  appointment: ProviderBookedAppointment;
};

export type CalendarItemConflictingHour = CalendarItemHourBase & {
  type: 'has-conflicting';
  appointments: AppointmentRecord[];
};

export type CalendarItemAvailableHour = CalendarItemHourBase & {
  type: '60-minute-available';
  appointmentIds: {
    primary: number;
    secondary: number;
  };
};

export type CalendarItemUnavailableHour = CalendarItemHourBase & { type: '60-minute-unavailable' };

export type CalendarItem30MinuteSlots = CalendarItemHourBase & {
  type: '30-minute-slots';
  topOfHourAppt?: AppointmentRecord;
  middleOfHourAppt?: AppointmentRecord;
  appointmentIds?: {
    primary: number;
    secondary: number;
  };
};

export type CalendarItemHour =
  | CalendarItemBookedHour
  | CalendarItemAvailableHour
  | CalendarItemConflictingHour
  | CalendarItemUnavailableHour
  | CalendarItem30MinuteSlots;

type DateStr = string;
export type CalendarItemsList = Record<DateStr, CalendarItemHour[]>;

export default function calendarItemsSelector({
  appointmentsForDay = [],
  displayTimezone,
  date,
  earlierTimezoneShift,
  overbookingSlots,
}: {
  appointmentsForDay?: AppointmentRecord[];
  displayTimezone: string;
  date: Date;
  earlierTimezoneShift?: boolean;
  overbookingSlots?: OverbookingSlot[];
}): CalendarItemHour[] {
  const offset = DateTime.now().offset - DateTime.now().setZone(displayTimezone).offset;

  // This is a hack to make slot generation work with earlier timezones since its a JS date
  if (earlierTimezoneShift && offset > 0) {
    const startDate = DateTime.fromJSDate(date)
      .setZone(displayTimezone)
      .plus({ day: 1 })
      .toJSDate();
    date = startDate;
  }

  const slots = get30MinuteTimeslotsPerHour({
    displayTimezone,
    date,
  });

  return slots.map<CalendarItemHour>(([topOfHour, middleOfHour]): CalendarItemHour => {
    const topOfHourAppts = appointmentsForDay.filter((appt) => {
      return new Date(appt.startTimestamp).getTime() === topOfHour.time;
    });

    const middleOfHourAppts = appointmentsForDay.filter((appt) => {
      return new Date(appt.startTimestamp).getTime() === middleOfHour.time;
    });

    const moreThanOneOnTopOfHour = topOfHourAppts.length > 1;
    const moreThanOneOnBottomOfHour = middleOfHourAppts.length > 1;
    const one60MinuteAndOne30Minute =
      topOfHourAppts.length === 1 &&
      topOfHourAppts[0].duration === 60 &&
      middleOfHourAppts.length > 0;

    if (moreThanOneOnTopOfHour || moreThanOneOnBottomOfHour || one60MinuteAndOne30Minute) {
      return {
        type: 'has-conflicting',
        topOfHourTimeslot: topOfHour,
        middleOfHourTimeslot: middleOfHour,
        appointments: [...topOfHourAppts, ...middleOfHourAppts],
      };
    }

    const topOfHourAppt = topOfHourAppts[0];
    const middleOfHourAppt = middleOfHourAppts[0];

    if (!topOfHourAppt && !middleOfHourAppt) {
      const timeStamp = middleOfHour.dateTime.toUTC().toISO();
      if (overbookingSlots && hasOverbooking30Min(timeStamp, overbookingSlots)) {
        return {
          type: '30-minute-slots',
          topOfHourTimeslot: topOfHour,
          middleOfHourTimeslot: middleOfHour,
          topOfHourAppt,
          middleOfHourAppt,
        };
      }
      return {
        type: '60-minute-unavailable',
        topOfHourTimeslot: topOfHour,
        middleOfHourTimeslot: middleOfHour,
      };
    }

    if (isAppointmentSlotAvailable(topOfHourAppt) && isAppointmentSlotAvailable(middleOfHourAppt)) {
      const timeStamp = middleOfHour.dateTime.toUTC().toISO();

      if (overbookingSlots && hasOverbooking30Min(timeStamp, overbookingSlots)) {
        return {
          type: '30-minute-slots',
          appointmentIds: {
            primary: topOfHourAppt.appointmentId,
            secondary: middleOfHourAppt.appointmentId,
          },
          topOfHourTimeslot: topOfHour,
          middleOfHourTimeslot: middleOfHour,
          topOfHourAppt,
          middleOfHourAppt,
        };
      } else {
        return {
          type: '60-minute-available',
          appointmentIds: {
            primary: topOfHourAppt.appointmentId,
            secondary: middleOfHourAppt.appointmentId,
          },
          topOfHourTimeslot: topOfHour,
          middleOfHourTimeslot: middleOfHour,
        };
      }
    }

    if (topOfHourAppt && isAppointmentBooked(topOfHourAppt) && topOfHourAppt.duration === 60) {
      return {
        type: '60-minute-appointment',
        appointment: topOfHourAppt,
        topOfHourTimeslot: topOfHour,
        middleOfHourTimeslot: middleOfHour,
      };
    }

    return {
      type: '30-minute-slots',
      topOfHourTimeslot: topOfHour,
      middleOfHourTimeslot: middleOfHour,
      topOfHourAppt,
      middleOfHourAppt,
    };
  });
}
