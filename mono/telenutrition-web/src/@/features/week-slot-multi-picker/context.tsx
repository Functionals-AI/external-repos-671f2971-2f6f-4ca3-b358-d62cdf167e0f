import { UseWeekPickerReturn, useWeekPicker } from '@/modules/calendar/week-view';
import calendarItemsSelector, { CalendarItemHour } from '@/selectors/calendarItemsSelector';
import { AppointmentRecord } from 'api/types';
import type { PatientRecord } from '@mono/telenutrition/lib/types';
import _, { groupBy } from 'lodash';
import { DateTime } from 'luxon';
import { ReactNode, createContext, useContext, useMemo, useEffect } from 'react';
import { useMultiStepFormContext } from '@/modules/multi-step-form';
import { useModal } from '@/modules/modal';

import { DeveloperError } from 'utils/errors';
import { HouseholdMemberSchedulable } from 'api/types';
import TimeDifferenceBadge from '@/smart-components/time-difference-badge';
import { Trans } from 'react-i18next';
import { useDateHelpers } from '@/modules/dates';
import {
  ManageScheduleForPatientFormFields,
  OpenSchedulePatientSessionModalParams,
  RemoveRecurringType,
  ScheduledPatientSession,
  ScheduledPatientSessionRecurring,
  ScheduledPatientSessionSingle,
} from '../patient-scheduler/types';
import { getDefaultValuesForSchedulePatientSessionForm } from '../patient-scheduler/helpers';
import RemoveRecurringSessionsModal from '../patient-scheduler/modals/remove-recurring-sessions-modal';
import { useSidePanelContext } from '../provider/dashboard/side-panel/context';

interface WeekSlotMultiPickerContextType {
  weekPicker: UseWeekPickerReturn;
  calendarItemsForWeek: Record<string, CalendarItemHour[]>;
  patient: PatientRecord;
  getItemForDate: (date: Date) => CalendarItemHour | null;
  onSelect: () => void;
  openScheduleSlotOptionsModal: any;
  openSchedulePatientSessionModal: (params: OpenSchedulePatientSessionModalParams) => void;
  openConfirmRemoveSingleSessionModal: (session: ScheduledPatientSessionSingle) => void;
  openConfirmRemoveRecurringSessionsModal: (
    session: ScheduledPatientSessionRecurring,
    dateTime: DateTime,
  ) => void;
  openUnfreezeSlotModal: (params: {
    dateTime: DateTime;
    duration: number;
    timeDisplay: string;
  }) => void;
}

const WeekSlotMultiPickerContext = createContext<null | WeekSlotMultiPickerContextType>(null);

export function useWeekViewSchedulingContext() {
  const context = useContext(WeekSlotMultiPickerContext);

  if (!context) {
    throw new DeveloperError('Must have WeekViewSchedulingContext.Provider to use this hook');
  }

  return context;
}

interface WeekViewSchedulingContextProviderProps {
  providerAppointments: AppointmentRecord[];
  providerTimezone: string;
  patientData: HouseholdMemberSchedulable;
  children: (context: WeekSlotMultiPickerContextType) => ReactNode;
}

export function WeekViewSchedulingContextProvider({
  providerAppointments,
  providerTimezone,
  patientData,
  children,
}: WeekViewSchedulingContextProviderProps) {
  const { filteredOverbookingSlots } = useSidePanelContext();

  const modal = useModal();
  const { form } = useMultiStepFormContext<ManageScheduleForPatientFormFields>();
  const viewDate = form.getValues('viewDate');
  const weekPicker = useWeekPicker(providerTimezone, viewDate);
  const appointmentsByDay = groupBy(providerAppointments, (appt) => {
    return DateTime.fromJSDate(new Date(appt.startTimestamp))
      .setZone(providerTimezone)
      .toFormat('LL/dd/yyyy');
  });

  const { asTime } = useDateHelpers();

  const calendarItemsForWeek = useMemo(
    () =>
      weekPicker.selectedDates.reduce(
        (acc, date) => {
          const key = DateTime.fromJSDate(date).toFormat('LL/dd/yyyy');

          const items = calendarItemsSelector({
            appointmentsForDay: appointmentsByDay[key] ?? [],
            displayTimezone: providerTimezone,
            date,
            earlierTimezoneShift: true,
            overbookingSlots: filteredOverbookingSlots.map(({ vacancy }) => vacancy),
          });

          return {
            ...acc,
            [key]: items,
          };
        },
        {} as Record<string, CalendarItemHour[]>,
      ),
    [appointmentsByDay, filteredOverbookingSlots, providerTimezone, weekPicker.selectedDates],
  );

  useEffect(() => {
    form.setValue('viewDate', weekPicker.selectedDates[0]);
  }, [form, weekPicker.selectedDates]);

  function getItemForDate(date: Date): CalendarItemHour | null {
    const key = DateTime.fromJSDate(date, { zone: providerTimezone }).toFormat('LL/dd/yyyy');
    const displayedHourDateTime = DateTime.fromJSDate(date);
    const timeSearchLabel = displayedHourDateTime
      .toFormat('h:mma')
      .replace('AM', 'am')
      .replace('PM', 'pm');
    const calendarItemsForDay = calendarItemsForWeek[key] ?? [];

    const found =
      calendarItemsForDay.find((slot) => {
        return slot.topOfHourTimeslot.display === timeSearchLabel;
      }) ?? null;

    return found;
  }

  function updateFormStateWithSession(session: ScheduledPatientSession, date: Date) {
    const currSlots = (form.getValues().scheduledSlots ?? []).filter(
      (slot) => slot.date.getTime() !== date.getTime(),
    );
    if (session.type === 'single') {
      // Order doesn't matter here, so just check if this date is already accounted for, remove, and re-add
      form.setValue('scheduledSlots', [...currSlots, session]);
    } else {
      // If this slot is non-recurring already existing, this removes it from that list to make sure we don't have a duplicate.
      form.setValue('scheduledSlots', currSlots);
      form.setValue('recurringSlots', [...(form.getValues().recurringSlots ?? []), session]);
    }
  }

  function openConfirmRemoveSingleSessionModal(session: ScheduledPatientSessionSingle) {
    modal.openSecondary({
      type: 'basic-dialog',
      title: 'Remove session?',
      body: 'Are you sure you want to remove this session?',
      theme: 'destructive',
      secondaryButton: {
        text: 'Go back',
        onClick: modal.closeSecondary,
      },
      primaryButton: {
        text: 'Yes',
        onClick: () => {
          form.setValue(
            'scheduledSlots',
            (form.getValues().scheduledSlots ?? []).filter(
              (s) => s.date.getTime() !== session.date.getTime(),
            ),
          );
          modal.closeSecondary();
        },
      },
    });
  }

  function openUnfreezeSlotModal({
    dateTime,
    duration,
    timeDisplay,
  }: {
    dateTime: DateTime;
    duration: number;
    timeDisplay: string;
  }) {
    modal.openSecondary({
      type: 'unfreeze-slot',
      date: dateTime.toJSDate(),
      duration,
      timeDisplay,
    });
  }

  function openConfirmRemoveRecurringSessionsModal(
    session: ScheduledPatientSessionRecurring,
    dateTime: DateTime,
  ) {
    modal.openSecondary({
      type: 'custom',
      modal: (
        <RemoveRecurringSessionsModal
          onSubmit={(values) => {
            const { recurringSlots } = form.getValues();
            const recurringSlotsWithoutCurrent = recurringSlots.filter((s) => s.id !== session.id);

            if (values.removeType === RemoveRecurringType.AllSessions) {
              form.setValue('recurringSlots', recurringSlotsWithoutCurrent);
            } else if (values.removeType === RemoveRecurringType.JustThisSession) {
              const sessionSlotsUpdated = session.slots.filter(
                (slot) => slot.date.getTime() !== dateTime.toJSDate().getTime(),
              );

              if (sessionSlotsUpdated.length === 0) {
                form.setValue('recurringSlots', recurringSlotsWithoutCurrent);
              } else {
                form.setValue(
                  'recurringSlots',
                  recurringSlotsWithoutCurrent.concat({
                    ..._.omit(session, 'slots'),
                    slots: sessionSlotsUpdated,
                  }),
                );
              }
            } else if (values.removeType === RemoveRecurringType.ThisAndFollowing) {
              const sessionSlotsUpdated = session.slots.filter(
                (slot) => DateTime.fromJSDate(slot.date) < dateTime,
              );

              if (sessionSlotsUpdated.length === 0) {
                form.setValue('recurringSlots', recurringSlotsWithoutCurrent);
              } else {
                form.setValue(
                  'recurringSlots',
                  recurringSlotsWithoutCurrent.concat({
                    ..._.omit(session, 'slots'),
                    slots: sessionSlotsUpdated,
                  }),
                );
              }
            } else {
              throw new DeveloperError('RemoveRecurringType functionality not implemented');
            }

            modal.closeSecondary();
          }}
        />
      ),
    });
  }

  function openScheduleSlotOptionsModal(params: any) {
    const { defaultValues, isDurationDisabled, isSessionTypeDisabled } =
      getDefaultValuesForSchedulePatientSessionForm(params, patientData);

    modal.openSecondary({
      type: 'schedule-slot-options',
      formType: params.type,
      appointmentsByDay: appointmentsByDay,
      appointmentIds: params.appointmentIds,
      onComplete: (values: any) => {
        updateFormStateWithSession(values, params.dateTime.toJSDate());
        modal.closeSecondary();
      },
      defaultValues: defaultValues,
      durationDisabled: isDurationDisabled,
      displayTime: asTime(params.dateTime),
      sessionTypeDisabled: isSessionTypeDisabled,
      displayTimeFooter: (
        <TimeDifferenceBadge
          timezone={patientData.timezone ?? null}
          date={params.dateTime}
          label={<Trans>Member time</Trans>}
          variant="statusAmber"
        />
      ),
    });
  }

  const value: WeekSlotMultiPickerContextType = {
    weekPicker,
    calendarItemsForWeek,
    openScheduleSlotOptionsModal,
    openConfirmRemoveSingleSessionModal,
    openConfirmRemoveRecurringSessionsModal,
    openUnfreezeSlotModal,
    patient: patientData,
    getItemForDate,
    onSelect: () => {},
    openSchedulePatientSessionModal: () => {},
  };

  return (
    <WeekSlotMultiPickerContext.Provider value={value}>
      {children(value)}
    </WeekSlotMultiPickerContext.Provider>
  );
}
