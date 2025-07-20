import DataDisplay from '@/ui-components/data-display';
import Section from '@/ui-components/section';
import { AppointmentRecord } from 'api/types';
import { AsBasicDate, AsTime } from '@/modules/dates';
import TimeDifferenceBadge from '../time-difference-badge';
import { Trans, useTranslation } from 'react-i18next';
import useMemberHelpers from '@/modules/member/useMemberHelpers';

interface AppointmentInformationSectionProps {
  rescheduleAppointment: AppointmentRecord;
}

export default function ProviderAppointmentSection({
  rescheduleAppointment,
}: AppointmentInformationSectionProps) {
  const memberHelpers = useMemberHelpers();
  const { t } = useTranslation();
  const patientTimezone = rescheduleAppointment.patient?.timezone;

  return (
    <Section title={t('Original Session')} sectionClassName="grid grid-cols-2 gap-2">
      <DataDisplay
        className="col-span-2"
        label={t('Member')}
        content={memberHelpers.getDisplayNameFromAppointment({
          appointment: rescheduleAppointment,
        })}
      />
      <DataDisplay
        className="col-span-1"
        label={t('Date')}
        content={<AsBasicDate format="full">{rescheduleAppointment.startTimestamp}</AsBasicDate>}
      />
      <DataDisplay
        className="col-span-1"
        label={t('Time')}
        content={<AsTime>{rescheduleAppointment.startTimestamp}</AsTime>}
        footer={
          <TimeDifferenceBadge
            timezone={patientTimezone ?? null}
            date={new Date(rescheduleAppointment.startTimestamp)}
            variant="statusAmber"
            label={<Trans>Member time</Trans>}
          />
        }
      />
      <DataDisplay
        label={<Trans>Duration</Trans>}
        content={t('{{duration}} minutes', { duration: rescheduleAppointment.duration })}
      />
      <DataDisplay
        label={<Trans>Type</Trans>}
        content={rescheduleAppointment.isAudioOnly ? t('Audio only') : t('Video')}
      />
    </Section>
  );
}
