import dayjs from '../../utils/dayjs';
import Card from '../../components/card';
import DashboardLayout from './layout';
import Loading from '../../components/loading';
import { useTranslation } from 'react-i18next';
import { useModalManager } from '../modal/manager';
import useGetPatients from '../../api/useGetPatients';
import PatientDisplay from '../../components/patient-display';
import useAppUser from '../../hooks/useAppUser';

const AccountPoint = ({ label, value }: { label: string; value?: string }) => {
  if (!value) return null;

  return (
    <div>
      <p className="font-bold text-base text-neutral-700">{label}</p>
      <p className="font-normal text-base text-neutral-700">{value}</p>
    </div>
  );
};

export default function DashboardAccount() {
  const appUserResult = useAppUser({ required: true });
  const { t } = useTranslation();
  const modalManager = useModalManager();
  const { data, isLoading, error } = useGetPatients();

  if (appUserResult.loading) {
    return (
      <DashboardLayout>
        <Loading />
      </DashboardLayout>
    );
  }

  const openAccountEditModal = () => {
    modalManager.openModal({
      type: 'UpdateAccountInfo',
      currentAccountFields: appUserResult.data,
    });
  };

  const { phone, email, birthday, firstName, lastName, zipCode } = appUserResult.data;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-y-8">
        <h1 className="font-normal text-4xl">{t('Account', 'Account')}</h1>
        <Card>
          <div className="flex flex-col sm:flex-row px-16 gap-y-8">
            <div style={{ flex: 2 }} className="flex flex-col gap-y-8">
              <h3 className="font-semibold text-2xl text-f-dark-green">
                {firstName} {lastName}
              </h3>
              <AccountPoint
                label={t('DateOfBirth', 'Date of Birth')}
                value={dayjs.tz(birthday).format('LL')}
              />
            </div>
            <div style={{ flex: 2 }} className="flex flex-col gap-y-8">
              <AccountPoint label={t('ZipCode', 'Zip Code')} value={zipCode} />
              <AccountPoint label={t('Email', 'Email')} value={email} />
              <AccountPoint label={t('Phone', 'Phone')} value={phone} />
            </div>
          </div>
          {/* DISABLED FOR NOW -- BUT THIS WORKS */}
          {/* <div className="px-16 mt-8">
            <Button onClick={openAccountEditModal}>{t('EditAccount', 'Edit Account')}</Button>
          </div> */}
        </Card>

        {isLoading || !data || error != null ? null : (
          <div>
            <h1 className="font-normal text-4xl pb-6">{t('Patients', 'Patients')}</h1>
            <div className="grid xs:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {data.patients.map((patient) => (
                <PatientDisplay key={patient.patientId} as="div" patient={patient} />
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
