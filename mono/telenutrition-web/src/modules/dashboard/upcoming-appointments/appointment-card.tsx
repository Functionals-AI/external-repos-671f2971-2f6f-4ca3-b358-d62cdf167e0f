import { AppointmentRecord } from 'api/types';
import type { PatientRecord } from '@mono/telenutrition/lib/types';
import { Button } from '@/ui-components/button';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import ProviderImage from '../../../components/provider-image';
import { Badge } from '@/ui-components/badge';
import { DateTime } from 'luxon';
import useMemberHelpers from '@/modules/member/useMemberHelpers';
import Card from '@/ui-components/card';

type AppointmentCardProps = {
  appointment: AppointmentRecord;
  providerName: string;
  providerPhoto?: string;
  providerInitials: string;
  patient: Pick<PatientRecord, 'firstName' | 'lastName' | 'timezone'>;
  onCancel: () => void;
  userTimezone: string;
};

export default function AppointmentCard({
  appointment,
  providerName,
  providerInitials,
  providerPhoto,
  patient,
  onCancel,
  userTimezone,
}: AppointmentCardProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <Card.Body className="flex items-center">
        <div
          className="border-r-2 border-f-light-green flex p-2 items-center gap-x-10 flex-1 flex-col"
          style={{ flex: 1 }}
        >
          <ProviderImage
            provider={{
              name: providerName,
              initials: providerInitials,
              photo: providerPhoto,
            }}
          />
          <p className="font-semibold text-base text-center">{providerName}</p>
        </div>
        <AppointmentDetails
          appointment={appointment}
          patient={patient}
          userTimezone={userTimezone}
        />
        <Button className="mr-8" size="lg" variant="secondary" onClick={onCancel}>
          {t('Cancel', 'Cancel')}
        </Button>
      </Card.Body>
    </Card>
  );
}

export function AppointmentDetails({
  appointment,
  patient,
  userTimezone,
}: {
  appointment: AppointmentRecord;
  userTimezone: string;
  patient: Pick<PatientRecord, 'firstName' | 'lastName' | 'timezone'>;
}) {
  const { startDate, duration, startTime, startTimestamp } = appointment;
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 720px)');
  const memberHelpers = useMemberHelpers();
  return (
    <div className="flex flex-col justify-center ml-6" style={{ flex: isMobile ? 2 : 3 }}>
      <p className="font-semibold text-lg">
        {t('Patient: {{patientName}}', {
          patientName: memberHelpers.getDisplayNameForPatient(patient).value,
        })}
      </p>
      <p>{startDate}</p>
      <p>{`${startTime} | ${t('DurationMinutes', '{{duration}} minutes', {
        duration: duration,
      })}`}</p>
      {userTimezone && patient.timezone && userTimezone !== patient.timezone && (
        <div>
          <Badge variant="statusAmber" className="h-6">
            {`${DateTime.fromISO(startTimestamp)
              .setZone(patient.timezone)
              .toFormat('h:mma ZZZZ')} ${t('Patient Time')}`}
          </Badge>
        </div>
      )}
    </div>
  );
}
