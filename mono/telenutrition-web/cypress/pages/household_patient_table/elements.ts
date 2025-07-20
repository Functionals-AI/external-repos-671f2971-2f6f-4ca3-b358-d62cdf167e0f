/// <reference types="cypress" />
import BasePage from '../base';

const tableContainer = () => cy.get('[data-testid="household-table-container"]');

const table = () => tableContainer().get('table');
const householdRows = () => table().get('tbody').find('tr');
const nthHouseholdRow = (ind: number) => householdRows().eq(ind);
const nthHouseholdRowCol = (i: number, j: number) => householdRows().eq(i).find('td').eq(j);
const nthHouseholdExpansionButton = (ind: number) =>
  householdRows().eq(ind).find('td').find('button');
const nthHouseholdExpansionContent = (ind: number) =>
  householdRows()
    .eq(ind + 1)
    .find('div > tr');
const nthHouseholdMemberRows = (ind: number) => nthHouseholdExpansionContent(ind).find('tr');
const tableFilterSearch = () => cy.get('[data-testid="patient-table-filter-search"]');

const getNthMainLevelRow = (ind: number) => {
  return cy.getByDataTest('data-table-row-depth-0').eq(ind);
};

const expandNthMainLevelRow = (ind: number) => {
  getNthMainLevelRow(ind).within(() => {
    cy.getByDataTestId('table-expander-button').click();
  });
};

export default {
  ...BasePage,
  tableContainer,
  table,
  householdRows,
  nthHouseholdRow,
  nthHouseholdRowCol,
  nthHouseholdExpansionButton,
  nthHouseholdExpansionContent,
  nthHouseholdMemberRows,
  tableFilterSearch,
  expandNthMainLevelRow,
  getNthMainLevelRow,
};
