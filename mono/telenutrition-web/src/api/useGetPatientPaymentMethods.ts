import { PatientPaymentMethod } from './types';
import useGet from './useGet';

interface UseGetPatientPaymentMethodsParams {
  patientId: number;
}

export interface UseGetPatientPaymentMethodsReturn {
  paymentMethods: PatientPaymentMethod[];
}

export default function useGetPatientPaymentMethods(params: UseGetPatientPaymentMethodsParams) {
  return useGet<UseGetPatientPaymentMethodsReturn>({
    path: `/scheduling/patients/${params.patientId}/payment-methods`,
  });
}
