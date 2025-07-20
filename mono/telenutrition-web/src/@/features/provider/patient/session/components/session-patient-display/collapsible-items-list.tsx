import CollapsibleItems, { CollapsibleItem } from '@/ui-components/collapsible-items';
import PaymentMethodsDisplay from './payment-methods-display';
import PatientSessionHistory from './patient-session-history';
import { useTranslation } from 'react-i18next';
import { useSessionContext } from '../../useSessionContext';
import useFetchProviderPatientHistory from 'api/provider/useFetchProviderPatientAppointments';
import { DeveloperError } from 'utils/errors';
import ContainerLoading from '@/ui-components/loading/container-loading';
import GetErrorDislpay from '@/modules/errors/get-error-display';
import { useFeatureFlags } from '@/modules/feature-flag';

export default function CollapsibleItemsList() {
  const featureFlags = useFeatureFlags();
  const { t } = useTranslation();
  const {
    data: { appointmentDetails },
  } = useSessionContext();
  const { patient } = appointmentDetails.appointment;

  if (!patient) {
    throw new DeveloperError('There should be a patient on an appointment with a valid session');
  }

  const { data, isLoading, error, refetch } = useFetchProviderPatientHistory(patient.patientId, {
    includeEncounterData: true,
    completeOnly: true,
    limit: 3,
  });

  if (isLoading) {
    return (
      <div className="relative">
        <ContainerLoading />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <GetErrorDislpay error={error} refetch={refetch} />
      </div>
    );
  }

  const items = [
    !featureFlags.hasFeature('coverage_visibility_ENG_2371')
      ? {
          label: t('Insurance coverage'),
          content: <PaymentMethodsDisplay appointmentDetails={appointmentDetails} />,
          dataTestId: 'insurance-coverage-collapsible-item',
        }
      : null,
    {
      label: t('Visit history'),
      content: <PatientSessionHistory entries={data.appointments} />,
      disabled: data.appointments.length === 0,
      dataTestId: 'session-history-collapsible-item',
    },
  ].filter((i) => !!i) as CollapsibleItem[];
  // our current version of ts doesnt support filter

  return <CollapsibleItems items={items} />;
}
