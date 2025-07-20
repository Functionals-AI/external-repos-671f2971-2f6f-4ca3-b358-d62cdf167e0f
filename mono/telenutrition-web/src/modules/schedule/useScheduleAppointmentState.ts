import { useEffect, useState } from 'react';
import useGetAppointments, {
  AppointmentData,
  GroupedAppointmentsByProvider,
  UseGetAppointmentParams,
  UseGetAppointmentsReturn,
  ValidDurationsType,
} from '../../api/useGetAppointments';
import _ from 'lodash';
import { DateTime } from 'luxon';
import { DeveloperError } from '../../utils/errors';
import { ApiGetError } from '../../api/useGet';
import { findAppointment } from './helpers';
import type { ProviderRecordShort } from '@mono/telenutrition/lib/types';

export interface UseScheduleAppointmentStateProps {
  appointmentQueryData: UseGetAppointmentParams;
  onComplete: (data: { appointment: AppointmentData; provider: ProviderRecordShort }) => void;
  onBack?: () => void;
  onNoAppointments: () => void;
  onNoAppointmentsButtonText: string;
}

export type UseScheduleAppointmentStateReturnData = {
  isLoading: false;
  error: null;
  selectedDate: string | null;
  onCalendarChange: (date: Date) => void;
  today: DateTime;
  filteredAppointments: GroupedAppointmentsByProvider[] | null;
  onSelectAppointment: (date: string, appointmentIds: number[]) => void;
  timezoneDisplay: string;
  refetch: () => void;
  slots: UseGetAppointmentsReturn['slots'];
  providers: UseGetAppointmentsReturn['providers'];
  validDurationsType: ValidDurationsType;
};

type UseScheduleAppointmentStateReturn =
  | {
      isLoading: true;
    }
  | {
      isLoading: false;
      error: ApiGetError;
      refetch: () => void;
    }
  | UseScheduleAppointmentStateReturnData;

export default function useScheduleAppointmentState({
  onComplete,
  appointmentQueryData,
}: UseScheduleAppointmentStateProps): UseScheduleAppointmentStateReturn {
  const { data, isLoading, error, refetch } = useGetAppointments(appointmentQueryData);
  const today = DateTime.now();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filteredAppointments, setFilteredAppointments] = useState<
    GroupedAppointmentsByProvider[] | null
  >(null);

  useEffect(() => {
    if (isLoading || !data || !Object.keys(data.slots).length) return;
    if (Object.keys(data.slots).length === 0) {
      setSelectedDate(today.locale);
    } else {
      const sorted = Object.keys(data.slots).sort((a, b) =>
        DateTime.fromFormat(a, 'MM/dd/yyyy') > DateTime.fromFormat(b, 'MM/dd/yyyy') ? 1 : -1,
      );

      const firstAvailableDate = sorted[0];

      setSelectedDate(firstAvailableDate);
    }
  }, [isLoading, data]);

  useEffect(() => {
    if (data && selectedDate) {
      const appts = data?.slots[selectedDate];
      setFilteredAppointments(appts);
    }
  }, [selectedDate]);

  const onSelectAppointment = (date: string, appointmentIds: number[]) => {
    if (!data) throw new DeveloperError('api not loaded with appointment data');

    const foundAppointment = findAppointment({ slots: data.slots, date, appointmentIds });
    if (!foundAppointment) throw new DeveloperError('could not find appointment for id');
    const provider = data.providers.find(
      (provider) => provider.providerId === foundAppointment.providerId,
    );

    if (!provider) throw new DeveloperError('could not find provider for appt');

    onComplete({
      appointment: foundAppointment,
      provider,
    });
  };

  const onCalendarChange = (date: Date) => {
    const newDate = DateTime.fromJSDate(date).toFormat('MM/dd/yyyy');
    setSelectedDate(newDate);
    const appts = data?.slots[newDate] ?? null;
    setFilteredAppointments(appts);
  };

  if (error) return { isLoading: false, error, refetch };
  if (isLoading || !data) return { isLoading: true };

  const timezoneDisplay = data.timezone;
  const validDurationsType = data.validDurationsType;

  return {
    selectedDate,
    onCalendarChange,
    today,
    filteredAppointments,
    onSelectAppointment,
    isLoading,
    timezoneDisplay,
    error,
    refetch,
    slots: data.slots,
    providers: data.providers,
    validDurationsType,
  };
}
