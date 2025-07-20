import useGetQueryParam from '../../../hooks/useGetQueryParam';
import CompleteReferral from '../../../modules/referral/complete';

export default function CompleteReferralPage() {
  const codeResult = useGetQueryParam('code');
  if (codeResult.loading) return null;

  return <CompleteReferral code={codeResult.ok ? codeResult.value : undefined} />;
}
