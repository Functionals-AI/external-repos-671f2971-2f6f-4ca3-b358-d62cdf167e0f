'use client';

import Container from '@/ui-components/container';
import PatientsList from '@/features/patients-list';
import { useFeatureFlags } from '@/modules/feature-flag';
import PatientTable from '@/features/patient-table';

export default function Page() {
  const featureFlags = useFeatureFlags();

  return (
    <Container dataTestId="household-table-container">
      {featureFlags.hasFeature('paginated_patients_page_ENG_2653') ? (
        <PatientsList />
      ) : (
        <PatientTable />
      )}
    </Container>
  );
}
