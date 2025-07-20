import React, { useEffect, useState } from 'react';
import Modal from '@/modules/modal/ui/modal';
import { ResolveConflictsModalData } from '@/modules/modal/types';
import calendarItemsSelector from '@/selectors/calendarItemsSelector';
import { useFetchProviderAppointments } from 'api/provider/useGetProviderAppointments';
import { groupBy } from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import DisplayConflicts, {
  ConflictActionEnum,
  DisplayConflictsFields,
} from './flows/display-conflicts';
import { useModal } from '@/modules/modal';
import RescheduleConflict from './flows/reschedule-conflict';
import CancelConflict from './flows/cancel-conflict';
import GetErrorDislpay from '@/modules/errors/get-error-display';
import ContainerLoading from '@/ui-components/loading/container-loading';

export default function ResolveConflictsModal({ timeSlot }: ResolveConflictsModalData) {
  const { t } = useTranslation();
  const { data, isLoading, error, refetch } = useFetchProviderAppointments();
  const [initialAppointmentIds, setInitialAppointmentIds] = useState<number[]>();
  const modal = useModal();

  const topOfHour = timeSlot.time;

  useEffect(() => {
    if (!data || initialAppointmentIds) return;

    const appointmentsByDay = groupBy(data.slots, (slot) => slot.date);

    const dateTime = timeSlot.dateTime;
    const selectedDayKey = dateTime.toFormat('LL/dd/yyyy');
    const calendarItems = calendarItemsSelector({
      appointmentsForDay: appointmentsByDay[selectedDayKey] ?? [],
      displayTimezone: data.timezone,
      date: dateTime.toJSDate(),
    });

    const found = calendarItems.find((item) => item.topOfHourTimeslot.time === topOfHour);
    if (!found || found.type !== 'has-conflicting') {
      setInitialAppointmentIds([]);
    } else {
      setInitialAppointmentIds(found?.appointments.map(({ appointmentId }) => appointmentId));
    }
  }, [data, topOfHour]);

  if (isLoading || !initialAppointmentIds) return <ContainerLoading />;
  if (error) return <GetErrorDislpay refetch={refetch} error={error} />;

  const onRescheduleSuccess = (prevId: number, newId: number) => {
    setInitialAppointmentIds(initialAppointmentIds?.map((id) => (id === prevId ? newId : id)));
  };

  const onCancelSuccess = (cancelId: number) => {
    setInitialAppointmentIds(initialAppointmentIds?.filter((id) => id !== cancelId));
  };

  const onHandleConflictAppointment = (values: DisplayConflictsFields) => {
    if (values.action === ConflictActionEnum.RESCHEDULE) {
      modal.openSecondary({
        type: 'custom',
        modal: (
          <RescheduleConflict onSuccess={onRescheduleSuccess} rescheduleAppointment={values.appt} />
        ),
      });
    }
    if (values.action === ConflictActionEnum.CANCEL) {
      modal.openSecondary({
        type: 'custom',
        modal: <CancelConflict onSuccess={onCancelSuccess} cancelAppointment={values.appt} />,
      });
    }
  };

  return (
    <Modal size="lg">
      <DisplayConflicts
        data={data}
        initialAppointmentIds={initialAppointmentIds ?? []}
        topOfHour={topOfHour}
        dateISO={timeSlot.dateTime.toISO() as string}
        onHandle={(values) => {
          onHandleConflictAppointment(values);
        }}
      />
    </Modal>
  );
}
