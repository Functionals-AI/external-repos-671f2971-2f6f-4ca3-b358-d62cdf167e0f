import Section, { SectionDivider } from '@/ui-components/section';
import DataDisplay from '@/ui-components/data-display';
import { CancelSessionModalFields } from '..';
import { useMultiStepFormContext } from '@/modules/multi-step-form';
import { AppointmentRecord } from 'api/types';
import { AsBasicDate, AsTime } from '@/modules/dates';
import TimeDifferenceBadge from '@/smart-components/time-difference-badge';
import { Trans } from 'react-i18next';
import useMemberHelpers from '@/modules/member/useMemberHelpers';
import CheckBox from '@/ui-components/radio-and-checkbox/checkbox';

export interface ConfirmCancelFields {
  acknowled?: boolean;
}

export default function ConfirmCancel({ appointment }: { appointment: AppointmentRecord }) {
  const { getValuesAssertDefined, form } = useMultiStepFormContext<CancelSessionModalFields>();
  const { reasonData } = getValuesAssertDefined(['reasonData']);
  const memberHelpers = useMemberHelpers();

  return (
    <>
      <Section title="Session Update">
        <div className="grid grid-cols-2 gap-2">
          <DataDisplay
            label="Member"
            content={memberHelpers.getDisplayNameFromAppointment({ appointment })}
            className="col-span-2"
          />
          <DataDisplay
            label="Date"
            content={<AsBasicDate format="full">{appointment.startTimestamp}</AsBasicDate>}
            className="col-span-1"
          />
          <DataDisplay
            label="Time"
            content={<AsTime>{appointment.startTimestamp}</AsTime>}
            className="col-span-1"
            footer={
              <TimeDifferenceBadge
                date={new Date(appointment.startTimestamp)}
                timezone={appointment.patient?.timezone ?? null}
                label={<Trans>Member time</Trans>}
              />
            }
          />
        </div>
      </Section>
      <SectionDivider />
      <Section title="Details">
        <div className="flex flex-col gap-y-2">
          <DataDisplay label="Reason" content={reasonData.label} />
          {reasonData.requireAcknowledgment && (
            <div className="flex gap-x-4">
              <CheckBox
                form={form}
                id="acknowled"
                label={reasonData.requireAcknowledgment.label}
                rules={{
                  validate: (v) => {
                    return v === true;
                  },
                }}
              />
            </div>
          )}
        </div>
      </Section>
    </>
  );
}
