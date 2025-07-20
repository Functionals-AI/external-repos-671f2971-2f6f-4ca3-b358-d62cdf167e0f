import Container from '@/ui-components/container';
import { useRouter } from 'next/router';
import Button from '../../../components/button';
import CalendarIcon from '../../../components/calendar-icon';
import { UseGetAppointmentByIdReturn } from '../../../api/useGetAppointmentById';
import { DateTime } from 'luxon';

export default function AppointmentTimePassed({
  data,
  type,
}: {
  data: UseGetAppointmentByIdReturn;
  type: 'provider' | 'patient';
}) {
  const { appointment } = data;
  const router = useRouter();
  const toDashboard = () => {
    if (type === 'provider') router.push('/schedule/providers');
    else router.push('/schedule/dashboard');
  };

  const startAtDateTime = DateTime.fromISO(appointment.startTimestamp);
  const startAt = startAtDateTime.toJSDate();
  const month = startAt.toLocaleString('default', { month: 'long' });
  const day = startAt.getDate().toString();
  const dayOfWeek = startAt.toLocaleDateString('default', { weekday: 'long' });

  return (
    <Container>
      <h3>The appointment time has already passed.</h3>
      <div className="flex justify-center gap-x-6 w-full border-b-2 border-f-dark-green border-solid">
        <CalendarIcon {...{ month, day, dayOfWeek }} />
        <div className="flex flex-col items-center justify-center">
          <p className="text-lg">
            <span className="">{startAtDateTime.toFormat('h:mm a ZZZZ')}</span>
            {` | ${data.providerName}`}
          </p>
          <p className="text-lg">
            {startAtDateTime.toFormat('LL/dd/yyyy')} ({appointment.duration} mins)
          </p>
        </div>
      </div>
      <p>You can no longer edit this appointment.</p>
      <Button onClick={toDashboard}>To Dashboard</Button>
    </Container>
  );
}
