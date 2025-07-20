import { FormV2 } from '@/modules/form/form';
import { useForm } from 'react-hook-form';

import { PatientFilters } from './patient-filters';
import PatientTableV2 from './patient-table-v2';
import useFetchSchedulingPaymentMethods from '../../../api/scheduling/useFetchSchedulingPaymentMethods';
import Loading from '../../../components/loading';
import GetErrorDisplay from '../../modules/errors/get-error-display';
import { DaysSinceLastSessionOption } from 'api/provider/useFetchProviderPastPatients';

export interface PatientFiltersFields {
  searchText: string;
  paymentMethodTypeIds: string[];
  daysSinceLastSession: DaysSinceLastSessionOption;
}

export default function PatientsList() {
  const { data, isLoading, error, refetch } = useFetchSchedulingPaymentMethods({});

  const form = useForm<PatientFiltersFields>({
    defaultValues: {
      searchText: '',
    },
  });

  const [paymentMethodTypeIds, daysSinceLastSession, searchText] = form.watch([
    'paymentMethodTypeIds',
    'daysSinceLastSession',
    'searchText',
  ]);

  if (isLoading) {
    return <Loading />;
  }
  if (error) return <GetErrorDisplay refetch={refetch} error={error} />;

  return (
    <div>
      <FormV2 form={form} onSubmit={() => {}}>
        <PatientFilters form={form} paymentMethods={data.paymentMethods} />
        <div className="h-2" />
        <PatientTableV2
          paymentMethodTypeIds={paymentMethodTypeIds}
          daysSinceLastSession={daysSinceLastSession}
          searchText={searchText}
        />
      </FormV2>
    </div>
  );
}
