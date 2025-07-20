import PatientTable from '@/modules/data-table/custom-table/patient-table';
import GetErrorDislpay from '@/modules/errors/get-error-display';
import ContainerLoading from '@/ui-components/loading/container-loading';
import { useFetchProviderPatients } from 'api/provider/useFetchProviderPatients';

export default function PatientTableFeature() {
  const { data, error, isLoading, refetch } = useFetchProviderPatients();

  if (isLoading) return <ContainerLoading />;
  if (error) return <GetErrorDislpay refetch={refetch} error={error} />;

  return <PatientTable type="households" data={data} isTablePaginationVisible={true} />; 
} 
