import DataDisplay from '@/ui-components/data-display';
import Section from '@/ui-components/section';
import { useMultiStepFormContext } from '@/modules/multi-step-form';
import { RescheduleWithSelfFormFields } from '..';
import { AppointmentRecord } from 'api/types';
import { DateTime } from 'luxon';
import { AsBasicDate, AsTime } from '@/modules/dates';
import { Trans } from 'react-i18next';
import useMemberHelpers from '@/modules/member/useMemberHelpers';

type ConfirmProps = {
  rescheduleAppointment: AppointmentRecord;
};

export default function Confirm({ rescheduleAppointment }: ConfirmProps) {
  const { getValuesAssertDefined } = useMultiStepFormContext<RescheduleWithSelfFormFields>();
  const formState = getValuesAssertDefined(['date', 'timeISO']);
  const memberHelpers = useMemberHelpers();

  const patient = rescheduleAppointment.patient!;

  return (
    <>
      <Section title={<Trans>Session update</Trans>} sectionClassName="grid grid-cols-2">
        <DataDisplay
          className="col-span-2"
          label={<Trans>Member</Trans>}
          content={memberHelpers.getDisplayNameForPatient(patient).value}
        />
        <DataDisplay
          label={<Trans>Date</Trans>}
          content={
            <p className="line-through text-neutral-400">
              <AsBasicDate format="full">{rescheduleAppointment.startTimestamp}</AsBasicDate>
            </p>
          }
          footer={<AsBasicDate format="full">{formState.date}</AsBasicDate>}
        />
        <DataDisplay
          label={<Trans>Time</Trans>}
          content={<AsTime>{DateTime.fromISO(formState.timeISO)}</AsTime>}
        />
      </Section>
    </>
  );
}
