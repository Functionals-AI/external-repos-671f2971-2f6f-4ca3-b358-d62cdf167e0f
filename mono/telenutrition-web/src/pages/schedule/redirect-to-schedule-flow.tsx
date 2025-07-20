import _ from 'lodash';
import Loading from '../../components/loading';
import useGetQueryParam from '../../hooks/useGetQueryParam';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function RedirectToScheduleFlowPage() {
  const router = useRouter();
  const patientIdParamResult = useGetQueryParam('patient_id');

  useEffect(() => {
    if (patientIdParamResult.loading) return;
    if (!patientIdParamResult.ok || _.isNaN(patientIdParamResult.value)) {
      router.push('/schedule/dashboard');
      return;
    }

    router.push(`/schedule/flow/schedule?patient_id=${patientIdParamResult.value}`);
    return;
  }, [patientIdParamResult.loading]);

  return <Loading />;
}
