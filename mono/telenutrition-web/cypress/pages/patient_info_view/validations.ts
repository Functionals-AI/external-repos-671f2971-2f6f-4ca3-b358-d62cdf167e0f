import type { PatientRecord } from '@mono/telenutrition/lib/types';
import Elements from './elements';
import Utilities from './utilities';
import { DateTime } from 'luxon';

export const validateFields = (patient: PatientRecord) => {
  Elements.firstName().should('have.text', patient.firstName);
  Elements.lastName().should('have.text', patient.lastName);
  Elements.preferredName().should('have.text', patient.preferredName);
  Elements.birthday().should(
    'have.text',
    DateTime.fromFormat(patient.birthday as string, 'yyyy-LL-dd').toFormat('LL/dd/yyyy'),
  );
  Elements.sex().should('have.text', Utilities.getLabelByValue(Utilities.SEX_OPTIONS, patient.sex));
  Elements.address1().should('have.text', patient.address1);
  Elements.city().should('have.text', patient.city);
  Elements.state().should(
    'have.text',
    Utilities.getLabelByValue(Utilities.STATE_OPTIONS, patient.state),
  );
  Elements.zipcode().should('have.text', patient.zipcode);
  Elements.phone().should('have.text', patient.phone);
  Elements.email().should('have.text', patient.email);
};

export default {
  validateFields,
};
