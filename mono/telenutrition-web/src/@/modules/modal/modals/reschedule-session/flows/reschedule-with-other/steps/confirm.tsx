import DataDisplay from '@/ui-components/data-display';
import Section, { SectionDivider } from '@/ui-components/section';
import ProviderAppointmentSection from '@/smart-components/provider-appointment/provider-appointment-section';
import { useMultiStepFormContext } from '@/modules/multi-step-form';
import { RescheduleWithOtherFormFields } from '..';
import { AppointmentRecord } from 'api/types';

type ConfirmProps = {
  rescheduleAppointment: AppointmentRecord;
};

export default function Confirm({ rescheduleAppointment }: ConfirmProps) {
  const { getValuesAssertDefined } = useMultiStepFormContext<RescheduleWithOtherFormFields>();
  const formState = getValuesAssertDefined(['providerId', 'swappableProvider']);

  const swappableProvider = formState.swappableProvider;

  return (
    <>
      <ProviderAppointmentSection rescheduleAppointment={rescheduleAppointment} />
      <SectionDivider />
      <Section title="Switch Providers">
        <div className="flex flex-col gap-y-2">
          {/* <DataDisplay label="Time Slot" content={formState.timeSlot} /> */}
          {formState.providerId && (
            <DataDisplay
              label="Provider"
              content={`${swappableProvider.provider?.firstName} ${swappableProvider.provider?.lastName}`}
            />
          )}
        </div>
      </Section>
    </>
  );
}
