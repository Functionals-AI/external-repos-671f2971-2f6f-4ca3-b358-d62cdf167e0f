import { AppointmentRecord, PatientPaymentMethod } from 'api/types';
import CoverageCard from './coverage-card';

interface Props {
  appointmentDetails: {
    appointment: AppointmentRecord;
    paymentMethod?: PatientPaymentMethod;
    patientPaymentMethods: PatientPaymentMethod[];
    providerName: string;
    lastNutriquizCompletion?: Date;
    hasNutriquiz?: boolean;
  };
}

export default function AccountInfo({ appointmentDetails }: Props) {
  const { paymentMethod } = appointmentDetails;

  const otherPaymentMethods = appointmentDetails.patientPaymentMethods.filter(
    (ad) => ad.id !== paymentMethod?.id,
  );

  // paymentMethod in appointment details doesn't include coverage details
  const paymentMethodData = appointmentDetails.patientPaymentMethods.find(
    (pm) => pm.id === paymentMethod?.id,
  );

  return (
    <>
      {paymentMethod && (
        <CoverageCard
          dataTestId="selected-coverage-card"
          isPrimary
          showInfo
          paymentMethod={paymentMethodData ?? paymentMethod}
        />
      )}
      {otherPaymentMethods.map((pm) => (
        <CoverageCard dataTestId="other-coverage-card" key={pm.id} paymentMethod={pm} />
      ))}
    </>
  );
}
