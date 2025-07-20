import { DateTime } from 'luxon';
import { setupProviderFixutre1 } from '../../mocks/provider-fixture-1';

import HouseholdTable from '../../pages/household_patient_table';
import { Household } from 'api/types';

const timezone = 'America/New_York';
const now = DateTime.fromFormat('05/13/2024', 'LL/dd/yyyy')
  .setZone(timezone)
  .startOf('day')
  .plus({ hour: 10, minutes: 25 });

describe('Provider Connect -> Household Table', () => {
  let provider, providerHouseholds: Household[];
  beforeEach(() => {
    const fixture = setupProviderFixutre1({ timezone, now });
    provider = fixture.provider;
    providerHouseholds = fixture.providerHouseholds;

    cy.clock(now.toJSDate(), ['Date']);

    cy.visit('/schedule/provider/patients');

    Cypress.on('uncaught:exception', (err, runnable) => {
      if (err.message.includes('ResizeObserver loop completed with undelivered notifications')) {
        return false;
      }
    });
  });

  it('Should show household table', () => {
    HouseholdTable.Validations.verifyTableDisplayed();
  });

  it('Should show correct households', () => {
    cy.getByDataTest('data-table-row-depth-0').should('have.length', 3);
    HouseholdTable.Elements.expandNthMainLevelRow(0);

    cy.getByDataTest('data-table-row-depth-1').should('have.length', 4);
    HouseholdTable.Elements.expandNthMainLevelRow(0);
    cy.getByDataTest('data-table-row-depth-1').should('have.length', 0);
    HouseholdTable.Elements.expandNthMainLevelRow(0);
    HouseholdTable.Elements.expandNthMainLevelRow(1);

    cy.getByDataTest('data-table-row-depth-1').should('have.length', 6);
  });

  it('Should show household table filter search component', () => {
    HouseholdTable.Validations.verifyTableFilterSearchDisplayed();
  });

  it('Should filter out items', () => {
    HouseholdTable.Elements.householdRows().should('have.length', 3);
    cy.getByDataTestId('patient-search-input').should('exist').type('con');
    HouseholdTable.Elements.householdRows().should('have.length', 2);
    cy.getByDataTestId('patient-search-input').should('exist').clear();
    HouseholdTable.Elements.householdRows().should('have.length', 3);
    cy.getByDataTestId('patient-search-input').should('exist').type('novicki');
    HouseholdTable.Elements.householdRows().should('have.length', 3);
    cy.getByDataTestId('patient-search-input').should('exist').clear();
    cy.getByDataTestId('patient-search-input').should('exist').type('lucia');
    HouseholdTable.Elements.householdRows().should('have.length', 1);
  });

  describe.skip('with bulk scheduling on', () => {
    beforeEach(() => {
      cy.turnOnFeatureFlag('thorough_scheduling_flow_ENG_1629');
      cy.reload();
    });

    it('Should show schedule session button for schedulable patients', () => {
      HouseholdTable.Elements.expandNthMainLevelRow(1);
      cy.getByDataTest('data-table-row-depth-1')
        .eq(0)
        .within(() => {
          cy.getByDataTestId('table-expander-button').click();
        });

      cy.getByDataTestId('patient-unable-to-schedule-banner').should('not.exist');
      cy.getByDataTestId('schedule-sessions-button').should('exist').click();

      cy.url().should('include', '/schedule/provider/patient/917515/schedule');
      cy.getByDataTestId('week-view-table').should('exist');
    });

    it('Should not show schedule session button for non-schedulable patients', () => {
      HouseholdTable.Elements.expandNthMainLevelRow(1);
      cy.getByDataTest('data-table-row-depth-1')
        .eq(1)
        .within(() => {
          cy.getByDataTestId('table-expander-button').click();
        });

      cy.getByDataTestId('patient-unable-to-schedule-banner')
        .should('exist')
        .and('contain.text', 'Cannot schedule with this patient');
    });
  });
});
