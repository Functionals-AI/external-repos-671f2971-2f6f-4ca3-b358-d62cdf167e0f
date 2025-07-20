import { useMultiStepFormContext } from '@/modules/multi-step-form';
import DataDisplay from '@/ui-components/data-display';
import { ChangeProviderFormFields } from './form';
import useMemberHelpers from '@/modules/member/useMemberHelpers';
import { Trans, useTranslation } from 'react-i18next';
import Section from '@/ui-components/section';
import { Badge } from '@/ui-components/badge';
import type { PatientRecord } from '@mono/telenutrition/lib/types';

export default function ConfirmStep({ patient }: { patient: PatientRecord }) {
  const { getValuesAssertDefined } = useMultiStepFormContext<ChangeProviderFormFields>();
  const formState = getValuesAssertDefined([]);
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
        {formState.reason && (
          <DataDisplay label={<Trans>Reason</Trans>} content={formState.reason} />
        )}
        {formState.note && <DataDisplay label={<Trans>Note</Trans>} content={formState.note} />}
      </Section>
    </>
  );
}
