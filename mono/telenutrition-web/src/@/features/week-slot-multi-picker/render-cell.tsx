import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { CalendarItemHour } from '@/selectors/calendarItemsSelector';
import { useMultiStepFormContext } from '@/modules/multi-step-form';
import ScheduledSingleSession from './cells/scheduled-single-session';
import ScheduledRecurringSession from './cells/scheduled-recurring-session';
import BookedWithSamePatient from './cells/booked-with-same-patient';
import Frozen from './cells/frozen';
import Available from './cells/available';
import CellSkeleton from './cell-skeleton';
import { TimeSlot } from '@/selectors/calendarItemsSelector/helpers';
import { AppointmentRecord, HouseholdMemberSchedulable } from 'api/types';
import { DeveloperError } from 'utils/errors';

import { SessionDuration } from 'types/globals';
import {
  findScheduledSessionSingleWithDuration,
  findScheduledSessionRecurringWithDuration,
  find30MinuteScheduledSessionsForHour,
} from '../patient-scheduler/helpers';
import { ManageScheduleForPatientFormFields } from '../patient-scheduler/types';
import { DayScheduleType } from '.';
import { cn } from '@/utils';

interface RenderCellProps {
  patient: HouseholdMemberSchedulable;
  item: CalendarItemHour | null;
  dayScheduleType: DayScheduleType;
}

export default function RenderCell({ item, patient, dayScheduleType }: RenderCellProps) {
  const { t } = useTranslation();
  const { form } = useMultiStepFormContext<ManageScheduleForPatientFormFields>();

  if (!item) {
    return <div>{t('Error ... not found')}</div>;
  }

  if (item.type === '30-minute-slots') {
    return (
      <div className="h-full w-full flex flex-col">
        {[
          { timeslot: item.topOfHourTimeslot, appt: item.topOfHourAppt },
          { timeslot: item.middleOfHourTimeslot, appt: item.middleOfHourAppt },
        ].map(({ timeslot, appt }) => (
          <Render30MinuteSlot
            key={timeslot.time}
            form={form}
            appointment={appt}
            timeslot={timeslot}
            patient={patient}
            dayScheduleType={dayScheduleType}
          />
        ))}
      </div>
    );
  }

  if (item.type === 'has-conflicting') {
    return <CellSkeleton className="bg-neutral-115 text-neutral-400"></CellSkeleton>;
  }

  const scheduledHourSessionSingle = findScheduledSessionSingleWithDuration(
    form,
    item.topOfHourTimeslot,
    SessionDuration.Sixty,
  );

  if (scheduledHourSessionSingle) {
    return (
      <ScheduledSingleSession
        session={scheduledHourSessionSingle}
        dateTime={item.topOfHourTimeslot.dateTime}
      />
    );
  }

  const scheduledHourSessionRecurring = findScheduledSessionRecurringWithDuration(
    form,
    item.topOfHourTimeslot,
    SessionDuration.Sixty,
  );

  if (scheduledHourSessionRecurring) {
    return (
      <ScheduledRecurringSession
        session={scheduledHourSessionRecurring}
        dateTime={item.topOfHourTimeslot.dateTime}
      />
    );
  }

  const { top, middle } = find30MinuteScheduledSessionsForHour(form, item);

  if (!!top || !!middle) {
    if (item.type !== '60-minute-available') {
      throw new DeveloperError('Expecting item found to be 60 min available');
    }

    return (
      <div className="h-full w-full flex flex-col">
        {!top ? (
          <Available
            dayScheduleType={dayScheduleType}
            duration={30}
            dateTime={item.topOfHourTimeslot.dateTime}
            appointmentIds={{ primary: item.appointmentIds.primary }}
          />
        ) : top.type === 'single' ? (
          <ScheduledSingleSession session={top} dateTime={item.topOfHourTimeslot.dateTime} />
        ) : (
          <ScheduledRecurringSession session={top} dateTime={item.topOfHourTimeslot.dateTime} />
        )}

        {!middle ? (
          <Available
            dayScheduleType={dayScheduleType}
            duration={30}
            dateTime={item.middleOfHourTimeslot.dateTime}
            appointmentIds={{ primary: item.appointmentIds.primary }}
          />
        ) : middle.type === 'single' ? (
          <ScheduledSingleSession session={middle} dateTime={item.middleOfHourTimeslot.dateTime} />
        ) : (
          <ScheduledRecurringSession
            session={middle}
            dateTime={item.middleOfHourTimeslot.dateTime}
          />
        )}
      </div>
    );
  }

  if (item.type === '60-minute-appointment') {
    if (item.appointment.patient && patient.patientId === item.appointment.patient.patientId) {
      return <BookedWithSamePatient dayScheduleType={dayScheduleType} />;
    }
    return (
      <CellSkeleton
        className={cn(
          'bg-status-amber-100 text-status-amber-700',
          dayScheduleType !== 'allowed' && 'opacity-60',
        )}
      >
        {t('Booked')}
      </CellSkeleton>
    );
  }

  if (item.type === '60-minute-unavailable') {
    return (
      <Frozen
        dateTime={item.topOfHourTimeslot.dateTime}
        duration={60}
        timeDisplay={item.topOfHourTimeslot.display}
        dayScheduleType={dayScheduleType}
      />
    );
  }

  if (item.type === '60-minute-available') {
    return (
      <Available
        dayScheduleType={dayScheduleType}
        duration={60}
        dateTime={item.topOfHourTimeslot.dateTime}
        appointmentIds={item.appointmentIds}
      />
    );
  }

  throw new DeveloperError('Could not determine what to render for cell');
}

function Render30MinuteSlot({
  appointment,
  timeslot,
  patient,
  form,
  dayScheduleType,
}: {
  timeslot: TimeSlot;
  appointment?: AppointmentRecord;
  patient: HouseholdMemberSchedulable;
  form: UseFormReturn<ManageScheduleForPatientFormFields>;
  dayScheduleType: DayScheduleType;
}) {
  const { t } = useTranslation();
  const scheduledHourSessionSingle = findScheduledSessionSingleWithDuration(
    form,
    timeslot,
    SessionDuration.Thirty,
  );

  if (scheduledHourSessionSingle) {
    return (
      <ScheduledSingleSession session={scheduledHourSessionSingle} dateTime={timeslot.dateTime} />
    );
  }
  const scheduledHourSessionRecurring = findScheduledSessionRecurringWithDuration(
    form,
    timeslot,
    SessionDuration.Thirty,
  );

  if (scheduledHourSessionRecurring) {
    return (
      <ScheduledRecurringSession
        session={scheduledHourSessionRecurring}
        dateTime={timeslot.dateTime}
      />
    );
  }

  if (!appointment) {
    return (
      <Frozen
        dateTime={timeslot.dateTime}
        duration={30}
        timeDisplay={timeslot.display}
        dayScheduleType={dayScheduleType}
      />
    );
  }

  if (appointment.status === 'f') {
    if (appointment.patient && patient.patientId === appointment.patient?.patientId) {
      return <BookedWithSamePatient dayScheduleType={dayScheduleType} />;
    }
    return (
      <CellSkeleton className="bg-status-amber-100 text-status-amber-700">
        {t('Booked')}
      </CellSkeleton>
    );
  }

  if (appointment.bookable === false) {
    return (
      <CellSkeleton className="bg-status-red-100 text-neutral-400">
        {/* {t('Not bookable')} */}
      </CellSkeleton>
    );
  }

  if (patient.schedulingInfo.validAppointmentDurations.some((duration) => duration !== 30)) {
    // available but cannot schedule 30-minute slot for thie patient
    return <CellSkeleton className="bg-neutral-115 text-neutral-400"></CellSkeleton>;
  } else {
    return (
      <Available
        dayScheduleType={dayScheduleType}
        duration={30}
        dateTime={timeslot.dateTime}
        appointmentIds={{
          primary: appointment.appointmentId,
        }}
      />
    );
  }
}
