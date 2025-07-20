import { FormV2 } from '@/modules/form/form';
import FormComboBoxItem from '@/modules/form/form-combo-box';
import useMemberHelpers from '@/modules/member/useMemberHelpers';
import { useMultiStepFormContext } from '@/modules/multi-step-form';
import { Badge } from '@/ui-components/badge';
import DataDisplay from '@/ui-components/data-display';
import Section from '@/ui-components/section';
import type { PatientRecord } from '@mono/telenutrition/lib/types';
import { Trans, useTranslation } from 'react-i18next';

export interface ChangeProviderFormFields {
  reason: string;
  note?: string;
}

export default function FormStep({ patient }: { patient: PatientRecord }) {
  const { form } = useMultiStepFormContext<ChangeProviderFormFields>();
  const memberHelpers = useMemberHelpers();
  const { t } = useTranslation();

  return (
    <>
      <Section title={<Trans>Member</Trans>}>
        <DataDisplay
          label={<Trans>Member</Trans>}
          content={memberHelpers.getDisplayNameForPatient(patient).value}
          footer={
            <Badge leftIconName="clock" className="w-fit" variant="statusAmber">
              {t('Member is in {{timezone}}', { timezone: patient.timezone })}
            </Badge>
          }
        />
      </Section>
      <Section.Divider />
      <Section title={<Trans>Notes</Trans>}>
        <FormComboBoxItem
          label={<Trans>Reason</Trans>}
          disabled
          form={form}
          id="reason"
          options={[]}
        />
        <FormV2.FormTextArea label={<Trans>Note</Trans>} form={form} id="note" />
      </Section>
    </>
  );
}
