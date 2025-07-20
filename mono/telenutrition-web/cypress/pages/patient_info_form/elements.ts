/// <reference types="cypress" />
import BasePage from '../base';

const firstName = () => cy.get('[data-testid="firstName-input"]');
const lastName = () => cy.get('[data-testid="lastName-input"]');
const preferredName = () => cy.get('[data-testid="preferredName-input"]');
const birthday = () => cy.get('[data-testid="birthday-input"]');
const sex = () => cy.get('[data-testid="sex-input"]');
const pronouns = () => cy.get('[data-testid="pronouns-input"]');
const address1 = () => cy.get('[data-testid="address1-input"]');
const city = () => cy.get('[data-testid="city-input"]');
const state = () => cy.get('[data-testid="state-input"]');
const zipcode = () => cy.get('[data-testid="zipcode-input"]');
const phone = () => cy.get('[data-testid="phone-input"]');
const email = () => cy.get('[data-testid="email-input"]');
const option = (optionValue: string) => cy.get(`[data-testid="select-option-${optionValue}"]`);

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
  option,
};
