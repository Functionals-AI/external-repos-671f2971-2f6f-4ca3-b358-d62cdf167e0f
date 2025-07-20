import Section, { SectionDivider } from '@/ui-components/section';
import DataDisplay from '@/ui-components/data-display';
import { useMultiStepFormContext } from '@/modules/multi-step-form';
import { AppointmentRecord } from 'api/types';
import { AsBasicDate, AsTime } from '@/modules/dates';
import { Trans, useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import TimeDifferenceBadge from '@/smart-components/time-difference-badge';
import { AppointmentCancelReason } from 'api/usePutCancelAppointment';
import useMemberHelpers from '@/modules/member/useMemberHelpers';
import { ReasonData, useCancelReasons } from '../helpers';
import FormComboBoxItem from '@/modules/form/form-combo-box';

export interface ChooseReasonFields {
  reason: AppointmentCancelReason;
  reasonData: ReasonData;
}

export default function ChooseReason({ appointment }: { appointment: AppointmentRecord }) {
  const { form } = useMultiStepFormContext<ChooseReasonFields>();
  const reasons = useCancelReasons({ appointment });
  const { t } = useTranslation();
  const memberHelpers = useMemberHelpers();

  const [reasonWatch, reasonDataWatch] = form.watch(['reason', 'reasonData']);

  useEffect(() => {
    if (reasonWatch) {
      form.setValue(
        'reasonData',
        Object.values(reasons).find((reason) => reason.value === reasonWatch)!,
      );
    }
  }, [reasonWatch]);

  return (
    <>
      <Section title={t('Original Session')}>
        <div className="grid grid-cols-2 gap-2">
          <DataDisplay
            label={<Trans>Member</Trans>}
            content={memberHelpers.getDisplayNameFromAppointment({ appointment })}
            className="col-span-2"
          />
          <DataDisplay
            label={<Trans>Date</Trans>}
            content={<AsBasicDate format="full">{appointment.startTimestamp}</AsBasicDate>}
            className="col-span-1"
          />
          <DataDisplay
            label={<Trans>Time</Trans>}
            content={<AsTime>{appointment.startTimestamp}</AsTime>}
            className="col-span-1"
            footer={
              <TimeDifferenceBadge
                timezone={appointment.patient?.timezone ?? null}
                date={new Date(appointment.startTimestamp)}
                label={<Trans>Member time</Trans>}
              />
            }
          />
        </div>
      </Section>
      <SectionDivider />
      <Section title={t('Cancellation')}>
        <FormComboBoxItem
          id="reason"
          form={form}
          rules={{ required: true }}
          label={t('Reason')}
          options={reasons.map((reason) => ({
            type: 'basic',
            value: reason.value,
            label: reason.label,
            disabled: reason.disabled,
          }))}
        />
        {reasonDataWatch?.disclaimer && (
          <p className="font-semibold text-sm">{reasonDataWatch.disclaimer}</p>
        )}
      </Section>
    </>
  );
}
