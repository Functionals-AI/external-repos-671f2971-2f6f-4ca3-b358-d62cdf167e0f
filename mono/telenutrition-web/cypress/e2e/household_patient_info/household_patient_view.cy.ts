import { DateTime } from 'luxon';
import { setupProviderFixutre1 } from '../../mocks/provider-fixture-1';

import PatientView from '../../pages/patient_info_view';
import PatientForm from '../../pages/patient_info_form';
import { okResponse } from '../../mocks/responses';
import { UseGetStickyNotesForPatientsResult } from 'api/provider/useGetStickyNotesForPatient';

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

    cy.visit(`/schedule/provider/patient/${patientId}/profile/view`);

    cy.intercept(
      {
        method: 'GET',
        url: '/telenutrition/api/v1/provider/sticky-notes?patientId=917460',
      },
      okResponse<UseGetStickyNotesForPatientsResult>({ stickyNotes: [] }),
    );

    Cypress.on('uncaught:exception', (err, runnable) => {
      if (err.message.includes('ResizeObserver loop completed with undelivered notifications')) {
        return false;
      }
    });
  });

  it('Should populate correct values', () => {
    PatientView.Validations.validateFields(patient);
  });

  it('Should navigate to households tab and show correct name data and household members', () => {
    PatientView.Elements.tabItem('Household').click();

    PatientView.Elements.table().should('exist');

    PatientView.Elements.tableRow().should('have.length', 3);
  });

  it('Should correctly add a member to the household', () => {
    const newPatient = {
      firstName: 'NewName',
      lastName: 'Novicki',
      birthday: '2000-09-02',
      sex: 'M',
      address1: 'The New Main Street',
      zipcode: '55477',
    };

    PatientView.Elements.tabItem('Household').click();

    PatientView.Elements.byDataTestId('add-member-button').click();

    PatientView.Elements.modal().should('exist');

    PatientForm.Elements.firstName().type(newPatient.firstName);
    PatientForm.Elements.lastName().type(newPatient.lastName);
    PatientForm.Elements.birthday()
      .should('exist')
      .type(DateTime.fromFormat(newPatient.birthday, 'yyyy-LL-dd').toFormat('LL/dd/yyyy'));

    PatientForm.Elements.sex().click();
    if (patient.sex) PatientForm.Elements.option(newPatient.sex).should('be.visible').click();

    PatientForm.Elements.address1().clear().type(newPatient.address1);
    PatientForm.Elements.zipcode().clear().type(newPatient.zipcode);

    cy.intercept('POST', '/telenutrition/api/v1/scheduling/patients', okResponse({})).as(
      'add-patient',
    );

    PatientForm.Elements.modal().within(() => {
      cy.get('form').submit();
    });

    cy.wait('@add-patient')
      .its('request.body')
      .should('deep.equal', {
        state: {
          firstName: newPatient.firstName,
          lastName: newPatient.lastName,
          sex: newPatient.sex,
          address: newPatient.address1,
          state: 'AR',
          zipcode: newPatient.zipcode,
          email: 'conner.novicki+fake@foodsmart.com',
          dob: newPatient.birthday,
          city: 'Fake',
          phoneMobile: '+15025253456',
        },
        userId: 1,
      });
  });
});
