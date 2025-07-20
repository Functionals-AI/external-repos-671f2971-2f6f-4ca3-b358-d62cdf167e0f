/// <reference types="cypress" />
import BasePage from '../base';

const firstName = () => cy.get('[data-testid="firstName-value"]');
const lastName = () => cy.get('[data-testid="lastName-value"]');
const preferredName = () => cy.get('[data-testid="preferredName-value"]');
const birthday = () => cy.get('[data-testid="birthday-value"]');
const sex = () => cy.get('[data-testid="sex-value"]');
const pronouns = () => cy.get('[data-testid="pronouns-value"]');
const address1 = () => cy.get('[data-testid="address1-value"]');
const city = () => cy.get('[data-testid="city-value"]');
const state = () => cy.get('[data-testid="state-value"]');
const zipcode = () => cy.get('[data-testid="zipcode-value"]');
const phone = () => cy.get('[data-testid="phone-value"]');
const email = () => cy.get('[data-testid="email-value"]');

export default {
  ...BasePage,
  firstName,
  lastName,
  preferredName,
  birthday,
  sex,
  pronouns,
  address1,
  city,
  state,
  zipcode,
  phone,
  email,
};
