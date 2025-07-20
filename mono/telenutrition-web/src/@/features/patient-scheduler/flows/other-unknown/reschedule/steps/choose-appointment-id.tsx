import { Trans, useTranslation } from 'react-i18next';
import { DateTime } from 'luxon';

import useMemberHelpers from '@/modules/member/useMemberHelpers';
import { useMultiStepFormContext } from '@/modules/multi-step-form';
import DataDisplay from '@/ui-components/data-display';
import Section from '@/ui-components/section';
import { AppointmentRecord } from 'api/types';
import type { PatientRecord } from '@mono/telenutrition/lib/types';
import { AsTime } from '@/modules/dates';
import { RescheduleWithOtherUnknownProviderFormFields } from '..';
import AppointmentSlotSearch from '../../appointment-slot-search';

export default function ChooseAppointmentIdStep({
  patient,
  rescheduleAppointment,
}: {
  patient: PatientRecord;
  rescheduleAppointment: AppointmentRecord;
}) {
  const memberHelpers = useMemberHelpers();
  const { t } = useTranslation();
  const { form } = useMultiStepFormContext<RescheduleWithOtherUnknownProviderFormFields>();

  return (
    <div>
      <Section title={<Trans>Member</Trans>}>
        <DataDisplay
          label={<Trans>Member</Trans>}
          content={memberHelpers.getDisplayNameForPatient(patient).value}
          footer={<p className="text-sm text-neutral-600">{patient.patientId}</p>}
        />
        <DataDisplay
          label={<Trans>Original visit</Trans>}
          content={DateTime.fromISO(rescheduleAppointment.startTimestamp).toFormat('LLL d, yyyy')}
          footer={
            <p className="text-sm text-neutral-600">
              <AsTime>{rescheduleAppointment.startTimestamp}</AsTime>
            </p>
          }
        />
      </Section>
      <Section.Divider />
      <Section
        title={<Trans>Visit details</Trans>}
        subtitle={t('Members cannot schedule more than one appointment per week.')}
      >
        <AppointmentSlotSearch
          patient={patient}
          form={form}
          type="reschedule"
          rescheduleAppointmentId={rescheduleAppointment.appointmentId}
        />
      </Section>
    </div>
  );
}
