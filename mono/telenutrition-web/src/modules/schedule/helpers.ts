import _ from 'lodash';
import {
  AppointmentData,
  GroupedAppointmentsByProvider,
  UseGetAppointmentsReturn,
  ValidDurationsType,
} from '../../api/useGetAppointments';
import { DateTime } from 'luxon';

function isTopOfHour(appointment: AppointmentData) {
  return new Date(appointment.startTimestamp).getMinutes() === 0;
}

function isMiddleOfHour(appointment: AppointmentData) {
  return new Date(appointment.startTimestamp).getMinutes() === 30;
}

function hasImmediatePriorAppt(group: GroupedAppointmentsByProvider, appointment: AppointmentData) {
  return group.appointments.find((appt) =>
    DateTime.fromJSDate(new Date(appt.startTimestamp)).equals(
      DateTime.fromJSDate(new Date(appointment.startTimestamp)).minus({ minutes: 30 }),
    ),
  );
}

function hasImmediateFollowingAppt(
  group: GroupedAppointmentsByProvider,
  appointment: AppointmentData,
) {
  return group.appointments.find((appt) =>
    DateTime.fromJSDate(new Date(appt.startTimestamp)).equals(
      DateTime.fromJSDate(new Date(appointment.startTimestamp)).plus({ minutes: 30 }),
    ),
  );
}

export function getSortedAppointmentGroups(
  groupedAppointments: GroupedAppointmentsByProvider[],
  validDurationsType: ValidDurationsType,
): GroupedAppointmentsByProvider[] {
  if (validDurationsType !== '30-only') return groupedAppointments;

  // If only one provider, return as is
  if (groupedAppointments.length === 1) return groupedAppointments;

  // filter out all non-top-of-hour appts and put at top of list

  const primaryGroup: GroupedAppointmentsByProvider[] = [];
  const secondaryGroup: GroupedAppointmentsByProvider[] = [];
  for (const group of groupedAppointments) {
    const primaryAppointmentsForGroup: AppointmentData[] = [];
    const secondaryAppointmentsForGroup: AppointmentData[] = [];
    for (const appointment of group.appointments) {
      if (
        (isMiddleOfHour(appointment) && !hasImmediatePriorAppt(group, appointment)) ||
        (isTopOfHour(appointment) && !hasImmediateFollowingAppt(group, appointment))
      ) {
        primaryAppointmentsForGroup.push(appointment);
      } else {
        secondaryAppointmentsForGroup.push(appointment);
      }
    }

    if (primaryAppointmentsForGroup.length > 0) {
      primaryGroup.push({ ...group, appointments: primaryAppointmentsForGroup });
    }
    if (secondaryAppointmentsForGroup.length > 0) {
      secondaryGroup.push({ ...group, appointments: secondaryAppointmentsForGroup });
    }
  }

  return [...primaryGroup, ...secondaryGroup];
}

export function findAppointment({
  slots,
  date,
  appointmentIds,
}: {
  slots: UseGetAppointmentsReturn['slots'];
  date: string;
  appointmentIds: number[];
}): null | (AppointmentData & { providerId: number }) {
  if (!slots) return null;
  for (const group of slots[date]) {
    const { providerId } = group
    for (const appt of group.appointments) {
      const found = appointmentIds.find((id) => id === appt.appointmentIds[0]);
      if (found) {
        return {
          ...appt,
          providerId
        }
      }
    }
  }
  return null;
}

export function filterSlotsByProvider(
  slots: UseGetAppointmentsReturn['slots'],
  providerId: number,
): UseGetAppointmentsReturn['slots'] {
  let filtered: UseGetAppointmentsReturn['slots'] = {};

  for (const date in slots) {
    const providerApptGroups = slots[date];
    const filteredApptGroups = providerApptGroups.filter((group) => {
      return group.providerId === providerId;
    });

    if (filteredApptGroups.length > 0) {
      filtered = { ...filtered, [date]: filteredApptGroups };
    }
  }

  return filtered;
}
