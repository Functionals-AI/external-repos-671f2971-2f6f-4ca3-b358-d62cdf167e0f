import ForgotPassword from '../../../modules/auth/forgot-password';
import _ from 'lodash';
import useGetEmailPhoneFromQuery from '../../../hooks/useGetEmailPhoneFromQuery';
import useGetRedirectOnSuccessURL from '../../../hooks/useGetRedirectOnSuccessURL';
import useGetQueryParam from '../../../hooks/useGetQueryParam';
import Loading from '../../../components/loading';

export default function ForgotPasswordPage() {
  const emailPhoneState = useGetEmailPhoneFromQuery({ redirectOnFail: '/schedule/auth/login' });
  const redirectOnSuccess = useGetRedirectOnSuccessURL({ fallback: '/schedule/dashboard' });
  const code = useGetQueryParam('code');

  return !!emailPhoneState && !code.loading ? (
    <ForgotPassword
      emailOrPhone={emailPhoneState}
      redirectOnSuccess={redirectOnSuccess}
      code={code.ok ? code.value : undefined}
    />
  ) : (
    <Loading />
  );
}
