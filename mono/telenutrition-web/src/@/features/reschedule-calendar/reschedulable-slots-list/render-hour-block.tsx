import { CalendarItemHour } from '@/selectors/calendarItemsSelector';
import BlockedTimeslot from './blocked-timeslot';
import Render30MinuteCell from './render-30-minute-row';
import RescheduleBlock from './reschedule-block';
import { Trans } from 'react-i18next';
import { DateTime } from 'luxon';
import useMemberHelpers from '@/modules/member/useMemberHelpers';
import { useRescheduleCalendarContext } from '../context';

interface RenderHourRescheduleBlockProps {
  item: CalendarItemHour;
}

export default function RenderHourRescheduleBlock({ item }: RenderHourRescheduleBlockProps) {
  const memberHelpers = useMemberHelpers();
  const {
    rescheduleAppointment: { patient },
    form,
  } = useRescheduleCalendarContext();

  const isTopOfHourChecked = form.getValues().timeISO === item.topOfHourTimeslot.dateTime.toISO();

  if (item.type === '60-minute-appointment') {
    const isSamePatient = patient.patientId === item.appointment.patientId;
    return (
      <RescheduleBlock>
        <RescheduleBlock.Row>
          <RescheduleBlock.Label disabled timeslot={item.topOfHourTimeslot} />
          <RescheduleBlock.Content
            disallowed={!isSamePatient}
            className={isSamePatient ? '!bg-fs-pale-green-100 text-fs-green-600' : ''}
          >
            {isSamePatient
              ? `Already scheduled with ${memberHelpers.getDisplayNameFromAppointment({
                  appointment: item.appointment,
                })}`
              : 'Visit Booked'}
          </RescheduleBlock.Content>
        </RescheduleBlock.Row>
        <RescheduleBlock.Row>
          <RescheduleBlock.Label disabled timeslot={item.middleOfHourTimeslot} />
          <RescheduleBlock.Content
            disallowed={!isSamePatient}
            className={isSamePatient ? 'bg-fs-pale-green-100' : ''}
          />
        </RescheduleBlock.Row>
      </RescheduleBlock>
    );
  }

  if (item.type === '60-minute-unavailable') {
    return (
      <RescheduleBlock>
        <BlockedTimeslot timeslot={item.topOfHourTimeslot} duration={60} />
        <RescheduleBlock.Row>
          <RescheduleBlock.Label disabled timeslot={item.middleOfHourTimeslot} />
          <RescheduleBlock.Content disallowed />
        </RescheduleBlock.Row>
      </RescheduleBlock>
    );
  }
  if (item.type === '60-minute-available') {
    const isAppointmentTimePassed = DateTime.now() > item.topOfHourTimeslot.dateTime;
    return (
      <RescheduleBlock>
        <RescheduleBlock.Row>
          <RescheduleBlock.Label
            disabled={isAppointmentTimePassed}
            timeslot={item.topOfHourTimeslot}
            checked={isTopOfHourChecked}
          />
          <RescheduleBlock.Content
            disallowed={isAppointmentTimePassed}
            highlighted={isTopOfHourChecked}
          >
            {isTopOfHourChecked && <Trans>Selected</Trans>}
          </RescheduleBlock.Content>
        </RescheduleBlock.Row>
        <RescheduleBlock.Row>
          <RescheduleBlock.Label disabled timeslot={item.middleOfHourTimeslot} />
          <RescheduleBlock.Content
            disallowed={isAppointmentTimePassed}
            highlighted={isTopOfHourChecked}
          />
        </RescheduleBlock.Row>
      </RescheduleBlock>
    );
  }

  if (item.type === 'has-conflicting') {
    return (
      <RescheduleBlock>
        <RescheduleBlock.Row>
          <RescheduleBlock.Label disabled timeslot={item.topOfHourTimeslot} />
          <RescheduleBlock.Content disallowed>
            <p>
              <Trans>Conflicting Appointments</Trans>
            </p>
          </RescheduleBlock.Content>
        </RescheduleBlock.Row>
        <RescheduleBlock.Row>
          <RescheduleBlock.Label disabled timeslot={item.middleOfHourTimeslot} />
          <RescheduleBlock.Content disallowed />
        </RescheduleBlock.Row>
      </RescheduleBlock>
    );
  }

  return (
    <RescheduleBlock>
      <Render30MinuteCell timeslot={item.topOfHourTimeslot} appointment={item.topOfHourAppt} />
      <Render30MinuteCell
        timeslot={item.middleOfHourTimeslot}
        appointment={item.middleOfHourAppt}
      />
    </RescheduleBlock>
  );
}
