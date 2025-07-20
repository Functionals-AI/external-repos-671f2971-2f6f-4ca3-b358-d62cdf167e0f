import useFetch, { UseFetchTypes } from 'hooks/useFetch';
import useGet from '../useGet';
import { HouseholdMemberWithSchedulingInfo } from '../types';

export type UseGetProviderPatientResult = { patient: HouseholdMemberWithSchedulingInfo };

type UseGetProviderPatientParams = {
  patientId: string | number;
  appointmentIds?: string;
};

export default function useGetProviderPatient({ doInitialGet }: { doInitialGet: boolean }) {
  return useGet<UseGetProviderPatientResult, UseGetProviderPatientParams>({
    path: '/provider/patient',
    doInitialGet,
  });
}

export function useFetchProviderPatientById(params: UseGetProviderPatientParams) {
  return useFetch<UseFetchTypes<UseGetProviderPatientParams, UseGetProviderPatientResult>>({
    path: '/provider/patient',
    queryKey: [
      'provider',
      'patients',
      params.patientId,
      ...(params.appointmentIds ? params.appointmentIds.split(',') : ['']),
    ],
    options: {
      params,
    },
  });
}
