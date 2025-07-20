import { DeveloperError } from 'utils/errors';
import { useSessionContext } from '../../../useSessionContext';
import HistoryDetail from './history-detail';
import Link from 'next/link';
import { Trans } from 'react-i18next';
import { PatientProfileViewTabs } from '@/features/provider/patient/profile/view';
import { ProviderPatientAppointment } from 'api/provider/useFetchProviderPatientAppointments';

interface PatientSessionHistoryProps {
  entries: ProviderPatientAppointment[];
}

export default function PatientSessionHistory({ entries }: PatientSessionHistoryProps) {
  const {
    data: { appointmentDetails },
  } = useSessionContext();
  const { patient } = appointmentDetails.appointment;

  if (!patient) {
    throw new DeveloperError('There should be a patient on an appointment with a valid session');
  }

  const visiblePastSessions = entries.slice(0, 3);

  return (
    <div className="flex flex-col gap-y-2">
      {visiblePastSessions.map((session) => (
        <HistoryDetail key={session.appointment.appointmentId} session={session} />
      ))}
      <Link
        target="_blank"
        href={`/schedule/provider/patient/${patient.patientId}/profile/view?tab=${PatientProfileViewTabs.VISIT_HISTORY}`}
      >
        <Trans>See more</Trans>
      </Link>
    </div>
  );
}
