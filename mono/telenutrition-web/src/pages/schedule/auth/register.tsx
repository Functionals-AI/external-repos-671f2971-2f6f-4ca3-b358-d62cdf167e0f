import Register from '../../../modules/auth/register';
import _ from 'lodash';
import useGetRedirectOnSuccessURL from '../../../hooks/useGetRedirectOnSuccessURL';
import useGetQueryParam from '../../../hooks/useGetQueryParam';
import Loading from '../../../components/loading';

export default function RegisterPage() {
  const redirectOnSuccess = useGetRedirectOnSuccessURL({ fallback: '/schedule' });
  const enrollmentResult = useGetQueryParam('enrollment');

  if (enrollmentResult.loading) {
    return <Loading />;
  }

  return (
    <Register
      redirectOnSuccess={redirectOnSuccess}
      enrollment={enrollmentResult.ok ? enrollmentResult.value : undefined}
    />
  );
}
