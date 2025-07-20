import Elements from './elements';
import { Household } from 'api/types';

export const expandHousehold = (index: number, household: Household) => {
  Elements.nthHouseholdExpansionButton(index).click(); // Expand
  Elements.nthHouseholdExpansionContent(index).should('be.visible');
  Elements.nthHouseholdMemberRows(index).should('have.length', household.members.length);
  Elements.nthHouseholdExpansionButton(index).click(); // Collapse
};

export default {
  expandHousehold,
};
