import { useMultiStepFormContext } from '@/modules/multi-step-form';
import DataDisplay from '@/ui-components/data-display';
import Section from '@/ui-components/section';
import { AppointmentRecord } from 'api/types';
import type { PatientRecord } from '@mono/telenutrition/lib/types';
import useMemberHelpers from '@/modules/member/useMemberHelpers';
import { Trans } from 'react-i18next';
import { AsBasicDate, AsTime } from '@/modules/dates';
import CheckBox from '@/ui-components/radio-and-checkbox/checkbox';
import { useCancelReasons } from '@/modules/modal/modals/cancel-session/helpers';
import FormComboBoxItem from '@/modules/form/form-combo-box';
import Card from '@/ui-components/card';
import Icon from '@/ui-components/icons/Icon';
import { RescheduleWithOtherUnknownProviderFormFields } from '../other-unknown/reschedule';

export default function ConfirmRescheduledAppointments({
  patient,
  rescheduleAppointment,
}: {
  patient: PatientRecord;
  rescheduleAppointment: AppointmentRecord;
}) {
  const reasons = useCancelReasons({ appointment: rescheduleAppointment });
  const { getValuesAssertDefined, form } =
    useMultiStepFormContext<RescheduleWithOtherUnknownProviderFormFields>();
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
        <p className="text-sm text-neutral-600">Visit</p>
        <div className="flex flex-row items-center gap-x-2">
          <Card className="p-2 [&>p]:line-through [&>p]:text-neutral-600" dataTestId="confirm-before">
            <p>Myself</p>
            <p>
              <AsBasicDate format="full">{rescheduleAppointment.startTimestamp}</AsBasicDate>
            </p>
            <p>
              <AsTime withTimezone={false}>{rescheduleAppointment.startTimestamp}</AsTime>
            </p>
          </Card>
          <Icon name="arrow-right" color="neutral-150" size="sm" />
          <Card className="p-2 bg-status-green-100" dataTestId="confirm-after">
            <p>{selectedProvider.name}</p>
            <p>
              <AsBasicDate format="full">{selectedAppointmentData.startTimestamp}</AsBasicDate>
            </p>
            <p>
              <AsTime withTimezone={false}>{selectedAppointmentData.startTimestamp}</AsTime>
            </p>
          </Card>
        </div>
      </Section>
      <Section.Divider />
      <Section title={<Trans>Notes</Trans>}>
        <FormComboBoxItem
          form={form}
          id="cancelReason"
          options={reasons}
          label={<Trans>Reason</Trans>}
          rules={{ required: true }}
        />
        <CheckBox
          form={form}
          rules={{ required: true }}
          id="confirmMemberInformed"
          label={<Trans>Member has been informed of this visit change</Trans>}
          description={
            <Trans>
              I have confirmed with the member this session change is happening and they understand
              the changes.
            </Trans>
          }
        />
      </Section>
    </div>
  );
}
