import { DateTime } from 'luxon';
import {
  DefaultValuesPatientSessionForm,
  FutureAppointmentSlot,
  ManageScheduleForPatientFormFields,
  NonConflictingSlot,
  OpenSchedulePatientSessionModalParams,
  ScheduledPatientSessionRecurring,
  ScheduledPatientSessionSingle,
} from './types';
import type { AppointmentRecord, HouseholdMemberSchedulable } from 'api/types';
import { v4 as uuid } from 'uuid';
import { DeveloperError } from 'utils/errors';
import { UseFormReturn } from 'react-hook-form';
import { TimeSlot } from '@/selectors/calendarItemsSelector/helpers';
import { CalendarItemHour } from '@/selectors/calendarItemsSelector';
import { SessionDuration, SessionType } from 'types/globals';

export type ScheduledSession = {
  date: Date;
  isRecurring: boolean;
  sessionType: SessionType;
  duration: SessionDuration;
  appointmentIds: number[];
};

// Get flat list of scheduled sessions from non-recurring and recurring sessions in form
export function getAllSessions(values: ManageScheduleForPatientFormFields): ScheduledSession[] {
  const nonRecurring = (values.scheduledSlots || []).map((slot) => ({
    isRecurring: false,
    duration: slot.duration,
    date: slot.date,
    sessionType: slot.sessionType,
    appointmentIds: slot.appointmentIds,
  }));

  const recurring = (values.recurringSlots || []).reduce((acc, group) => {
    return [
      ...acc,
      ...group.slots.map<ScheduledSession>((slot) => ({
        isRecurring: true,
        duration: slot.duration,
        date: slot.date,
        sessionType: slot.sessionType,
        appointmentIds: slot.appointmentIds,
      })),
    ];
  }, [] as ScheduledSession[]);

  return [...nonRecurring, ...recurring].sort((a, b) => {
    return DateTime.fromJSDate(a.date) < DateTime.fromJSDate(b.date) ? -1 : 1;
  });
}

export function calculateRecurringAppointments({
  currentDate,
  maxConflicts,
  timesToRepeat,
  weeksToRepeat,
  duration,
  appointmentsByDay,
  forceRepeatCount,
}: {
  currentDate: Date;
  maxConflicts: number;
  timesToRepeat: number;
  weeksToRepeat: number;
  duration: SessionDuration;
  appointmentsByDay: Record<string, AppointmentRecord[]>;
  forceRepeatCount?: number
}): FutureAppointmentSlot[] {
  let current = DateTime.fromJSDate(currentDate);
  const found: FutureAppointmentSlot[] = [];

  let i = 0;

  while (
    found.filter((slot) => slot.isConflict).length < maxConflicts &&
    found.filter((slot) => !slot.isConflict).length < timesToRepeat &&
    (!forceRepeatCount || i < forceRepeatCount)
  ) {
    i++
    current = current.plus({ weeks: weeksToRepeat });

    const key = current.toFormat('LL/dd/yyyy');
    const appointmentsOnDay = appointmentsByDay[key];
    const foundSlot = appointmentsOnDay?.find(
      (appt) => new Date(appt.startTimestamp).getTime() === current.toJSDate().getTime(),
    );

    if (!foundSlot || foundSlot.status !== 'o') {
      found.push({
        isConflict: true,
        date: current,
        type: foundSlot?.status === 'f' ? 'booked' : 'frozen',
      });
      continue;
    }

    if (duration === SessionDuration.Thirty) {
      found.push({
        isConflict: false,
        date: current,
        appointmentIds: [foundSlot.appointmentId],
      });
      continue;
    }

    const middleOfHour = appointmentsByDay[key]?.find(
      (appt) =>
        new Date(appt.startTimestamp).getTime() ===
        current.plus({ minutes: 30 }).toJSDate().getTime(),
    );

    if (!middleOfHour || middleOfHour.status !== 'o') {
      found.push({
        isConflict: true,
        date: current,
        type: middleOfHour?.status !== 'f' ? 'booked' : 'frozen',
      });
      continue;
    }

    found.push({
      isConflict: false,
      appointmentIds: [foundSlot.appointmentId, middleOfHour.appointmentId],
      date: current,
    });
  }

  return found;
}

export function convertFutureSlotsToRecurringScheduledSession(
  futureApptSlots: FutureAppointmentSlot[],
  baseAppointment: {
    duration: SessionDuration;
    sessionType: SessionType;
    appointmentIds: number[];
    date: Date;
  },
): ScheduledPatientSessionRecurring {
  const nonConflictingSlots = futureApptSlots.filter(
    (appt) => !appt.isConflict,
  ) as NonConflictingSlot[];

  const mappedSlots = nonConflictingSlots.map((slot) => ({
    duration: baseAppointment.duration,
    sessionType: baseAppointment.sessionType,
    date: slot.date.toJSDate(),
    appointmentIds: slot.appointmentIds,
  }));

  return {
    type: 'recurring',
    id: uuid(),
    slots: [
      {
        duration: baseAppointment.duration,
        sessionType: baseAppointment.sessionType,
        date: baseAppointment.date,
        appointmentIds: baseAppointment.appointmentIds,
      },
      ...mappedSlots,
    ],
  };
}

export function getDefaultValuesForSchedulePatientSessionForm(
  params: OpenSchedulePatientSessionModalParams,
  patientData: HouseholdMemberSchedulable,
): {
  defaultValues: DefaultValuesPatientSessionForm;
  isDurationDisabled: boolean;
  isSessionTypeDisabled: boolean;
} {
  const canScheduleAudioOnly = patientData.schedulingInfo.canScheduleAudioOnly;
  if (params.type === 'create') {
    // Either 30 or 60 is fine
    if (patientData.schedulingInfo.validAppointmentDurations.length === 2) {
      return {
        defaultValues: {
          date: params.dateTime.toJSDate(),
          duration: params.duration === 30 ? SessionDuration.Thirty : SessionDuration.Sixty,
          sessionType: canScheduleAudioOnly.canSchedule
            ? canScheduleAudioOnly.defaultValue == true
              ? SessionType.AudioOnly
              : SessionType.Video
            : SessionType.Video,
        },
        isDurationDisabled: params.duration === 30,
        isSessionTypeDisabled: !canScheduleAudioOnly.canSchedule,
      };
    }

    const patietDeterminedDuration =
      patientData.schedulingInfo.validAppointmentDurations[0] === 30
        ? SessionDuration.Thirty
        : SessionDuration.Sixty;

    return {
      defaultValues: {
        date: params.dateTime.toJSDate(),
        duration: patietDeterminedDuration,
        sessionType: canScheduleAudioOnly.canSchedule
          ? canScheduleAudioOnly.defaultValue == true
            ? SessionType.AudioOnly
            : SessionType.Video
          : SessionType.Video,
      },
      isDurationDisabled: true,
      isSessionTypeDisabled: !canScheduleAudioOnly.canSchedule,
    };
  }

  if (params.type === 'edit') {
    return {
      defaultValues: {
        duration: params.session.duration,
        date: params.dateTime.toJSDate(),
        sessionType: params.session.sessionType,
      },
      isDurationDisabled: true,
      isSessionTypeDisabled: true,
    };
  }

  throw new DeveloperError('Type for defeault values schedule patient session form not exisitng');
}

export function findScheduledSessionSingleWithDuration(
  form: UseFormReturn<ManageScheduleForPatientFormFields>,
  timeslot: TimeSlot,
  duration: SessionDuration,
): ScheduledPatientSessionSingle | undefined {
  return (form.getValues().scheduledSlots || []).find((slot) => {
    return slot.date.getTime() === timeslot.time && slot.duration === duration;
  });
}

export function findScheduledSessionRecurringWithDuration(
  form: UseFormReturn<ManageScheduleForPatientFormFields>,
  timeslot: TimeSlot,
  duration: SessionDuration,
) {
  return (form.getValues().recurringSlots ?? []).find((group) =>
    group.slots.some((slot) => {
      return slot.date.getTime() === timeslot.time && slot.duration === duration;
    }),
  );
}

type Scheduled30MinuteSessionsForHour = {
  top?: ScheduledPatientSessionSingle | ScheduledPatientSessionRecurring;
  middle?: ScheduledPatientSessionSingle | ScheduledPatientSessionRecurring;
};

export function find30MinuteScheduledSessionsForHour(
  form: UseFormReturn<ManageScheduleForPatientFormFields>,
  calendarItemHour: CalendarItemHour,
): Scheduled30MinuteSessionsForHour {
  const hourTimeSlots: [TimeSlot, keyof Scheduled30MinuteSessionsForHour][] = [
    [calendarItemHour.topOfHourTimeslot, 'top'],
    [calendarItemHour.middleOfHourTimeslot, 'middle'],
  ];

  const found: Scheduled30MinuteSessionsForHour = { top: undefined, middle: undefined };

  for (const [timeslot, key] of hourTimeSlots) {
    const foundSingle = findScheduledSessionSingleWithDuration(
      form,
      timeslot,
      SessionDuration.Thirty,
    );
    if (foundSingle) {
      found[key] = foundSingle;
      continue;
    }

    const foundRecurring = findScheduledSessionRecurringWithDuration(
      form,
      timeslot,
      SessionDuration.Thirty,
    );
    if (foundRecurring) {
      found[key] = foundRecurring;
      continue;
    }
  }

  return found;
}
