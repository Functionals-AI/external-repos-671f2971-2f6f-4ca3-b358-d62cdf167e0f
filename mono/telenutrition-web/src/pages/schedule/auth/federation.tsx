import { useRouter } from 'next/router';
import Loading from '../../../components/loading';
import useGetQueryParam from '../../../hooks/useGetQueryParam';
import useGetRedirectOnSuccessURL from '../../../hooks/useGetRedirectOnSuccessURL';
import AuthFederation from '../../../modules/auth/federation';

export default function AuthFederationPage() {
  const tokenResult = useGetQueryParam('token');
  const redirectOnSuccess = useGetRedirectOnSuccessURL({ fallback: '/schedule/dashboard' });
  const router = useRouter();

  if (tokenResult.loading) {
    return <Loading />;
  }

  if (!tokenResult.ok) {
    router.push('/schedule/auth/login');
    return <Loading />;
  }

  return (
    <AuthFederation
      token={tokenResult.value}
      redirectOnSuccess={redirectOnSuccess}
      redirectOnError="/schedule/auth/login"
    />
  );
}
