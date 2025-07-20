import Section from '@/ui-components/section';
import DataDisplay from '@/ui-components/data-display';
import { useMultiStepFormContext } from '@/modules/multi-step-form';
import { ScheduleInfoFields } from './schedule-info';
import { DateTime } from 'luxon';
import { useFetchProviderTimezone } from 'api/provider/useGetProviderTimezone';
import TimeDifferenceBadge from '@/smart-components/time-difference-badge';
import { Trans } from 'react-i18next';
import GetErrorDislpay from '@/modules/errors/get-error-display';
import ContainerLoading from '@/ui-components/loading/container-loading';
import useMemberHelpers from '@/modules/member/useMemberHelpers';
import { SessionType } from 'types/globals';

interface ReviewProps {
  timeDisplay: string;
  dateTime: DateTime;
}

export default function Review({ timeDisplay, dateTime }: ReviewProps) {
  const { getValuesAssertDefined } = useMultiStepFormContext<ScheduleInfoFields>();
  const { data, isLoading, error, refetch } = useFetchProviderTimezone();
  const memberHelpers = useMemberHelpers();

  if (isLoading) return <ContainerLoading />;
  if (error) return <GetErrorDislpay refetch={refetch} error={error} />;

  const { duration, patient, sessionType } = getValuesAssertDefined([
    'duration',
    'patient',
    'sessionType',
  ]);

  return (
    <Section title="Details">
      <div className="grid grid-cols-2 gap-4">
        <DataDisplay
          label="Member"
          content={memberHelpers.getDisplayNameForPatient(patient).value}
          className="col-span-1"
        />
        <DataDisplay
          label="Date"
          content={dateTime.toFormat('LLLL dd, yyyy')}
          className="col-span-1 col-start-1"
        />
        <DataDisplay
          label="Time"
          content={timeDisplay}
          className="col-span-1 col-start-1"
          footer={
            <TimeDifferenceBadge
              timezone={patient.timezone}
              date={dateTime}
              label={<Trans>Member time</Trans>}
            />
          }
        />
        <DataDisplay
          label="Duration"
          content={`${duration} minutes ${
            sessionType === SessionType.AudioOnly ? '(Audio only)' : ''
          }`}
          className="col-span-1 col-start-1"
        />
      </div>
    </Section>
  );
}
