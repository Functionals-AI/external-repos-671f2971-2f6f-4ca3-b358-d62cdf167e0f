/// <reference types="cypress" />

import Elements from './elements';
import Utilities from './utilities';

import { Household } from 'api/types';

export const verifyTableDisplayed = () => {
  Elements.table().should('be.visible');
};

export const verifyTableContainsAllHouseholds = (households: Household[]) => {
  Elements.householdRows().should('have.length', households.length);
};

export const verifyTableContainsAllHouseholdMembers = (households: Household[]) => {
  for (let i = 0; i < households.length; i++) {
    if (households[i].members.length > 1) {
      Utilities.expandHousehold(i, households[i]);
      const householder = households[i].members[0];
      const content = `${householder.firstName} ${householder.lastName} + ${
        households[i].members.length - 1
      } more`;
      Elements.nthHouseholdRowCol(i, 1).should('contain.text', content);
    } else {
      const householder = households[i].members[0];
      const content = `${householder.firstName} ${householder.lastName}`;
      Elements.nthHouseholdRowCol(i, 1).should('contain.text', content);
    }
  }
};

export const verifyTableFilterSearchDisplayed = () => {
  Elements.tableFilterSearch().should('be.visible');
};

export default {
  verifyTableDisplayed,
  verifyTableContainsAllHouseholds,
  verifyTableContainsAllHouseholdMembers,
  verifyTableFilterSearchDisplayed,
};
