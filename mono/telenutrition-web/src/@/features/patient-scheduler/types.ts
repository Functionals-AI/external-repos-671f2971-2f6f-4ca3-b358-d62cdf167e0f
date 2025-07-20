import { DateTime } from 'luxon';
import { SessionDuration, SessionType } from 'types/globals';
import { SchedulePatientSessionFields } from './modals/schedule-slot-options-modal';

export enum RemoveRecurringType {
  JustThisSession = 'JUST_THIS_SESSION',
  ThisAndFollowing = 'THIS_AND_FOLLOWING',
  AllSessions = 'ALL_SESSIONS',
}

export type ScheduledPatientSessionRecurring = {
  slots: {
    duration: SessionDuration;
    sessionType: SessionType;
    date: Date;
    appointmentIds: number[];
  }[];
  type: 'recurring';
  id: string;
};

export type ScheduledPatientSessionSingle = {
  type: 'single';
  duration: SessionDuration;
  sessionType: SessionType;
  date: Date;
  appointmentIds: number[];
  isLockedDuration: boolean;
};

export type ScheduledPatientSession =
  | ScheduledPatientSessionRecurring
  | ScheduledPatientSessionSingle;

export type ManageScheduleForPatientFormFields = {
  scheduledSlots: ScheduledPatientSessionSingle[];
  recurringSlots: ScheduledPatientSessionRecurring[];
  // need to keep track of view date when appointments refreshes
  viewDate?: Date
};

export type NonConflictingSlot = {
  appointmentIds: number[];
  isConflict: false;
  date: DateTime;
};

export type ConflictingSlot = {
  isConflict: true;
  date: DateTime;
  type: 'booked' | 'frozen';
};

export type FutureAppointmentSlot = NonConflictingSlot | ConflictingSlot;

export type OpenSchedulePatientSessionModalParams = {
  dateTime: DateTime;
} & (
  | {
      type: 'edit';
      session: ScheduledPatientSessionSingle;
    }
  | {
      type: 'create';
      appointmentIds: {
        primary: number;
        secondary?: number;
      };
      duration: 30 | 60;
    }
);

export type DefaultValuesPatientSessionForm = Partial<SchedulePatientSessionFields> &
  Required<Pick<SchedulePatientSessionFields, 'date'>>;
