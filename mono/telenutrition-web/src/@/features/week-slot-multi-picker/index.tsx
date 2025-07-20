import WeekNavigator from '@/modules/calendar/week-view/week-navigator';
import RenderCell from './render-cell';
import { NavigationBar } from '@/modules/calendar/week-view';
import { WeekViewSchedulingContextProvider } from './context';
import ColumnHeaderCell from './column-header-cell';
import { AppointmentRecord, HouseholdMemberSchedulable } from 'api/types';
import { DateTime } from 'luxon';
import { cn } from '@/utils';
import { useMultiStepFormContext } from '@/modules/multi-step-form';
import { ManageScheduleForPatientFormFields } from '../patient-scheduler/types';
import useGetPatientDisabledSchedulingDays, {
  getDisabledDaysFromScheduledAppointmentDates,
} from '@/selectors/useGetPatientDisabledSchedulingDays';
import ContainerLoading from '@/ui-components/loading/container-loading';
import GetErrorDislpay from '@/modules/errors/get-error-display';
import { DeveloperError } from 'utils/errors';

export type DayScheduleType =
  // day is not schedulable due to already scheduled appointment limitation
  | 'disallowed'
  // day is not available due to a tentative appointment (within this same flow)
  | 'tentative-disallowed'
  // day is able to be scheduled
  | 'allowed'
  // date is in past
  | 'past';

interface Props {
  providerAppointments: AppointmentRecord[];
  providerTimezone: string;
  patient: HouseholdMemberSchedulable;
}

export default function WeekSlotMultiPicker({
  providerAppointments,
  providerTimezone,
  patient,
}: Props) {
  const { form } = useMultiStepFormContext<ManageScheduleForPatientFormFields>();
  const formScheduledSlots = form.getValues('scheduledSlots') ?? [];
  const formRecurringScheduleSlots = form.getValues('recurringSlots') ?? [];
  const getPatientDisabledSchedulingDays = useGetPatientDisabledSchedulingDays({
    patientId: patient.patientId,
  });

  const pendingScheduledDates = [
    ...formScheduledSlots.map((slot) => DateTime.fromJSDate(slot.date).startOf('day')),
    ...formRecurringScheduleSlots.reduce((acc, recurSlot) => {
      return [...acc, ...recurSlot.slots.map((s) => DateTime.fromJSDate(s.date).startOf('day'))];
    }, [] as DateTime[]),
  ];

  if (getPatientDisabledSchedulingDays.loading) return <ContainerLoading />;
  if (getPatientDisabledSchedulingDays.error) {
    return (
      <GetErrorDislpay
        error={getPatientDisabledSchedulingDays.error}
        refetch={getPatientDisabledSchedulingDays.refetch}
      />
    );
  }

  const unavailablePendingDates =
    getDisabledDaysFromScheduledAppointmentDates(pendingScheduledDates);

  function getDayScheduleType(dt: DateTime): DayScheduleType {
    if (getPatientDisabledSchedulingDays.loading || getPatientDisabledSchedulingDays.error) {
      throw new DeveloperError('Should have loaded disabled scheduling days before rendering');
    }
    if (dt < DateTime.now().startOf('day')) {
      return 'past';
    }
    if (
      getPatientDisabledSchedulingDays.disabledDays
        .map((d) => d.toFormat('LL/dd/yyyy'))
        .includes(dt.toFormat('LL/dd/yyyy'))
    ) {
      return 'disallowed';
    }
    if (
      unavailablePendingDates
        .map((d) => d.toFormat('LL/dd/yyyy'))
        .includes(dt.toFormat('LL/dd/yyyy'))
    ) {
      return 'tentative-disallowed';
    }
    return 'allowed';
  }

  return (
    <WeekViewSchedulingContextProvider
      providerAppointments={providerAppointments}
      providerTimezone={providerTimezone}
      patientData={patient}
    >
      {({ weekPicker, getItemForDate }) => (
        <>
          <NavigationBar {...weekPicker} />
          <WeekNavigator
            {...weekPicker}
            // TODO: where to get these
            startTime={'06:00'}
            // TODO: where to get these
            endTime={'20:00'}
            increment={60}
            rowHeight={80}
            renderCell={(date) => {
              const item = getItemForDate(date);
              const dayScheduleType = getDayScheduleType(DateTime.fromJSDate(date));
              if (!item) return <div>error</div>;
              return (
                <div
                  className={cn('flex items-center justify-center h-full w-full cursor-default')}
                >
                  <RenderCell patient={patient} item={item} dayScheduleType={dayScheduleType} />
                </div>
              );
            }}
            renderColKey={(date, _day) => {
              const dayScheduleType = getDayScheduleType(DateTime.fromJSDate(date));
              return <ColumnHeaderCell date={date} dayScheduleType={dayScheduleType} />;
            }}
          />
        </>
      )}
    </WeekViewSchedulingContextProvider>
  );
}
