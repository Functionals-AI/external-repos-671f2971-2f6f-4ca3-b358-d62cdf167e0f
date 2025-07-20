import useFetch, { UseFetchTypes } from 'hooks/useFetch';
import { PatientPaymentMethod } from '../types';

type SchedulingPaymentMethodsParams = {
  methodType?: 'plan' | 'employer';
};

type SchedulingPaymentMethodsReturn = {
  paymentMethods: PatientPaymentMethod[];
};

type Types = UseFetchTypes<SchedulingPaymentMethodsParams, SchedulingPaymentMethodsReturn>;

export default function useFetchSchedulingPaymentMethods(params: SchedulingPaymentMethodsParams) {
  return useFetch<Types>({
    path: `/scheduling/payment-methods`,
    options: {
      params,
    },
    queryKey: ['scheduling', 'payment-methods', params.methodType ?? ''],
  });
}
