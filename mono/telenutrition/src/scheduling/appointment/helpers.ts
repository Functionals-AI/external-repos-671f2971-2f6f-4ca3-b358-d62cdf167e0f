import _ = require('lodash');
import { AppointmentSlotRecord, GroupedAppointmentSlots } from './types';
import { DateTime } from 'luxon';
import * as zs from 'zapatos/schema';

export function groupAppointmentSlotsByDayAndProvider(
  slots: AppointmentSlotRecord[],
  providerIndex: Record<string, number>, // providerId => sortOrder
): Record<string, GroupedAppointmentSlots[]> {
  const groupedBy = _.groupBy(slots, (slot) => `${slot.providerId}.${slot.startTimestamp.toISODate()}`);

  const groupedSlots: GroupedAppointmentSlots[] = Object.entries(groupedBy).map(([i, appts]) => {
    return {
      providerId: appts[0].providerId,
      appointments: appts.map((appt) => ({
        appointmentIds: appt.appointmentIds,
        duration: appt.duration,
        startTimestamp: appt.startTimestamp.toISO(), // JSON will stringify as UTC, so do it ourselves to keep the offset
      })),
      date: appts[0].startTimestamp.toFormat('MM/dd/yyyy'),
    };
  });
  const sortedGroups = _.sortBy(groupedSlots, (group) => (group.providerId ? providerIndex[group.providerId] : null));
  const groupedSlotsByDate = _.groupBy(sortedGroups, (group) => group.date);

  return groupedSlotsByDate;
}

export function formatTimeFields(
  startTimestamp: DateTime,
  timezone?: string,
): Pick<zs.telenutrition.schedule_appointment.Insertable, 'date' | 'start_time' | 'start_timestamp'> {
  const dateTime = timezone ? startTimestamp.setZone(timezone) : startTimestamp;
  return {
    date: dateTime.toFormat('MM/dd/yyyy'),
    start_time: dateTime.toFormat('HH:mm'),
    start_timestamp: dateTime.toJSDate(),
  };
}
