import { useMultiStepFormContext } from '@/modules/multi-step-form';
import DataDisplay from '@/ui-components/data-display';
import Section from '@/ui-components/section';
import type { PatientRecord } from '@mono/telenutrition/lib/types';
import { ScheduleWithOtherUnknownProviderFormFields } from '..';
import useMemberHelpers from '@/modules/member/useMemberHelpers';
import { Trans } from 'react-i18next';
import { AsBasicDate, AsTime } from '@/modules/dates';

export default function Confirm({ patient }: { patient: PatientRecord }) {
  const { getValuesAssertDefined } =
    useMultiStepFormContext<ScheduleWithOtherUnknownProviderFormFields>();
  const { selectedAppointmentData, selectedProvider } = getValuesAssertDefined([
    'selectedAppointmentData',
    'selectedProvider',
  ]);
  const memberHelpers = useMemberHelpers();
  return (
    <div>
      <Section title="Member">
        <DataDisplay
          label={<Trans>Member</Trans>}
          content={memberHelpers.getDisplayNameForPatient(patient).value}
        />
      </Section>
      <Section.Divider />
      <Section title={<Trans>Visit details</Trans>}>
        <DataDisplay label={<Trans>Dietitian</Trans>} content={selectedProvider.name} />
        <DataDisplay
          dataTestId={'confirm-time'}
          label={<Trans>Visit</Trans>}
          content={
            <AsBasicDate format="full">{selectedAppointmentData.startTimestamp}</AsBasicDate>
          }
          footer={<AsTime>{selectedAppointmentData.startTimestamp}</AsTime>}
        />
      </Section>
    </div>
  );
}
