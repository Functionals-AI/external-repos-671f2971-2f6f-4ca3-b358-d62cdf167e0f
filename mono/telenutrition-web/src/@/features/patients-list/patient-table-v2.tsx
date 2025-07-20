import { useEffect } from 'react';
import GetErrorDisplay from '@/modules/errors/get-error-display';
import PaginatedPatientTable from '../../modules/data-table/custom-table/paginated-patient-table';
import { useFetchProviderPastPatients } from 'api/provider/useFetchProviderPastPatients';
import ContainerLoading from '@/ui-components/loading/container-loading';
import { PatientFiltersFields } from '.';
import { usePaginationState } from '@/modules/data-table/paginated-table';

export default function PatientTableV2({
  paymentMethodTypeIds,
  daysSinceLastSession,
  searchText,
}: PatientFiltersFields) {
  const { pagination, setPagination } = usePaginationState();

  const { data, error, isLoading, refetch, meta } = useFetchProviderPastPatients({
    offset: pagination.pageIndex * pagination.pageSize,
    limit: pagination.pageSize,
    sortBy: 'patientName',
    sortOrder: 'desc',
    ...(daysSinceLastSession && { daysSinceLastSession }),
    ...(paymentMethodTypeIds && paymentMethodTypeIds.length > 0
      ? {
          paymentMethodTypeIds: paymentMethodTypeIds.filter((c) => !!c).join(','),
        }
      : {}),
    ...(searchText && { patientIdNameQuery: searchText }),
  });

  useEffect(() => {
    refetch();
  }, [paymentMethodTypeIds, daysSinceLastSession, searchText]);

  if (isLoading) return <ContainerLoading />;
  if (error) return <GetErrorDisplay refetch={refetch} error={error} />;

  return (
    <PaginatedPatientTable
      data={data || []}
      total={meta?.total ?? 0}
      pagination={pagination}
      setPagination={setPagination}
      loading={isLoading}
    />
  );
}
