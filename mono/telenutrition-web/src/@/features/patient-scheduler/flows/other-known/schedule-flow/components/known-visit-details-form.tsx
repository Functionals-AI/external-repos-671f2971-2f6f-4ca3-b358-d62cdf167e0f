import { UseFormReturn } from 'react-hook-form';

import SessionOptionsCard from '@/smart-components/session-options-card';
import type { PatientRecord, ProviderRecord } from '@mono/telenutrition/lib/types';
import AppointmentPicker from './appointment-picker';
import { ScheduleOtherKnownFormFields } from '../index';
import TimezonePicker from '../../../../components/TimezonePicker';
import { AppointmentRecord } from 'api/types';

interface Props {
  provider?: ProviderRecord;
  patient: PatientRecord;
  form: UseFormReturn<ScheduleOtherKnownFormFields>;
  timezone: string;
  hideOptions?: boolean;
  rescheduleAppointment?: AppointmentRecord;
}

export default function KnownVisitDetailsForm({
  provider,
  patient,
  form,
  hideOptions,
  timezone,
  rescheduleAppointment,
}: Props) {
  return (
    <>
      {!hideOptions && <SessionOptionsCard form={form} />}
      <TimezonePicker
        providerTimezone={provider?.timezone}
        patientTimezone={patient.timezone}
        form={form}
        id={'timezoneDisplay'}
      />
      <div>
        <AppointmentPicker
          form={form}
          providerId={provider?.providerId}
          patient={patient}
          timezone={timezone}
          rescheduleAppointment={rescheduleAppointment}
        />
      </div>
    </>
  );
}
