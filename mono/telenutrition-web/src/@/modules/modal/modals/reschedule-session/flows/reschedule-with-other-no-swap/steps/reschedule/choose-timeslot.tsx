import { AppointmentRecord } from 'api/types';
import type { ProviderRecord } from '@mono/telenutrition/lib/types';
import { UseFormReturn } from 'react-hook-form';
import useFetchProviderByIdAppointments from 'api/provider/useFetchProviderByIdAppointments';
import ContainerLoading from '@/ui-components/loading/container-loading';
import GetErrorDislpay from '@/modules/errors/get-error-display';
import * as _ from 'lodash';
import { RescheduleWithOtherRescheduleFields } from '.';
import { DateTime } from 'luxon';
import RescheduleCalendar, { RescheduleCalendarFormFields } from '@/features/reschedule-calendar';

export default function ChooseTimeslot({
  provider,
  rescheduleAppointment,
  form,
}: {
  provider: ProviderRecord;
  rescheduleAppointment: AppointmentRecord;
  form: UseFormReturn<RescheduleWithOtherRescheduleFields>;
}) {
  const { data, error, isLoading, refetch } = useFetchProviderByIdAppointments(provider.providerId);

  if (isLoading) return <ContainerLoading />;
  if (error) return <GetErrorDislpay refetch={refetch} error={error} />;

  const appointmentsByDate = _.groupBy(data.slots, (appt) => appt.date);

  return (
    <RescheduleCalendar
      minRescheduleDate={DateTime.now().setZone(data.timezone).startOf('day').plus({ days: 2 })}
      //TODO: try to type this
      form={form as any as UseFormReturn<RescheduleCalendarFormFields>}
      appointmentsByDate={appointmentsByDate}
      providerTimezone={provider.timezone ?? 'America/Los_Angeles'}
      rescheduleAppointment={rescheduleAppointment}
      config={{
        hideUnfreezeButton: true,
      }}
    />
  );
}
