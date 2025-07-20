/// <reference types="cypress" />

const byDataTestId = (dataTestId: string) => cy.get(`[data-testid=${dataTestId}]`);

const modal = () => byDataTestId('modal-root');
const dateNavigator = {
  left: () => byDataTestId('date-navigator-left-button'),
  right: () => byDataTestId('date-navigator-right-button'),
  mainButton: () => byDataTestId('date-navigator-main-button'),
};

const overflowMenuTrigger = () => byDataTestId('overflow-menu-trigger');
const overflowMenuItem = (text: string) => byDataTestId('dropdown-menu-item').contains(text);

const popover = () => cy.get('[data-radix-popper-content-wrapper]');
const popoverTrigger = () => byDataTestId('popover-trigger');

const popoverContent = () => byDataTestId('popover-content');
const tabItem = (name: string) => byDataTestId('tabs-trigger').contains(name);

const table = () => byDataTestId('data-table');
const tableRow = () => byDataTestId('data-table-row');

const calendarSelectorDay = (day: number) => cy.get('button[name="day"]').eq(day);

const Widgets = {
  required: () => cy.get('[data-cy-required="required"]'),
};

export default {
  dateNavigator,
  modal,
  overflowMenuTrigger,
  overflowMenuItem,
  byDataTestId,
  popover,
  popoverTrigger,
  popoverContent,
  tabItem,
  table,
  tableRow,
  calendarSelectorDay,
  Widgets,
};
