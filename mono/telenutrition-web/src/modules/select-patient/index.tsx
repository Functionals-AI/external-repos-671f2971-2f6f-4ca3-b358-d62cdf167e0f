import { useRouter } from 'next/router';
import Wizard from '../../components/wizard';
import WizardSteps from '../../components/wizard/wizard-steps';
import AddPatient from './add-patient';
import SelectPatient from './select-patient';
import AddMePatient from './add-me-patient';
import { useEffect, useState } from 'react';
import Loading from '../../components/loading';
import useGetPatients from '../../api/useGetPatients';
import ApiGetError from '../../components/api-get-error';
import useAppUser from '../../hooks/useAppUser';
import { AccountIds } from 'api/account/useGetAccount';

interface SelectPatientWizardProps {
  redirectOnSuccess: string;
}

export default function SelectPatientWizard({ redirectOnSuccess }: SelectPatientWizardProps) {
  const router = useRouter();
  const { data, isLoading, error, refetch } = useGetPatients();
  const appUserResult = useAppUser({ required: false });
  const [startStep, setStartStep] = useState<'add_me' | 'select_patient' | null>(null);

  useEffect(() => {
    if (isLoading || !data) return;
    if (appUserResult.loading) return

    const isSelfOnly = appUserResult.data?.accountId === AccountIds.BankOfAmerica

    if (!isReferral && !isSelfOnly) {
      setStartStep('select_patient');
      return;
    }

    const mePatient = data?.patients.find((patient) => patient.isSelf);
    if (mePatient == undefined) {
      setStartStep('add_me');
    } else {
      handlePatientSelected(mePatient.patientId);
    }
  }, [appUserResult, isLoading, data]);

  if (appUserResult.loading) return <Loading />;

  const isReferral = !!appUserResult.data?.isReferral;

  const handlePatientSelected = (patientId: number) => {
    router.push(`${redirectOnSuccess}?patient_id=${patientId}`);
  };

  if (startStep == null) return <Loading />;
  if (error) return <ApiGetError error={error} refetch={refetch} />;
  if (isLoading || data == undefined) return <Loading />;

  return (
    <Wizard
      flowName="select_patient_flow"
      initialState={{}}
      start={startStep}
      steps={{
        select_patient: {
          render: ({ goTo }) => (
            <SelectPatient
              data={data}
              onPatientSelected={handlePatientSelected}
              onAddMe={() => goTo('add_me')}
              onAddPatient={() => goTo('add_patient')}
            />
          ),
        },
        add_me: {
          render: () => <AddMePatient />,
        },
        add_patient: {
          render: () => <AddPatient />,
        },
      }}
    >
      <WizardSteps />
    </Wizard>
  );
}
