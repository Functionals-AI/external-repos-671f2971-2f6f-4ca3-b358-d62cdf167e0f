import React, { useMemo } from 'react';
import { UseGetProviderAppointmentsResult } from 'api/provider/useGetProviderAppointments';
import Modal from '@/modules/modal/ui/modal';
import Section, { SectionDivider } from '@/ui-components/section';
import { Trans } from 'react-i18next';
import { Badge } from '@/ui-components/badge';
import calendarItemsSelector from '@/selectors/calendarItemsSelector';
import { Button } from '@/ui-components/button';
import { groupBy } from 'lodash';
import { DateTime } from 'luxon';
import { cn } from '@/utils';
import { AppointmentRecord } from 'api/types';
import { useModal } from '@/modules/modal';
import BookedAppointmentRow from './booked-appointment-row';
import OpenSlotRow from './open-slot-row';

export interface DisplayConflictsFields {
  appt: AppointmentRecord;
  action: ConflictActionEnum;
}

export enum ConflictActionEnum {
  RESCHEDULE = 'reschedule',
  CANCEL = 'cancel',
}

interface DisplayConflictsProps {
  data: UseGetProviderAppointmentsResult;
  topOfHour: number;
  dateISO: string;
  initialAppointmentIds: number[];
  onHandle: (values: DisplayConflictsFields) => void;
}

export default function DisplayConflicts(props: DisplayConflictsProps) {
  const { onHandle, data, topOfHour, dateISO, initialAppointmentIds } = props;
  const modal = useModal();

  const appointmentsByDay = useMemo(() => groupBy(data.slots, (slot) => slot.date), [data.slots]);

  const calendarItems = useMemo(() => {
    const dateTime = DateTime.fromISO(dateISO);
    const selectedDayKey = dateTime.toFormat('LL/dd/yyyy');
    return calendarItemsSelector({
      appointmentsForDay: appointmentsByDay[selectedDayKey] ?? [],
      displayTimezone: data.timezone,
      date: dateTime.toJSDate(),
    });
  }, [appointmentsByDay, data.timezone, dateISO]);

  const found = calendarItems.find((item) => item.topOfHourTimeslot.time === topOfHour);
  const hasConflicts = found && found.type === 'has-conflicting' && !!found.appointments.length;

  const isAppointmentConflict = (id: number) => {
    if (!hasConflicts) return false;
    return !!found.appointments.find((appt) => appt.appointmentId === id);
  };

  return (
    <>
      <Modal.Header title={<Trans>Resolve session conflicts</Trans>} />
      <Modal.Body>
        <Section title={<Trans>Status</Trans>}>
          <Badge
            className="w-fit"
            variant={!hasConflicts ? 'blue' : 'statusRed'}
            leftIconName={'dot'}
          >
            {!hasConflicts ? 'No conflicts' : `${found.appointments.length} conflicts`}
          </Badge>
        </Section>
        <SectionDivider />
        <Section
          title={<Trans>Sessions</Trans>}
          subtitle={
            <h4 className="text-sm text-neutral-700">
              <Trans>
                Use the “edit buttons” to adjust the date and times of the conflicting appointments.
              </Trans>
            </h4>
          }
        >
          <div className="flex flex-col border rounded-md w-full">
            {initialAppointmentIds.map((id, ind) => {
              const appt = data.slots.find(({ appointmentId }) => appointmentId === id);
              if (!appt) return null;
              const isConflict = isAppointmentConflict(id);

              if (appt.status === 'o') {
                return (
                  <OpenSlotRow
                    key={appt.appointmentId}
                    isConflict={isConflict}
                    appointment={appt}
                    className={cn(ind !== initialAppointmentIds.length - 1 && 'border-b')}
                  />
                );
              }

              return (
                <BookedAppointmentRow
                  key={appt.appointmentId}
                  isConflict={isConflict}
                  appointment={appt}
                  className={cn(ind !== initialAppointmentIds.length - 1 && 'border-b')}
                  onReschedule={() => {
                    onHandle({
                      appt,
                      action: ConflictActionEnum.RESCHEDULE,
                    });
                  }}
                  onCancel={() => {
                    onHandle({
                      appt,
                      action: ConflictActionEnum.CANCEL,
                    });
                  }}
                />
              );
            })}
          </div>
        </Section>
      </Modal.Body>
      <Modal.Footer className="justify-end">
        <Modal.Footer.ButtonGroup>
          <Button variant="secondary" onClick={() => modal.closeAll()}>
            <Trans>Cancel</Trans>
          </Button>
          <Button onClick={() => modal.closeAll()}>
            <Trans>Done</Trans>
          </Button>
        </Modal.Footer.ButtonGroup>
      </Modal.Footer>
    </>
  );
}
