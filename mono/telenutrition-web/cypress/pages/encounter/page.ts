import BasePage from '../base';

const encounterCollapsibleItems = {
  sessionHistory: () => BasePage.byDataTestId('session-history-collapsible-item'),
  insuranceCoverage: () => BasePage.byDataTestId('insurance-coverage-collapsible-item'),
};

const chartingGroups = {
  memberDetails: () => BasePage.byDataTestId('widget-group-member_details'),
  assessment: () => BasePage.byDataTestId('widget-group-assessment'),
  treatmentPlan: () => BasePage.byDataTestId('widget-group-treatment_plan'),
  encounterCloseout: () => BasePage.byDataTestId('widget-group-encounter_closeout_group'),
};

const startEncounterButton = () => BasePage.byDataTestId('start-encounter-button');
const finalizeEncounterButton = () => BasePage.byDataTestId('open-finalize-modal-button');

export default {
  ...BasePage,
  encounterCollapsibleItems,
  chartingGroups,
  startEncounterButton,
  finalizeEncounterButton,
};
