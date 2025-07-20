import { ScreeningQuestionnaire } from 'api/provider/useFetchProviderAppointmentDetail';
import {
  AppointmentRecord,
  PatientPaymentMethod,
  HistoricalEncounterData,
  CompleteAppEncounterData,
  ExtendedAppEncounterData,
} from 'api/types';
import useFetch, { UseFetchTypes } from 'hooks/useFetch';

type FetchAppointmentEncounterInfoParams = {
  appointmentId: number;
};

export type FetchAppointmentEncounterInfoResult = {
  appointmentDetails: {
    appointment: AppointmentRecord;
    paymentMethod?: PatientPaymentMethod;
    patientPaymentMethods: PatientPaymentMethod[];
    providerName: string;
    lastNutriquizCompletion?: Date;
    hasNutriquiz?: boolean;
  };
  questionnaires: ScreeningQuestionnaire[];
  encounterData: ExtendedAppEncounterData | HistoricalEncounterData | CompleteAppEncounterData;
};

export type FetchAppointmentEncounterInfoAppResult = Omit<
  FetchAppointmentEncounterInfoResult,
  'encounterData'
> & { encounterData: ExtendedAppEncounterData };

type Types = UseFetchTypes<
  FetchAppointmentEncounterInfoParams,
  FetchAppointmentEncounterInfoResult
>;

export default function useFetchAppointmentEncounterInfo(appointmentId: number) {
  return useFetch<Types>({
    path: '/appointment-encounter/info',
    options: {
      params: { appointmentId },
    },
    queryKey: ['appointment-encounter', 'info', appointmentId],
  });
}
