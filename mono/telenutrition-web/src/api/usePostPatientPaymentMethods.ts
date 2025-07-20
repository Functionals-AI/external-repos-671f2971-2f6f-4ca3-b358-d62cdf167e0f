import usePost from './usePost';

export interface UsePostPatientPaymentMethodsParams {
  payload: {
    payment: Record<string, any>;
    birthday?: Date;
  };
}

interface UsePostPatientPaymentMethodsResult {
  paymentMethodId: number;
}

export default function usePostPatientPaymentMethods(params: { patientId: number }) {
  return usePost<UsePostPatientPaymentMethodsParams, UsePostPatientPaymentMethodsResult>({
    path: `/scheduling/patients/${params.patientId}/payment-methods`,
    method: 'post',
  });
}
