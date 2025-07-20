import { useTranslation } from 'react-i18next';
import useGetUpcomingAppointments, {
  PatientAppointment,
} from '../../../api/useGetUpcomingAppointments';
import { AppointmentRecord } from 'api/types';
import Loading from '../../../components/loading';
import AppointmentCard, { AppointmentDetails } from './appointment-card';
import NoAppointments from './no-appointments';
import _ from 'lodash';
import ApiGetError from '../../../components/api-get-error';
import { useRouter } from 'next/router';
import { DateTime } from 'luxon';
import useMemberHelpers from '@/modules/member/useMemberHelpers';

// Get grouped list of patient appointments and return flat list of upcoming appointments
function flattenAppointments(patientAppointments: PatientAppointment[]): AppointmentRecord[] {
  return patientAppointments.reduce((acc, patientAppointment) => {
    return [...acc, ...patientAppointment.appointments];
  }, [] as AppointmentRecord[]);
}

export default function UpcomingAppointments() {
  const { t } = useTranslation();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const { data, isLoading, error, refetch } = useGetUpcomingAppointments({ timezone });
  const router = useRouter();
  const memberHelpers = useMemberHelpers();

  const onCancelAppointment = (appointmentId: number) => {
    router.push(`/schedule/appointments/${appointmentId}/cancel`);
  };

  return (
    <div>
      <div className="my-6 gap-6 flex flex-col overflow-y-scroll" style={{ maxHeight: '30rem' }}>
        {isLoading ? (
          <Loading />
        ) : error ? (
          <ApiGetError
            error={error}
            refetch={refetch}
            message={t('ErrorFetchingUpcomingAppointments', 'Error fetching upcoming appointments')}
          />
        ) : (
          (() => {
            const allAppointments =
              data && data.patientAppointments
                ? flattenAppointments(data?.patientAppointments)
                : [];

            if (!allAppointments.length || !data) return <NoAppointments />;
            return (
              <div className="flex flex-col gap-y-3">
                {allAppointments
                  .sort((a, b) =>
                    DateTime.fromJSDate(new Date(a.startTimestamp)) <
                    DateTime.fromJSDate(new Date(b.startTimestamp))
                      ? -1
                      : 1,
                  )
                  .map((appt) => {
                    const provider = data.providers.find(
                      (provider) => provider.providerId === appt.providerId,
                    );
                    const patient = _.omit(
                      data.patientAppointments.find(
                        (patientAppointment) => patientAppointment.patientId === appt.patientId,
                      ),
                      'appointments',
                    );

                    if (!provider) {
                      return (
                        <AppointmentCard
                          key={appt.appointmentId}
                          appointment={appt}
                          providerInitials="FS"
                          providerName="Foodsmart"
                          providerPhoto="/avocado.svg"
                          patient={patient}
                          onCancel={() => onCancelAppointment(appt.appointmentId)}
                          userTimezone={timezone}
                        />
                      );
                    }

                    return (
                      <AppointmentCard
                        key={appt.appointmentId}
                        appointment={appt}
                        providerInitials={provider.initials}
                        providerName={provider.name}
                        providerPhoto={provider.photo}
                        patient={patient}
                        onCancel={() => onCancelAppointment(appt.appointmentId)}
                        userTimezone={timezone}
                      />
                    );
                  })}
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}
