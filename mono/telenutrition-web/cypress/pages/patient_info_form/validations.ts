import type { PatientRecord } from '@mono/telenutrition/lib/types';
import Elements from './elements';
import { okResponse } from '../../mocks/responses';
import { DateTime } from 'luxon';

export const validateFields = (patient: PatientRecord) => {
  Elements.firstName().should('have.value', patient.firstName);
  Elements.lastName().should('have.value', patient.lastName);
  Elements.preferredName().should('have.value', patient.preferredName);
  Elements.birthday()
    .should(
      'have.value',
      DateTime.fromFormat(patient.birthday as string, 'yyyy-LL-dd').toFormat('LL/dd/yyyy'),
    )
    .should('exist');
  Elements.sex().children('select').should('have.value', patient.sex);
  Elements.address1().should('have.value', patient.address1);
  Elements.city().should('have.value', patient.city);
  Elements.state().children('select').should('have.value', patient.state);
  Elements.zipcode().should('have.value', patient.zipcode);
  Elements.phone().should('have.value', patient.phone);
  Elements.email().should('have.value', patient.email);
};

export const validateUpdate = (patient: PatientRecord) => {
  Elements.firstName()
    .clear()
    .type(patient.firstName ?? '');
  Elements.lastName()
    .clear()
    .type(patient.lastName ?? '');
  Elements.preferredName()
    .clear()
    .type(patient.preferredName ?? '');

  Elements.birthday()
    .should('exist')
    .clear()
    .type(DateTime.fromFormat(patient.birthday as string, 'yyyy-LL-dd').toFormat('LL/dd/yyyy'));

  Elements.sex().click();
  if (patient.sex) Elements.option(patient.sex).should('be.visible').click();

  Elements.pronouns().click();
  if (!patient.pronouns) Elements.option('unset').should('be.visible').click();
  else Elements.option(patient.pronouns).should('be.visible').click();

  Elements.address1()
    .clear()
    .type(patient.address1 as string);
  Elements.city()
    .clear()
    .type(patient.city as string);

  Elements.state().click();
  if (patient.state) Elements.option(patient.state).should('be.visible').click();

  Elements.zipcode()
    .clear()
    .type(patient.zipcode ?? '');

  Elements.phone()
    .clear()
    .type(patient.phone ?? '');
  Elements.email()
    .clear()
    .type(patient.email ?? '');

  cy.intercept('PUT', '/telenutrition/api/v1/provider/patient', okResponse({})).as(
    'update-patient',
  );
  cy.get('form').submit();

  cy.wait('@update-patient')
    .its('request.body')
    .should('deep.equal', {
      patientId: patient.patientId,
      patient: {
        firstName: patient.firstName,
        lastName: patient.lastName,
        preferredName: patient.preferredName,
        birthday: patient.birthday,
        sex: patient.sex,
        pronouns: patient.pronouns ?? '',
        address1: patient.address1,
        city: patient.city,
        state: patient.state,
        zipcode: patient.zipcode,
        phone: patient.phone,
        email: patient.email,
      },
    });
};

export default {
  validateFields,
  validateUpdate,
};
