import { FormV2 } from '@/modules/form/form';
import { useSingleDateNavigator } from '@/modules/calendar/date-navigator/useSingleDateNavigator';
import { Button } from '@/ui-components/button';
import { useEffect, useMemo } from 'react';
import calendarItemsSelector from '@/selectors/calendarItemsSelector';
import ReschedulableSlotsList from './reschedulable-slots-list';
import { DeveloperError } from 'utils/errors';
import { Trans, useTranslation } from 'react-i18next';
import { DateTime } from 'luxon';
import DateNavigatorWithAppointmentDetails from '@/modules/calendar/date-navigator/date-navigator-with-appointment-details';
import {
  DEFAULT_CONFIG,
  RescheduleCalendarContext,
  TimeslotSelectorConfig,
  TimezoneDisplayValue,
} from './context';
import { UseFormReturn, FieldValues } from 'react-hook-form';
import { AppointmentRecord } from 'api/types';
import type { PatientRecord } from '@mono/telenutrition/lib/types';
import _ from 'lodash';

export type RescheduleStepFormFields = RescheduleCalendarFormFields;

function isAppointmentWithPatient(
  appointment: AppointmentRecord,
): appointment is Omit<AppointmentRecord, 'patient'> & { patient: PatientRecord } {
  return !!appointment.patient;
}

export interface RescheduleCalendarFormFields extends FieldValues {
  timezoneDisplay: TimezoneDisplayValue;
  timeISO: string; // date + time
  date: DateTime; // Only for date, not time
  newAppointmentIds: number[];
}

interface RescheduleCalendarProps {
  form: UseFormReturn<RescheduleCalendarFormFields>;
  rescheduleAppointment: AppointmentRecord;
  appointmentsByDate: Record<string, AppointmentRecord[]>;
  providerTimezone: string;
  config?: Partial<TimeslotSelectorConfig>;
  minRescheduleDate?: DateTime;
}

export default function RescheduleCalendar({
  config,
  form,
  rescheduleAppointment,
  providerTimezone,
  appointmentsByDate,
  minRescheduleDate,
}: RescheduleCalendarProps) {
  if (!isAppointmentWithPatient(rescheduleAppointment)) {
    throw new DeveloperError(
      'Should not be able to access reschedule flow for appointment without a patient',
    );
  }

  const { t } = useTranslation();
  const dateNavigator = useSingleDateNavigator({
    navigationType: 'day',
    min: minRescheduleDate ?? DateTime.now().startOf('day'),
    max: DateTime.now().plus({ days: 90 }).startOf('day'),
    defaultDate: form.getValues().date,
    onChange: (date) => {
      form.setValue('date', date);
      form.resetField('timeISO');
    },
  });

  const appointmentsForDay = useMemo(
    () => appointmentsByDate[dateNavigator.currentDate.toFormat('LL/dd/yyyy')],
    [dateNavigator.currentDate],
  );

  form.register('newAppointmentIds', { required: true });

  const watch = form.watch(['date', 'timeISO', 'timezoneDisplay']);

  const calendarItemsList = useMemo(() => {
    return calendarItemsSelector({
      appointmentsForDay,
      date: dateNavigator.currentDate.toJSDate(),
      displayTimezone: providerTimezone,
    });
  }, [appointmentsForDay, dateNavigator.currentDate, providerTimezone]);

  useEffect(() => {
    if (!form.getValues().date) {
      form.setValue('date', dateNavigator.currentDate);
    }
  }, []);

  useEffect(() => {
    const [date, timeISO] = watch;

    if (date && timeISO) {
      // Assumes matching date because calendarItemsList changes by day
      const newAppt = calendarItemsList.find(
        (appt) =>
          appt.topOfHourTimeslot.dateTime.toISO() === timeISO ||
          appt.middleOfHourTimeslot.dateTime.toISO() === timeISO,
      );

      if (!newAppt) throw new DeveloperError('Could not match up timeSlot to calendarItem');

      if (newAppt.type === '60-minute-available') {
        form.setValue('newAppointmentIds', [
          newAppt.appointmentIds.primary,
          newAppt.appointmentIds.secondary,
        ]);

        return;
      }

      if (newAppt.type === '30-minute-slots') {
        if (newAppt.topOfHourTimeslot.dateTime.toISO() === timeISO && newAppt.topOfHourAppt) {
          form.setValue('newAppointmentIds', [newAppt.topOfHourAppt.appointmentId]);
          return;
        } else if (
          newAppt.middleOfHourTimeslot.dateTime.toISO() === timeISO &&
          newAppt.middleOfHourAppt
        ) {
          form.setValue('newAppointmentIds', [newAppt.middleOfHourAppt.appointmentId]);
          return;
        }
      }

      throw new DeveloperError('Could not find matching timeSlot');
    }
  }, [watch, calendarItemsList]);

  return (
    <RescheduleCalendarContext.Provider
      value={{
        form,
        rescheduleAppointment,
        appointmentsByDate,
        providerTimezone,
        config: { ...DEFAULT_CONFIG, ...config },
      }}
    >
      <>
        <div className="flex flex-col p-4 gap-y-4">
          <div className="flex justify-between items-center">
            <DateNavigatorWithAppointmentDetails
              dateNavigator={dateNavigator}
              appointmentsByDay={appointmentsByDate}
            />
            <Button
              onClick={dateNavigator.today}
              variant="tertiary"
              leftIcon={{ name: 'calendar-arrow', color: 'fsGreen' }}
            >
              <Trans>Today</Trans>
            </Button>
          </div>
          <FormV2.FormButtonToggle
            form={form}
            id="timezoneDisplay"
            className="w-full"
            defaultValue={TimezoneDisplayValue.LOCAL}
            options={[
              { name: t('Local time'), value: 'local', iconName: 'clock' },
              { name: t('Patient time'), value: 'patient', iconName: 'map-pin' },
            ]}
          />
        </div>
        <ReschedulableSlotsList calendarItemsList={calendarItemsList} />
      </>
    </RescheduleCalendarContext.Provider>
  );
}
