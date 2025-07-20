import { UseGetAppointmentByIdReturn } from 'api/useGetAppointmentById';
import PatientSessionMemberPaymentInfo from './member-payment-info';
import SessionMemberInfo from './member-info';
import { AppointmentDetail } from 'api/provider/useFetchProviderAppointmentDetail';

interface SessionDisplayProps {
  appointmentById: UseGetAppointmentByIdReturn;
  appointmentDetail: AppointmentDetail;
}

export default function SessionDisplay({
  appointmentById,
  appointmentDetail,
}: SessionDisplayProps) {
  return (
    <div className="flex gap-x-6">
      <PatientSessionMemberPaymentInfo appointmentById={appointmentById} />
      <SessionMemberInfo appointmentById={appointmentById} appointmentDetail={appointmentDetail} />
    </div>
  );
}
