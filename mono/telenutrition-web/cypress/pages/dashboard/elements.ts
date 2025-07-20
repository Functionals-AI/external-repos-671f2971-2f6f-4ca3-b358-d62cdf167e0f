/// <reference types="cypress" />
import BasePage from '../base';

const rescheduleOption = (time: `${number}${number}:${'00' | '30'}`) =>
  cy.get(`[data-testid="reschedule-option-${time}"]`);

const taskListContainer = () => cy.get('[data-testid="task-list-container"]');
const taskListItem = () => cy.get('[data-testid="task-list-item"]');

const viewTypeToggle = () => cy.get('[data-testid="provider-calendar-view-type-toggle"]');

const dataDislpay = () => cy.getByDataTestId('data-display');

const calendar1DayView = {
  calendarItems: () => cy.get('[data-testid="calendar-item-hour"]'),
  calendarItem: (time: `${number}:${'30' | '00'}${'am' | 'pm'}`) => cy.get(`[data-test="${time}"]`),
  calendarUnavailableHourItems: () => cy.get('[data-testid="unavailable-hour"]'),
  calendarBookedHourItems: () => cy.get('[data-testid="booked-hour"]'),
  calendarConflictingHourItems: () => cy.get('[data-testid="conflicting-hour"]'),
  calendarAvailableHourItems: () => cy.get('[data-testid="available-hour"]'),
  calendarNeedsUpdatingHourItems: () => cy.get('[data-cy="appointment-needs-attention"]'),
};

const calendarMultiDayView = {
  view4Day: () => cy.get('[data-testid="4-day-calendar-view"]'),
  view7Day: () => cy.get('[data-testid="7-day-calendar-view"]'),
  bookedItems: () => cy.get('[data-testid="booked-hour"]'),
  conflictingItems: () => cy.get('[data-testid="conflicting-cell"]'),
  availableItems: () => cy.get('[data-testid="available-60min"]'),
  unavailableItems: () => cy.get('[data-testid="unavailable-60min"]'),
  calendarColumnHeader: (
    date: `${number}${number}/${number}${number}/${number}${number}${number}${number}`,
  ) => cy.get(`[data-testid="calendar-header-${date}`),
};

export default {
  ...BasePage,
  calendar1DayView,
  rescheduleOption,
  viewTypeToggle,
  calendarMultiDayView,
  taskListContainer,
  taskListItem,
  dataDislpay,
};
