/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//

export {};
declare global {
  namespace Cypress {
    interface Chainable {
      //   login(email: string, password: string): Chainable<void>;
      //   drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>;
      //   dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>;
      //   visit(
      //     originalFn: CommandOriginalFn,
      //     url: string,
      //     options: Partial<VisitOptions>,
      //   ): Chainable<Element>;
      isWithinViewport(): Chainable<Element>;
    }
  }
}

Cypress.Commands.add('isWithinViewport', { prevSubject: true }, (subject) => {
  const windowInnerWidth = Cypress.config(`viewportWidth`);

  const bounding = subject[0].getBoundingClientRect();

  const rightBoundOfWindow = windowInnerWidth;

  expect(bounding.top).to.be.at.least(0);
  expect(bounding.left).to.be.at.least(0);
  expect(bounding.right).to.be.lessThan(rightBoundOfWindow);

  return subject;
});
