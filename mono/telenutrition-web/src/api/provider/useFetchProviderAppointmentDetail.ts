import type { GroupWidget } from '@mono/telenutrition/lib/types';
import useFetch, { UseFetchTypes } from 'hooks/useFetch';

type FetchProviderAppointmentDetailParams = {
  experimental?: boolean;
};

export type ScreeningDetermination = {
  title: string;
  sections: {
    title: string;
    text: string;
  }[];
};

export type TakeableScreeningQuestionnaire = {
  status: 'takeable';
  questionnaireType: string;
  title: string;
  caption: string;
  widgets: GroupWidget[];
  defaults?: object;
  lastTakenAt?: string;
};
export type DeterminedScreeningQuestionnaire = {
  status: 'determined';
  questionnaireType: string;
  title: string;
  determination: ScreeningDetermination;
  lastTakenAt?: string;
};
export type ScreeningQuestionnaire =
  | TakeableScreeningQuestionnaire
  | DeterminedScreeningQuestionnaire;

export type AppointmentDetail = {
  appointmentId: number;
  questionnaires: ScreeningQuestionnaire[];
};

export const getFetchProviderAppointmentQueryKey = (appointmentId: number | string) => [
  'provider',
  'appointments',
  appointmentId,
];

export type Types = UseFetchTypes<FetchProviderAppointmentDetailParams, AppointmentDetail>;

export default function useFetchProviderAppointmentDetail(
  appointmentId: number,
  params: FetchProviderAppointmentDetailParams,
) {
  return useFetch<Types>({
    path: `/provider/appointments/${appointmentId}`,
    queryKey: getFetchProviderAppointmentQueryKey(appointmentId),
    options: {
      params,
    },
  });
}
