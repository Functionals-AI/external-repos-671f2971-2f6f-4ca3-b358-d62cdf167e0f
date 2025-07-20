import { useFetchProviderAppointments } from 'api/provider/useGetProviderAppointments';
import _ from 'lodash';
import { useFetchProviderTimezone } from 'api/provider/useGetProviderTimezone';
import ContainerLoading from '@/ui-components/loading/container-loading';
import GetErrorDislpay from '@/modules/errors/get-error-display';
import ProviderAppointmentSection from '@/smart-components/provider-appointment/provider-appointment-section';
import Section, { SectionDivider } from '@/ui-components/section';
import { AppointmentRecord } from 'api/types';
import { useMultiStepFormContext } from '@/modules/multi-step-form';
import RescheduleCalendar, {
  RescheduleCalendarFormFields,
  RescheduleStepFormFields,
} from '@/features/reschedule-calendar';
import { UseFormReturn } from 'react-hook-form';
import { Trans } from 'react-i18next';

export default function RescheduleStep({
  rescheduleAppointment,
}: {
  rescheduleAppointment: AppointmentRecord;
}) {
  const { form } = useMultiStepFormContext<RescheduleStepFormFields>();
  const fetchProviderAppointments = useFetchProviderAppointments();
  const fetchProviderTimezone = useFetchProviderTimezone();

  if (fetchProviderAppointments.isLoading || fetchProviderTimezone.isLoading) {
    return <ContainerLoading />;
  }

  if (fetchProviderAppointments.error) {
    return (
      <GetErrorDislpay
        refetch={fetchProviderAppointments.refetch}
        error={fetchProviderAppointments.error}
      />
    );
  }
  if (fetchProviderTimezone.error) {
    return (
      <GetErrorDislpay
        refetch={fetchProviderTimezone.refetch}
        error={fetchProviderTimezone.error}
      />
    );
  }

  const appointmentsByDate = _.groupBy(fetchProviderAppointments.data.slots, (appt) => appt.date);

  return (
    <>
      <ProviderAppointmentSection rescheduleAppointment={rescheduleAppointment} />
      <SectionDivider />
      <Section title={<Trans>Time Slot</Trans>}>
        <RescheduleCalendar
          {...{
            form: form as any as UseFormReturn<RescheduleCalendarFormFields>,
            rescheduleAppointment,
            appointmentsByDate,
            providerTimezone: fetchProviderAppointments.data.timezone,
          }}
        />
      </Section>
    </>
  );
}
