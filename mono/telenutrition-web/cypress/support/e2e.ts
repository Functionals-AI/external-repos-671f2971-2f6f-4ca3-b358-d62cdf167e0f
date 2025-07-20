// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';
import { FeatureFlag } from '@/modules/feature-flag/feature-flags';
import { StandardFeature } from '@/modules/feature-flag';

// Alternatively you can use CommonJS syntax:
// require('./commands')

declare global {
  namespace Cypress {
    interface Chainable {
      turnOnFeatureFlag: (featureFlag: FeatureFlag | StandardFeature) => void;
      getByDataTestId: (dataTestId: string) => Chainable<JQuery<HTMLElement>>;
      getByDataTest: (dataTest: string) => Chainable<JQuery<HTMLElement>>;
      validateDataDisplay: (dataTestId: string, content: string) => Chainable<JQuery<HTMLElement>>;
    }
  }
}

Cypress.Commands.add('turnOnFeatureFlag', (featureFlag: FeatureFlag | StandardFeature) => {
  window.localStorage.setItem(featureFlag, 'on');
});

Cypress.Commands.add('getByDataTestId', (dataTestId: string) => {
  return cy.get(`[data-testid='${dataTestId}']`);
});

Cypress.Commands.add('getByDataTest', (dataTest: string) => {
  return cy.get(`[data-test='${dataTest}']`);
});

Cypress.Commands.add('validateDataDisplay', (dataTestId: string, content: string) => {
  return cy.getByDataTestId(dataTestId).should('have.text', content);
});
