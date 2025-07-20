import useMemberHelpers from '@/modules/member/useMemberHelpers';
import DataDisplay from '@/ui-components/data-display';
import Section from '@/ui-components/section';
import type { PatientRecord } from '@mono/telenutrition/lib/types';
import { Trans, useTranslation } from 'react-i18next';
import SessionOptionsCard from '@/smart-components/session-options-card';
import { useMultiStepFormContext } from '@/modules/multi-step-form';
import { ScheduleWithOtherUnknownProviderFormFields } from '..';
import React from 'react';
import AppointmentSlotSearch from '../../appointment-slot-search';

export default function ChooseAppointmentIdStep({ patient }: { patient: PatientRecord }) {
  const { form } = useMultiStepFormContext<ScheduleWithOtherUnknownProviderFormFields>();
  const { t } = useTranslation();
  const memberHelpers = useMemberHelpers();

  return (
    <div>
      <Section title={<Trans>Member</Trans>}>
        <DataDisplay
          label={<Trans>Member</Trans>}
          content={memberHelpers.getDisplayNameForPatient(patient).value}
          footer={<p className="text-sm text-neutral-600">{patient.patientId}</p>}
        />
      </Section>
      <Section.Divider />
      <Section
        title={<Trans>Visit details</Trans>}
        subtitle={t('Members cannot schedule more than one appointment per week.')}
      >
        <SessionOptionsCard form={form} />
        <AppointmentSlotSearch
          form={form}
          type="schedule"
          patientId={patient.patientId}
          patient={patient}
        />
      </Section>
    </div>
  );
}
