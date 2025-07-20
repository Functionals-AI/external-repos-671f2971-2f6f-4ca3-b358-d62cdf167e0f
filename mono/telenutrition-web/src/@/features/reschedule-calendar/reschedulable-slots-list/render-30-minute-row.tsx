import { TimeSlot } from '@/selectors/calendarItemsSelector/helpers';
import { AppointmentRecord } from 'api/types';
import BlockedTimeslot from './blocked-timeslot';
import RescheduleBlock from './reschedule-block';
import useMemberHelpers from '@/modules/member/useMemberHelpers';
import { useRescheduleCalendarContext } from '../context';
import { Trans } from 'react-i18next';

export default function Render30MinuteRow({
  timeslot,
  appointment,
}: {
  timeslot: TimeSlot;
  appointment?: AppointmentRecord;
}) {
  const {
    form,
    rescheduleAppointment: { patient },
  } = useRescheduleCalendarContext();
  const memberHelpers = useMemberHelpers();
  if (!appointment) {
    return <BlockedTimeslot timeslot={timeslot} duration={30} />;
  }
  if (appointment.status === 'f') {
    const isSamePatient = patient.patientId === appointment.patientId;

    return (
      <RescheduleBlock.Row>
        <RescheduleBlock.Label disabled timeslot={timeslot} />
        <RescheduleBlock.Content
          disallowed={!isSamePatient}
          className={isSamePatient ? '!bg-fs-pale-green-100 text-fs-green-600' : ''}
        >
          {isSamePatient
            ? `Already scheduled with ${memberHelpers.getDisplayNameFromAppointment({
                appointment,
              })}`
            : 'Visit Booked'}
        </RescheduleBlock.Content>
      </RescheduleBlock.Row>
    );
  }

  const isChecked = form.getValues().timeISO === timeslot.dateTime.toISO();
  return (
    <RescheduleBlock.Row>
      <RescheduleBlock.Label timeslot={timeslot} checked={isChecked} />
      <RescheduleBlock.Content highlighted={isChecked}>
        {isChecked && <Trans>Selected</Trans>}
      </RescheduleBlock.Content>
    </RescheduleBlock.Row>
  );
}
