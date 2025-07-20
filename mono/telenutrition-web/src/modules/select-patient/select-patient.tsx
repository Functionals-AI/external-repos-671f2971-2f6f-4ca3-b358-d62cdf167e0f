import { UseGetPatientsReturn } from '../../api/useGetPatients';
import Button from '../../components/button';
import HeaderSubheader from '../../components/header-subheader';
import { useTranslation } from 'react-i18next';
import PatientDisplay from '../../components/patient-display';

interface SelectPatientProps {
  data: UseGetPatientsReturn;
  onAddPatient: () => void;
  onPatientSelected: (patientId: number) => void;
  onAddMe: () => void;
}

export default function SelectPatient({
  onAddPatient,
  onAddMe,
  onPatientSelected,
  data,
}: SelectPatientProps & { data: UseGetPatientsReturn }) {
  const { t } = useTranslation();

  const selfPatient = data.patients.find((patient) => patient.isSelf);
  const nonSelfPatients = data.patients.filter((patient) => !patient.isSelf);

  function handlePatientClicked(patientId: number) {
    onPatientSelected(patientId);
  }

  function handleAddSelfPatient() {
    onAddMe();
  }

  function handleAddNewPatient() {
    onAddPatient();
  }

  return (
    <div className="max-w-4xl m-auto py-16 px-8">
      <HeaderSubheader
        header={t('SelectPatient', 'Select Patient')}
        subheader={t(
          'SelectAnExistingPatientOrAddAnother',
          'Select an existing patient or add another to your account.',
        )}
      />
      <div className="flex flex-col justify-center items-center my-12">
        <div className="flex flex-col md:flex-row w-full justify-between divide-x-0 divide-y md:divide-y-0 gap-y-8 md:divide-x divide-neutral-700">
          <div className="flex-1 flex items-center flex-col gap-y-6">
            {selfPatient !== undefined ? (
              <div className="px-4 w-full items-center flex flex-col gap-y-4">
                <h3>{t('ScheduleForSelf', 'Schedule for Self')}</h3>
                <PatientDisplay as="button" patient={selfPatient} onClick={handlePatientClicked} />
              </div>
            ) : (
              <div>
                <Button size="x-large" onClick={handleAddSelfPatient}>
                  {t('ScheduleForSelf', 'Schedule for Self')}
                </Button>
              </div>
            )}
          </div>
          <div className="flex-1 flex items-center flex-col gap-y-6 pt-8 md:pt-0">
            <div className="flex items-center flex-col gap-y-6 w-full">
              {nonSelfPatients.length === 0 ? (
                <Button size="x-large" onClick={handleAddNewPatient}>
                  {t('ScheduleForADifferentPatient', 'Schedule for a Different Patient')}
                </Button>
              ) : (
                <div className="px-4 w-full flex flex-col gap-y-4 items-center">
                  <h3>{t('ScheduleForADifferentPatient', 'Schedule for a Different Patient')}</h3>
                  {nonSelfPatients.map((patient) => (
                    <PatientDisplay
                      key={patient.patientId}
                      as="button"
                      patient={patient}
                      onClick={handlePatientClicked}
                    />
                  ))}
                  <Button size="x-large" onClick={handleAddNewPatient}>
                    {t('AddAnotherPatient', 'Add Another Patient')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
