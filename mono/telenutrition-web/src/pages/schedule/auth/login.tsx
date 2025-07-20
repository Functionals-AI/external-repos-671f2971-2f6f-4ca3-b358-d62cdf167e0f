import Login from '../../../modules/auth/login';
import useGetRedirectOnSuccessURL from '../../../hooks/useGetRedirectOnSuccessURL';
import useGetQueryParam from 'hooks/useGetQueryParam';
import Loading from 'components/loading';

export default function LoginPage() {
  const redirectOnSuccess = useGetRedirectOnSuccessURL({ fallback: '/schedule/dashboard' });
  const email = useGetQueryParam("email");
  const phone = useGetQueryParam("phone");

  if (email.loading || phone.loading) {
    return <Loading />;
  }

  return <Login redirectOnSuccess={redirectOnSuccess} defaultState={{
   ...(email.ok && { email: email.value }),
   ...(phone.ok && { phone: phone.value }),
  }}/>;
}
