import DataDisplay from '@/ui-components/data-display';
import Section, { SectionDivider } from '@/ui-components/section';
import { useMultiStepFormContext } from '@/modules/multi-step-form';
import { RescheduleWithOtherFormFields } from '..';
import { AppointmentRecord } from 'api/types';
import { Trans, useTranslation } from 'react-i18next';
import useMemberHelpers from '@/modules/member/useMemberHelpers';
import { AsTime } from '@/modules/dates';
import TimeDifferenceBadge from '@/smart-components/time-difference-badge';
import { DateTime } from 'luxon';

type ConfirmProps = {
  rescheduleAppointment: AppointmentRecord;
};

export default function Confirm({ rescheduleAppointment }: ConfirmProps) {
  const memberHelpers = useMemberHelpers();
  const { t } = useTranslation();
  const { getValuesAssertDefined } = useMultiStepFormContext<RescheduleWithOtherFormFields>();
  const formState = getValuesAssertDefined([]);

  return (
    <>
      <Section title={<Trans>Overview</Trans>} sectionClassName="grid grid-cols-2">
        <DataDisplay
          dataTestId="member"
          className="col-span-2"
          label={<Trans>Member</Trans>}
          content={memberHelpers.getDisplayNameFromAppointment({
            appointment: rescheduleAppointment,
          })}
        />
        <DataDisplay
          dataTestId="appointment-type"
          label={<Trans>Type</Trans>}
          content={rescheduleAppointment.isAudioOnly ? t('Audio only') : t('Video')}
        />
        <DataDisplay
          dataTestId="duration"
          label={<Trans>Duration</Trans>}
          content={rescheduleAppointment.duration === 30 ? '30 minutes' : '60 minutes'}
        />
        <DataDisplay
          dataTestId="reschedule-with"
          label={<Trans>Reschedule with</Trans>}
          content={
            // formState.rescheduleType === RescheduleType.AnyDietitian
            // ? t('Any dietitian')
            t('Specified dietitian')
          }
        />
      </Section>
      {/* {formState.rescheduleType === RescheduleType.SpecificDietitian && ( */}
      <>
        <SectionDivider />
        <Section title="Updated session" sectionClassName="grid grid-cols-2">
          <DataDisplay
            label="Dietitian"
            content={formState.provider?.name}
            className="col-span-2"
          />
          <DataDisplay label="Date" content={formState.date?.toFormat('LLL dd, yyyy')} />
          {formState.timeISO && (
            <DataDisplay
              label="Time"
              content={<AsTime>{formState.timeISO}</AsTime>}
              footer={
                <TimeDifferenceBadge
                  timezone={rescheduleAppointment.patient?.timezone ?? null}
                  date={DateTime.fromISO(formState.timeISO)}
                  variant="statusAmber"
                  label={<Trans>Member time</Trans>}
                />
              }
            />
          )}
        </Section>
      </>
      {/* )} */}
    </>
  );
}
