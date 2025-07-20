import { DateTime } from 'luxon';
import { setupProviderFixutre1 } from '../../mocks/provider-fixture-1';

import PatientForm from '../../pages/patient_info_form';

const timezone = 'America/New_York';
const now = DateTime.fromFormat('05/13/2024', 'LL/dd/yyyy')
  .setZone(timezone)
  .startOf('day')
  .plus({ hour: 10, minutes: 25 });

const patientId = 917460;
const patient = {
  patientId: 917460,
  departmentId: 9,
  identityId: 1,
  state: 'AR',
  address1: '123 Main Fake',
  city: 'Fake',
  sex: 'M',
  // This is just what the input.text comes back as in the HTML, but not the format actually sent in formData to API
  phone: '(502) 525-3456',
  email: 'conner.novicki+fake@foodsmart.com',
  timezone: 'America/Los_Angeles',
  firstName: 'Con',
  lastName: 'nov',
  birthday: '2000-09-02' as const,
  zipcode: '35352',
  preferredName: 'Connie',
  pronouns: 'he/him/his',
};

describe('Provider Connect -> Patient Info View', () => {
  beforeEach(() => {
    setupProviderFixutre1({ timezone, now });
    cy.clock(now.toJSDate(), ['Date']);

    cy.visit(`/schedule/provider/patient/${patientId}/profile/edit`);

    Cypress.on('uncaught:exception', (err, runnable) => {
      if (err.message.includes('ResizeObserver loop completed with undelivered notifications')) {
        return false;
      }
    });
  });

  it('Should populate correct values', () => {
    PatientForm.Validations.validateFields(patient);
    PatientForm.Validations.validateUpdate({
      ...patient,
      firstName: 'Michael',
      lastName: 'Varrone',
      preferredName: 'Michael Varrone',
      birthday: '1990-01-01' as const,
      sex: 'F',
      pronouns: undefined,
      address1: 'test',
      city: 'Los Angeles',
      state: 'CA',
      zipcode: '90000',
      phone: '+17145099000',
      email: 'michael.varrone+001@foodsmart.com',
    });
  });
});
