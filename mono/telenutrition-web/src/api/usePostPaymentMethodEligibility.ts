import usePost from './usePost';

export interface UsePostPaymentMethodEligibilityParams {
  payload: {
    paymentMethodId: number
  }
}

interface UsePostPaymentMethodEligibilityResult {
  isValid: boolean
}

export default function usePostPaymentMethodEligibility() {
  return usePost<UsePostPaymentMethodEligibilityParams, UsePostPaymentMethodEligibilityResult>({
    path: `/scheduling/payment-eligibility`,
    method: 'post'
  });
}
