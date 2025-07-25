import { createContext, ReactNode, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DateTime } from 'luxon';

import { UseGetProviderAppointmentsResult } from 'api/provider/useGetProviderAppointments';
import { AppointmentRecord, EncounterOversightStatus, EncounterStatus } from 'api/types';
import { ApiGetError } from 'api/useGet';
import useFetchProviderTasks from 'api/provider/useFetchProviderTasks';
import { OverbookingSlot } from 'api/provider/useFetchProviderOverbookingSlots';
import { AppointmentIncompleteTask, ProviderCustomTask } from '../task-list/types';
import { useProviderDashboardContext } from '../context';
import { getDateRange } from '@/modules/calendar/date-navigator/useRangeDateNavigator';

const startOfHourISO = (iso: string) => DateTime.fromISO(iso).set({ minute: 0 }).toUTC().toISO();

interface SidePanelContextType {
  tasks: (AppointmentIncompleteTask | ProviderCustomTask)[];
  isLoading: boolean;
  error: ApiGetError | null;
  refetch: () => void;
  filteredOverbookingSlots: { slot?: AppointmentRecord; vacancy: OverbookingSlot }[];
}

export const SidePanelContext = createContext<SidePanelContextType>({
  tasks: [],
  isLoading: false,
  error: null,
  refetch: () => {},
  filteredOverbookingSlots: [],
});

export const useSidePanelContext = () => {
  const context = useContext(SidePanelContext);
  if (!context) throw new Error('You must have a Side Panel Context Provider');

  return context;
};

export function SidePanelProvider({
  appointmentData,
  timezone,
  children,
}: {
  appointmentData: UseGetProviderAppointmentsResult;
  timezone: string;
  // providerTasks: ProviderTaskRecord[];
  children: ReactNode;
}) {
  const { t } = useTranslation();

  const { data: providerTasksData, isLoading, error, refetch } = useFetchProviderTasks();

  const { providerOverbookingSlotsData, trackedDay, viewType } = useProviderDashboardContext();

  const tasks = useMemo(() => {
    const startOfToday = DateTime.now().setZone(appointmentData.timezone).startOf('day');

    const autoGeneratedTasks = appointmentData.slots
      .map<AppointmentIncompleteTask | null>((slot) => {
        const slotDateTime = DateTime.fromJSDate(new Date(slot.startTimestamp));
        if (slotDateTime < startOfToday) {
          if (slot.status === 'f') {
            return {
              type: 'incomplete-appointment',
              subtype: 'appointment-missed',
              appointment: slot,
              dateTime: slotDateTime,
              level: 'destructive',
              title: t('Missing visit information'),
            };
          }
        }

        if (slot.status === '2') {
          // If completed in FFD
          if (slot.encounterId) {
            return {
              type: 'incomplete-appointment',
              subtype: 'app-encounter-not-finalized',
              appointment: slot,
              dateTime: slotDateTime,
              level: 'warn',
              title: t('Encounter not submitted'),
            };
          }

          // If historical encounter
          else {
            return {
              type: 'incomplete-appointment',
              subtype: 'historical-encounter-not-finalized',
              appointment: slot,
              dateTime: slotDateTime,
              title: t('Encounter not submitted'),
              level: 'warn',
            };
          }
        }

        if (
          slot.status === '3' &&
            (slot.encounter?.encounterStatus === EncounterStatus.Oversight &&
              slot.encounter?.oversightStatus ===
                EncounterOversightStatus.ProviderResponseRequired)
        ) {
          return {
            type: 'incomplete-appointment',
            subtype: 'physician-review-needs-attention',
            appointment: slot,
            dateTime: slotDateTime,
            title: t('Physician Review needs attention'),
            level: 'destructive',
          };
        }

        return null;
      })
      .filter((task) => !!task) as AppointmentIncompleteTask[];

    let customTasks: ProviderCustomTask[] = [];

    if (providerTasksData?.tasks)
      customTasks = providerTasksData.tasks.map((task) => ({
        type: 'custom-task',
        name: task.name,
        note: task.note,
        dueDate: task.dueDate ? DateTime.fromISO(task.dueDate) : undefined,
        priority: task.priority,
        status: task.status,
        taskId: task.taskId,
      }));

    return [
      ...autoGeneratedTasks.sort(
        (a, b) => b.dateTime.toJSDate().getTime() - a.dateTime.toJSDate().getTime(),
      ),
      ...customTasks,
    ];
  }, [appointmentData.slots, appointmentData.timezone, providerTasksData, t]);

  const filteredOverbookingSlots = useMemo(() => {
    const filtered =
      providerOverbookingSlotsData?.data?.vacancies
        .map((os) => {
          const vacanciesTimestamps = [os.startTimestamp];
          const slots = [];
          if (os.duration === 60) {
            vacanciesTimestamps.push(
              DateTime.fromISO(os.startTimestamp).toUTC().set({ minute: 30 }).toISO()!,
            );
          }
          for (const slot of appointmentData.slots) {
            if (
              vacanciesTimestamps.includes(slot.startTimestamp) ||
              (slot.duration === 60 && startOfHourISO(os.startTimestamp) === slot.startTimestamp)
            ) {
              slots.push(slot);
            }
          }
          return {
            slots,
            vacancy: os,
          };
        })
        .filter(({ slots }) => {
          for (const slot of slots) {
            if (slot && !slot.bookable) return false;
          }
          return true;
        }) ?? [];

    let slotsInView: {
      slot?: AppointmentRecord;
      vacancy: OverbookingSlot;
    }[];
    if (viewType === 'single-day') {
      slotsInView = filtered.filter((vacancy) => {
        return (
          DateTime.fromISO(vacancy.vacancy.startTimestamp).toFormat('yyyy-MM-dd') ===
          trackedDay.toFormat('yyyy-MM-dd')
        );
      });
    } else {
      const dateRange = getDateRange({
        defaultDate: trackedDay,
        interval: 7,
        pivotDate: DateTime.now().setZone(timezone).startOf('week').minus({ days: 1 }),
      });

      slotsInView = filtered.filter((vacancy) => {
        return dateRange.some((date) => {
          return (
            DateTime.fromISO(vacancy.vacancy.startTimestamp).toFormat('yyyy-MM-dd') ===
            date.toFormat('yyyy-MM-dd')
          );
        });
      });
    }

    return slotsInView;
  }, [providerOverbookingSlotsData, appointmentData]) as {
    slot?: AppointmentRecord;
    vacancy: OverbookingSlot;
  }[];
  // our current version of ts doesnt support filter

  return (
    <SidePanelContext.Provider
      value={{
        tasks,
        isLoading,
        error,
        refetch,
        filteredOverbookingSlots,
      }}
    >
      {children}
    </SidePanelContext.Provider>
  );
}
