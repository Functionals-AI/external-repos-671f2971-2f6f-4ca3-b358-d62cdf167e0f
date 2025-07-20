import useFetch, { UseFetchTypes } from 'hooks/useFetch';
import { AppointmentData } from './useGetAppointments';

type FetchOverbookableAppointmentSlots = {
  timezone?: string;
  patientId: number | string;
  paymentMethodId: number;
};

type FetchOverbookableAppointmentSlotsReturn = {
  slots: AppointmentData[];
  timezone: string;
};

type Types = UseFetchTypes<
  FetchOverbookableAppointmentSlots,
  FetchOverbookableAppointmentSlotsReturn
>;

export default function useFetchOverbookableAppointmentSlots(
  params: FetchOverbookableAppointmentSlots,
) {
  return useFetch<Types>({
    path: '/scheduling/overbooking/slots',
    queryKey: ['scheduling', 'overbooking', 'slots', JSON.stringify(params)],
    options: {
      params,
    },
  });
}
