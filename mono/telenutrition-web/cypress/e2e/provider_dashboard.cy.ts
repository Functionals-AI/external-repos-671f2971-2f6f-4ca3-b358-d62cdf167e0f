import { DateTime } from 'luxon';
import { okResponse } from '../mocks/responses';
import { setupProviderFixutre1 } from '../mocks/provider-fixture-1';
import DashboardPage from '../pages/dashboard';
import { AppointmentRecord } from '../../src/api/types';
import type { PatientRecord, ProviderRecord } from '@mono/telenutrition/lib/types';
import _ from 'lodash';
import { FetchProviderOverbookingSlotsResult } from 'api/provider/useFetchProviderOverbookingSlots';
import { createAppointmentRecord } from '../mocks/provider-fixture-1/appointment';

function runDashboardTests(timezone: string) {
  const now = DateTime.fromFormat('05/13/2024', 'LL/dd/yyyy', { zone: timezone })
    .startOf('day')
    .plus({ hour: 8, minutes: 25 });

  describe(`Timezone: ${timezone} -> Provider Connect -> Dashboard`, () => {
    let provider: ProviderRecord, provider1: ProviderRecord;
    let patient: PatientRecord;
    beforeEach(() => {
      // Creates appointments at the same time in the current timezone.
      // I.E. first run would be 8AM EST, 9AM EST, etc.
      // Second run would be 8AM HST, 9AM HST, etc.
      const fixture = setupProviderFixutre1({ timezone, now });
      provider = fixture.provider;
      provider1 = fixture.provider1;
      patient = fixture.providerHouseholds[0].members[0];
      cy.clock(now.toJSDate(), ['Date']);

      cy.visit('/schedule/provider/dashboard');

      Cypress.on('uncaught:exception', (err) => {
        if (err.message.includes('ResizeObserver loop completed with undelivered notifications')) {
          return false;
        }
      });

      cy.intercept(
        { method: 'GET', url: '/telenutrition/api/v1/provider/sticky-notes?*' },
        okResponse({ stickyNotes: [] }),
      );
    });

    it('Should show correct hour slots', () => {
      DashboardPage.Elements.calendar1DayView.calendarItems().should('have.length', 11);
      DashboardPage.Elements.calendar1DayView.calendarBookedHourItems().should('have.length', 4);
      DashboardPage.Elements.calendar1DayView
        .calendarUnavailableHourItems()
        .should('have.length', 7);
    });

    it.skip('Should unfreeze a timeslot', () => {
      DashboardPage.Elements.calendar1DayView
        .calendarUnavailableHourItems()
        .eq(4)
        .within(() => {
          DashboardPage.Elements.overflowMenuTrigger().click({ force: true });
        });
      DashboardPage.Elements.overflowMenuItem('Unfreeze').click({ force: true });

      DashboardPage.Elements.modal().should('exist');

      cy.intercept(
        {
          method: 'POST',
          url: '/telenutrition/api/v1/provider/v2/slots/create',
        },
        okResponse({}),
      ).as('unfreeze-slot');

      cy.get('button').contains('Done').click();

      const offset =
        DateTime.now().setZone('America/New_York').offset - DateTime.now().setZone(timezone).offset;

      const expectedDate = new Date('2024-05-13T18:00:00.000Z');
      const expectedDateInTimezone = new Date(
        expectedDate.getTime() + offset * 1000 * 60,
      ).toISOString();
      cy.wait('@unfreeze-slot').its('request.body').should('deep.equal', {
        date: expectedDateInTimezone,
        duration: 60,
      });
    });

    it.skip('Should unfreeze recurring timeslot', () => {
      DashboardPage.Elements.calendar1DayView
        .calendarUnavailableHourItems()
        .eq(4)
        .within(() => {
          DashboardPage.Elements.overflowMenuTrigger().click({ force: true });
        });
      DashboardPage.Elements.overflowMenuItem('Unfreeze').click({ force: true });

      DashboardPage.Elements.modal().should('exist');

      cy.intercept(
        {
          method: 'POST',
          url: '/telenutrition/api/v1/provider//slots/create/recurring',
        },
        okResponse({}),
      ).as('unfreeze-slot');

      cy.get('[data-cy="recurring-toggle"]').click();
      cy.get('[data-testid="weekCount-input"]').clear().type('3');

      cy.get('button').contains('Done').click();

      const offset =
        DateTime.now().setZone('America/New_York').offset - DateTime.now().setZone(timezone).offset;

      const expectedDate = new Date('2024-05-13T18:00:00.000Z');
      const expectedDateInTimezone = new Date(
        expectedDate.getTime() + offset * 1000 * 60,
      ).toISOString();
      cy.wait('@unfreeze-slot').its('request.body').should('deep.equal', {
        date: expectedDateInTimezone,
        weekCount: 3,
        duration: 60,
      });
    });

    it('Should show correct calendar items on previous day', () => {
      cy.getByDataTestId('single-day-calendar').within(() => {
        cy.get('[data-day="2024-05-12"]').click();
      });
      DashboardPage.Elements.calendar1DayView.calendarItems().should('have.length', 11);
      DashboardPage.Elements.calendar1DayView.calendarBookedHourItems().should('have.length', 2);
      DashboardPage.Elements.calendar1DayView
        .calendarUnavailableHourItems()
        .should('have.length', 9);
    });

    it('Should show correct calendar items on future day', () => {
      cy.getByDataTestId('single-day-calendar').within(() => {
        cy.get('[data-day="2024-05-14"]').click();
      });
      DashboardPage.Elements.calendar1DayView.calendarItems().should('have.length', 11);
      DashboardPage.Elements.calendar1DayView.calendarAvailableHourItems().should('have.length', 1);
      DashboardPage.Elements.calendar1DayView.calendarBookedHourItems().should('have.length', 1);
      DashboardPage.Elements.calendar1DayView
        .calendarUnavailableHourItems()
        .should('have.length', 9);
    });

    it('Should show correct calendar items on previous day', () => {
      cy.getByDataTestId('single-day-calendar').within(() => {
        cy.get('[data-day="2024-05-12"]').click();
      });
      DashboardPage.Elements.calendar1DayView.calendarItems().should('have.length', 11);
      DashboardPage.Elements.calendar1DayView.calendarBookedHourItems().should('have.length', 2);
      DashboardPage.Elements.calendar1DayView
        .calendarUnavailableHourItems()
        .should('have.length', 9);
    });

    it('Should show correct calendar items on future day', () => {
      cy.getByDataTestId('single-day-calendar').within(() => {
        cy.get('[data-day="2024-05-14"]').click();
      });
      DashboardPage.Elements.calendar1DayView.calendarItems().should('have.length', 11);
      DashboardPage.Elements.calendar1DayView.calendarBookedHourItems().should('have.length', 1);
      DashboardPage.Elements.calendar1DayView.calendarAvailableHourItems().should('have.length', 1);
      DashboardPage.Elements.calendar1DayView
        .calendarUnavailableHourItems()
        .should('have.length', 9);
    });

    describe('Canceling', () => {
      it('Should not allow canceling when a reason is not selected', () => {
        cy.get('[data-testid="booked-hour"]').should('be.visible').first().click();
        DashboardPage.Elements.calendarMultiDayView.bookedItems().first().click();
        DashboardPage.Elements.popoverContent().within(() => {
          cy.get('button').contains('Cancel').click();
        });

        DashboardPage.Elements.modal().should('exist');
      });

      it('Should allow 7 options when canceling appointment on today', () => {
        DashboardPage.Elements.calendar1DayView.calendarItem('10:00am').click();

        DashboardPage.Elements.popoverContent().within(() => {
          cy.get('button').contains('Cancel').click();
        });

        DashboardPage.Elements.modal().should('exist');

        cy.getByDataTestId('reason-input').type('{downarrow}');
        cy.get('[data-cy="combobox-option"]').should('have.length', 7);
        cy.get('[data-cy="combobox-option"][data-test="enabled"]').should('have.length', 6);
        cy.get('[data-cy="combobox-option"][data-test="disabled"]').should('have.length', 1);
      });

      it('Should allow 5 cancel reasons when canceling appointment in two days', () => {
        cy.getByDataTestId('single-day-calendar').within(() => {
          cy.get('[data-day="2024-05-14"]').click();
        });
        DashboardPage.Elements.calendar1DayView.calendarItem('8:00am').click();

        DashboardPage.Elements.popoverContent().within(() => {
          cy.get('button').contains('Cancel').click();
        });

        DashboardPage.Elements.modal().should('exist');

        cy.getByDataTestId('reason-input').type('{downarrow}');
        cy.get('[data-cy="combobox-option"]').should('have.length', 7);
        cy.get('[data-cy="combobox-option"][data-test="enabled"]').should('have.length', 5);
        cy.get('[data-cy="combobox-option"][data-test="disabled"]').should('have.length', 2);
      });

      // Can't open cancel modal for in-past appointments. This logic only applies opening this modal in alpha-session view
      it.skip('Should only allow reason PROVIDER_UNAVAILABLE when canceling appointment in past', () => {
        cy.getByDataTestId('single-day-calendar').within(() => {
          cy.get('[data-day="2024-05-12"]').click();
        });

        DashboardPage.Elements.calendar1DayView.calendarItem('10:00am').within(() => {
          DashboardPage.Elements.overflowMenuTrigger().click({ force: true });
        });

        DashboardPage.Elements.overflowMenuItem('Cancel session').click({ force: true });

        DashboardPage.Elements.modal().should('exist');

        cy.getByDataTestId('reason-input').type('{downarrow}');
        cy.get('[data-cy="combobox-option"]').should('have.length', 8);
        cy.get('[data-cy="combobox-option"][data-test="enabled"]').should('have.length', 1);
        cy.getByDataTestId('combobox-option-PROVIDER_UNAVAILABLE').should('not.be.disabled');
        cy.get('[data-cy="combobox-option"][data-test="disabled"]').should('have.length', 7);
      });
    });

    describe('Freezing', () => {
      beforeEach(() => {
        cy.getByDataTestId('single-day-calendar').within(() => {
          cy.get('[data-day="2024-05-14"]').click();
        });
      });

      it('Should freeze an open slot', () => {
        DashboardPage.Elements.calendar1DayView
          .calendarAvailableHourItems()
          .first()
          .within(() => {
            cy.get('[data-testid="overflow-menu-trigger"]').click({ force: true });
          });

        DashboardPage.Elements.overflowMenuItem('Freeze slot').click({ force: true });

        DashboardPage.Elements.modal().should('exist');

        cy.intercept(
          {
            method: 'PUT',
            url: '/telenutrition/api/v1/provider/slots/freeze',
          },
          okResponse({}),
        ).as('freeze-slot');

        cy.get('button').contains('Done').click();

        cy.wait('@freeze-slot')
          .its('request.body')
          .should('deep.equal', {
            appointmentIds: [1000000, 1000001],
          });
      });

      it('Should freeze recurring slots', () => {
        DashboardPage.Elements.calendar1DayView
          .calendarItem('12:00pm')
          .should('exist')
          .within(() => {
            cy.get('[data-testid="overflow-menu-trigger"]').click({ force: true });
          });

        DashboardPage.Elements.overflowMenuItem('Freeze slot').click({ force: true });

        DashboardPage.Elements.modal().should('exist');

        cy.intercept(
          {
            method: 'PUT',
            url: '/telenutrition/api/v1/provider/slots/freeze',
          },
          okResponse({}),
        ).as('freeze-slot');

        cy.get('[data-cy="recurring-toggle"]').click();
        cy.get('[data-testid="weekCount-input"]', { timeout: 10000 }).should('exist');
        cy.get('[data-testid="weekCount-input"]', { timeout: 10000 })
          .clear({ force: true })
          .type('3', { force: true });

        cy.get('button').contains('Done').click();

        cy.wait('@freeze-slot')
          .its('request.body')
          .should('deep.equal', {
            appointmentIds: [1000000, 1000001, 1000002, 1000003, 1000102, 1000103],
          });
      });
    });

    describe('Quick Scheduling', () => {
      beforeEach(() => {
        // go two days in future
        cy.getByDataTestId('single-day-calendar').within(() => {
          cy.get('[data-day="2024-05-15"]').click();
        });
      });

      it('Should correctly quick-schedule a patient with 30-minute validDuration', () => {
        const PATIENT_ID = 917757;

        DashboardPage.Elements.calendar1DayView
          .calendarAvailableHourItems()
          .first()
          .within(() => {
            cy.get('[data-testid="overflow-menu-trigger"]').click({ force: true });
          });

        DashboardPage.Elements.overflowMenuItem('Schedule session').click({ force: true });

        DashboardPage.Elements.modal().should('exist');

        cy.get('[data-testid="form-button-toggle-option"')
          .contains('min')
          .each(($option) => {
            cy.wrap($option).should('be.disabled');
          });

        cy.get('[data-testid="patient-dropdown"]', { timeout: 10000 }).should('be.visible');

        cy.get('[data-testid="patient-dropdown"]', { timeout: 10000 }).type('Con');

        cy.get('[data-testid="combobox-option-917837"]').should(
          'have.attr',
          'data-test',
          'disabled',
        );

        cy.get(`[data-testid="combobox-option-${PATIENT_ID}"]`).click();

        cy.get('[data-testid="session-type-button-toggle"]>button').first().click();

        cy.get('[data-testid="modal-root"]').within(() => {
          cy.get('form').submit();
        });

        cy.get('div').contains('30 minutes').should('exist');

        cy.intercept('POST', '/telenutrition/api/v1/provider/appointments', okResponse({})).as(
          'book-appointment',
        );

        cy.get('[data-testid="modal-root"]').within(() => {
          cy.get('form').submit();
        });

        cy.wait('@book-appointment')
          .its('request.body.state')
          .should('contain', {
            patient_id: PATIENT_ID,
            audio_only: false,
          })
          .its('appointment_ids')
          .should('be.an', 'array')
          .should('have.length', 1);
      });

      it('Should correctly quick-schedule a patient with 60-minute validDuration', () => {
        const PATIENT_ID = 917460;

        cy.get('[data-testid="available-hour"]')
          .first()
          .within(() => {
            cy.get('[data-testid="overflow-menu-trigger"]').click({ force: true });
          });

        cy.get('[data-testid="dropdown-menu-item"]').contains('Schedule session').click();

        cy.get('[data-testid="modal-root"]').should('exist');

        cy.get('[data-testid="form-button-toggle-option"')
          .contains('min')
          .each(($option) => {
            cy.wrap($option).should('be.disabled');
          });

        cy.get('[data-testid="patient-dropdown"]', { timeout: 10000 }).should('be.visible');

        cy.get('[data-testid="patient-dropdown"]', { timeout: 10000 }).type('Con');

        cy.get(`[data-testid="combobox-option-${PATIENT_ID}"]`).click();

        cy.get('[data-testid="session-type-button-toggle"]>button').first().click();

        cy.get('[data-testid="modal-root"]').within(() => {
          cy.get('form').submit();
        });

        cy.get('div').contains('60 minutes').should('exist');

        cy.intercept('POST', '/telenutrition/api/v1/provider/appointments', okResponse({})).as(
          'book-appointment',
        );

        cy.get('[data-testid="modal-root"]').within(() => {
          cy.get('form').submit();
        });

        cy.wait('@book-appointment')
          .its('request.body.state')
          .should('contain', {
            patient_id: PATIENT_ID,
            audio_only: false,
          })
          .its('appointment_ids')
          .should('be.an', 'array')
          .should('have.length', 2);
      });

      it('Should allow quick-schedule a patient with 30 or 60 minutes validDurations to choose own duration', () => {
        const PATIENT_ID = 917515;

        cy.get('[data-testid="available-hour"]')
          .first()
          .within(() => {
            DashboardPage.Elements.overflowMenuTrigger().click({ force: true });
          });

        DashboardPage.Elements.overflowMenuItem('Schedule session').click();

        DashboardPage.Elements.modal().should('exist');

        cy.get('[data-testid="form-button-toggle-option"')
          .contains('min')
          .each(($option) => {
            return cy.wrap($option).should('be.disabled');
          });

        cy.get('[data-testid="patient-dropdown"]').type('Co');

        cy.get(`[data-testid="combobox-option-${PATIENT_ID}"]`).click();

        cy.get('[data-testid="form-button-toggle-option"')
          .contains('min')
          .each(($option) => {
            return cy.wrap($option).should('not.be.disabled');
          });

        cy.get('[data-testid="session-type-button-toggle"]>button').first().click();

        cy.get('[data-testid="session-duration-button-toggle"]')
          .contains('30')
          .click()
          .should('have.attr', 'data-cy', 'selected-true');

        cy.get('[data-testid="modal-root"]').within(() => {
          cy.get('form').submit();
        });

        cy.get('div').contains('30 minutes').should('exist');

        cy.intercept('POST', '/telenutrition/api/v1/provider/appointments', okResponse({})).as(
          'book-appointment',
        );

        cy.get('[data-testid="modal-root"]').within(() => {
          cy.get('form').submit();
        });

        cy.wait('@book-appointment')
          .its('request.body.state')
          .should('contain', {
            patient_id: PATIENT_ID,
            audio_only: false,
          })
          .its('appointment_ids')
          .should('be.an', 'array')
          .should('have.length', 1);
      });
    });

    describe('Oversight', () => {
      it('Should show appointment with status 3 and encounterStatus oversight correctly', () => {
        DashboardPage.Elements.calendar1DayView.calendarItem('4:00pm').click();

        DashboardPage.Elements.popoverContent().within(() => {
          cy.getByDataTestId('banner-appointment-oversight').should('exist');
          cy.get('button').contains('View chart').should('exist');
        });
      });

      it('should show appointment status 3 and encounterStatus provider_response_required correctly', () => {
        cy.getByDataTestId('single-day-calendar').within(() => {
          cy.get('[data-day="2024-05-12"]').click();
        });
        DashboardPage.Elements.calendar1DayView.calendarItem('4:00pm').click();

        DashboardPage.Elements.popoverContent().within(() => {
          cy.getByDataTestId('banner-appointment-provider-response-required').should('exist');
          cy.get('button').contains('Update chart').should('exist');
        });
      });
    });

    describe('Conflicting and Needs Updating Appointments', () => {
      it('Should show a conflicting appointment cell and cancel one of them correctly', () => {
        cy.getByDataTestId('single-day-calendar').within(() => {
          cy.get('[data-day="2024-05-16"]').click();
        });
        DashboardPage.Elements.calendar1DayView
          .calendarConflictingHourItems()
          .should('have.length', 2)
          .first()
          .within(() => {
            cy.get('button').contains('Fix').should('exist').click();
          });

        DashboardPage.Elements.modal().should('exist');
        DashboardPage.Elements.modal().within(() => {
          cy.get(`[data-testid^="reschedule-appointment-"]`).should('have.length', 2);
          cy.get(`[data-testid^="cancel-appointment-"]`).should('have.length', 2);

          cy.get(`[data-testid^="cancel-appointment-"]`)
            .eq(0)
            .invoke('attr', 'data-testid')
            .then((dataTestId) => {
              const appointmentId = _.last(dataTestId?.split('-'));
              cy.intercept(
                {
                  method: 'PUT',
                  url: `/telenutrition/api/v1/scheduling/appointments/${appointmentId}/cancel`,
                },
                // This tecnically responds with updated appointment, but we don't use it, so leave blank for now
                okResponse({}),
              ).as('cancel');
              cy.get(`[data-testid^="cancel-appointment-"]`).eq(0).click();
              cy.get(`button`).contains('Ok').click();

              cy.wait('@cancel');
            });
        });
      });

      it('Should show a conflicting modal and reschedule one of them correctly', () => {
        cy.getByDataTestId('single-day-calendar').within(() => {
          cy.get('[data-day="2024-05-16"]').click();
        });
        DashboardPage.Elements.calendar1DayView
          .calendarConflictingHourItems()
          .should('have.length', 2)
          .first()
          .within(() => {
            cy.get('button').contains('Fix').should('exist').click();
          });

        DashboardPage.Elements.modal().should('exist');
        DashboardPage.Elements.modal().within(() => {
          cy.get(`[data-testid^="reschedule-appointment-"]`).should('have.length', 2);
          cy.get(`[data-testid^="reschedule-appointment-"]`).should('have.length', 2);

          cy.get(`[data-testid^="reschedule-appointment-"]`)
            .eq(0)
            .invoke('attr', 'data-testid')
            .then((dataTestId) => {
              const appointmentId = _.last(dataTestId?.split('-'));
              cy.intercept(
                {
                  method: 'PUT',
                  url: `/telenutrition/api/v1/scheduling/appointments/reschedule`,
                },
                // This tecnically responds with updated appointment, but we don't use it, so leave blank for now
                okResponse({}),
              ).as('reschedule');
              cy.get(`[data-testid^="reschedule-appointment-"]`).eq(0).click();
              DashboardPage.Elements.dateNavigator.right().click().click().click();
              DashboardPage.Elements.rescheduleOption('10:00').scrollIntoView().click();
              cy.get('form').submit();
              cy.wait('@reschedule').then((interception) => {
                const body = interception.request.body;
                expect(body).to.contain({
                  cancelReason: 'PROVIDER_UNAVAILABLE',
                });
                expect(body)
                  .to.have.property('newAppointmentIds')
                  .and.be.an('array')
                  .and.have.length(2);
                expect(body).to.have.property('oldAppointmentId').and.equal(Number(appointmentId));
              });
            });
        });
      });

      it('Should show a needs updating appointment cell correctly and open reschedule modal', () => {
        cy.getByDataTestId('single-day-calendar').within(() => {
          cy.get('[data-day="2024-05-12"]').click();
        });
        DashboardPage.Elements.calendar1DayView
          .calendarNeedsUpdatingHourItems()
          .should('have.length', 1)
          .click();

        DashboardPage.Elements.popoverContent().within(() => {
          cy.get('button').contains('Reschedule').should('exist').click();
        });

        DashboardPage.Elements.modal().should('exist');
      });

      it('Should show conflicting open slots with booked slots', () => {
        cy.getByDataTestId('single-day-calendar').within(() => {
          cy.get('[data-day="2024-05-16"]').click();
        });
        DashboardPage.Elements.calendar1DayView
          .calendarConflictingHourItems()
          .should('have.length', 2)
          .eq(1)
          .within(() => {
            cy.get('button').contains('Fix').should('exist').click();
          });

        DashboardPage.Elements.byDataTestId('open-slot-row')
          .should('have.length', 2)
          .first()
          .within(() => {
            cy.get('button').contains('Block').should('exist').click();
          });

        cy.intercept(
          {
            method: 'PUT',
            url: '/telenutrition/api/v1/provider/slots/freeze',
          },
          okResponse({}),
        ).as('freeze');

        cy.get('[data-test="secondary-modal"]')
          .should('exist')
          .within(() => {
            cy.get('button').contains('Done').click();
          });

        cy.wait('@freeze').then((interception) => {
          const body = interception.request.body;
          expect(body).to.have.property('appointmentIds').and.be.an('array').and.have.length(1);
        });

        cy.get('[data-test="secondary-modal"]').should('not.exist');
      });
    });

    describe('TaskList', () => {
      beforeEach(() => {
        cy.turnOnFeatureFlag('provider_dashboard_0_9_improvements_DEV_16908');
        cy.reload();
      });

      it('Should show 3 auto-generated tasks and one custom task', () => {
        DashboardPage.Elements.taskListContainer().should('exist');
        DashboardPage.Elements.taskListItem().should('have.length', 4).first().click();

        DashboardPage.Elements.modal().should('exist');
      });

      it('Should open a modal showing appointment info for an appt needing more information', () => {
        DashboardPage.Elements.taskListItem()
          .get('[data-test="incomplete-appointment"]')
          .eq(2)
          .click();

        DashboardPage.Elements.modal().should('exist');

        DashboardPage.Elements.dataDislpay().should('have.length', 4);

        DashboardPage.Elements.dataDislpay()
          .getByDataTest('content')
          .eq(0)
          .should('contain.text', 'Please contact');
      });

      it('Should open a modal showing a custom task', () => {
        DashboardPage.Elements.taskListItem().get('[data-test="custom-task"]').first().click();

        DashboardPage.Elements.modal().should('exist');
      });

      // this feature has been abandoned and would need to be updated
      it.skip('Should allow adding a new task', () => {
        cy.getByDataTestId('open-add-task-modal').should('exist').click();

        const task = {
          name: 'Important task number 2',
          note: 'Some note that goes with this task',
          priority: 'low',
        };

        DashboardPage.Elements.modal()
          .should('exist')
          .within(() => {
            cy.getByDataTestId('name-input').type(task.name);
            cy.getByDataTestId('note-input').type(task.note);

            cy.getByDataTestId(`priority_${task.priority}-radio`).click();

            cy.intercept(
              {
                method: 'POST',
                url: '/telenutrition/api/v1/provider/tasks',
              },
              okResponse({}),
            ).as('create-task');

            cy.get('button[type="submit"]').click();

            cy.wait('@create-task').then((interception) => {
              const body = interception.request.body;
              expect(body).to.deep.equal({
                task: {
                  name: task.name,
                  note: task.note,
                  priority: task.priority,
                },
              });
            });
          });
      });

      it(
        'Should open correct modal selecting "physician review needs attention" task',
        {
          defaultCommandTimeout: 10000,
        },
        () => {
          DashboardPage.Elements.taskListContainer().should('exist');
          DashboardPage.Elements.taskListItem().should('have.length', 4).first().click();

          DashboardPage.Elements.modal()
            .should('exist')
            .within(() => {
              cy.get('h4').contains('Physician Review needs attention').should('exist');
              DashboardPage.Elements.dataDislpay()
                .eq(0)
                .contains('Please review this encounter, therre are some mistakes in the billing.')
                .should('exist');

              cy.get('button').contains('Go to chart').should('exist').click();
            });

          cy.url().should('contain', '/meeting');
        },
      );
    });

    describe('7-day calendar view', () => {
      beforeEach(() => {
        DashboardPage.Elements.viewTypeToggle().within(() => {
          // assumes second option is 7-day
          cy.get('button').eq(1).click();
        });
      });

      it('Should show the 7-day calendar view correctly', () => {
        DashboardPage.Elements.calendarMultiDayView.availableItems().should('have.length', 3);
        DashboardPage.Elements.calendarMultiDayView.bookedItems().should('have.length', 8);
        DashboardPage.Elements.calendarMultiDayView.conflictingItems().should('have.length', 3);
        DashboardPage.Elements.calendarMultiDayView.unavailableItems().should('have.length', 63);
      });

      it('Should open reschedule modal from overflow menu on popover card', () => {
        DashboardPage.Elements.calendarMultiDayView
          .bookedItems()
          .get('[data-test="05/13/2024 09:00"]')
          .click();

        DashboardPage.Elements.popoverContent().within(() => {
          DashboardPage.Elements.overflowMenuTrigger().click();
        });

        DashboardPage.Elements.overflowMenuItem('Reschedule').click();

        DashboardPage.Elements.modal().should('exist');
      });

      it('Should show conflicts correctly and popover, allow opening resolving modal', () => {
        DashboardPage.Elements.calendarMultiDayView
          .conflictingItems()
          .get('[data-test="05/15/2024 08:00"]')
          .click();

        DashboardPage.Elements.popoverContent()
          .should('exist')
          .within(() => {
            cy.get('button').contains('Fix').click();
          });

        DashboardPage.Elements.modal().should('exist');
      });

      it('Should navigate 7 days back and show correct days', () => {
        DashboardPage.Elements.dateNavigator.left().click({ force: true });

        DashboardPage.Elements.calendarMultiDayView
          .calendarColumnHeader('05/05/2024')
          .should('exist');
        DashboardPage.Elements.calendarMultiDayView
          .calendarColumnHeader('05/06/2024')
          .should('exist');
        DashboardPage.Elements.calendarMultiDayView
          .calendarColumnHeader('05/07/2024')
          .should('exist');
        DashboardPage.Elements.calendarMultiDayView
          .calendarColumnHeader('05/08/2024')
          .should('exist');
        DashboardPage.Elements.calendarMultiDayView
          .calendarColumnHeader('05/09/2024')
          .should('exist');
        DashboardPage.Elements.calendarMultiDayView
          .calendarColumnHeader('05/10/2024')
          .should('exist');
        DashboardPage.Elements.calendarMultiDayView
          .calendarColumnHeader('05/11/2024')
          .should('exist');
      });
    });

    describe('Auto-scroll', () => {
      it('Should auto-scroll to current hour', () => {
        DashboardPage.Elements.calendar1DayView.calendarItem('7:00am').isWithinViewport();
      });

      it('Should auto-scroll to current hour if hour is later', () => {
        cy.clock(now.plus({ hours: 5 }).toJSDate(), ['Date']);
        cy.reload();
        DashboardPage.Elements.calendar1DayView.calendarItem('12:00pm').isWithinViewport();
      });
    });

    let bookableSlotStartTimestamp: DateTime,
      bookableSlot2StartTimestamp: DateTime,
      bookableSlot3StartTimestamp: DateTime;

    describe('Overbooking', () => {
      // TODO need to add tests for when API responds with error that slot was already taken.
      // TODO: should nav to encounter page after booking clicking the button

      bookableSlotStartTimestamp = now.plus({ days: 2 }).startOf('day').set({ hour: 9 }).toUTC();
      bookableSlot2StartTimestamp = now.plus({}).startOf('day').set({ hour: 12 }).toUTC();
      bookableSlot3StartTimestamp = now.plus({}).startOf('day').set({ hour: 8 }).toUTC();
      beforeEach(() => {
        cy.intercept(
          {
            method: 'GET',
            url: '/telenutrition/api/v1/provider/overbooking/slots',
          },
          okResponse<FetchProviderOverbookingSlotsResult>({
            vacancies: [
              {
                startTimestamp: bookableSlotStartTimestamp.toISO()!,
                duration: 60,
                count: 1,
              },
              {
                startTimestamp: bookableSlot2StartTimestamp.toISO()!,
                duration: 60,
                count: 1,
              },
              {
                startTimestamp: bookableSlot3StartTimestamp.toISO()!,
                duration: 60,
                count: 1,
              },
            ],
          }),
        );
      });

      describe('1-day view', () => {
        it('should fill an open slot', () => {
          cy.intercept(
            {
              method: 'POST',
              url: '/telenutrition/api/v1/provider/overbooking/slots',
            },
            okResponse<AppointmentRecord>(
              createAppointmentRecord({
                dateTime: bookableSlot2StartTimestamp,
                provider: provider,
                patient: patient,
              }),
            ),
          ).as('post-overbooking-slots');
          cy.get('[data-day="2024-05-15"').click();

          cy.getByDataTestId('overflow-indicator').should('have.length', 1);

          const timeString = bookableSlotStartTimestamp
            .setZone(timezone)
            .toFormat('h:mma')
            .toLowerCase();

          DashboardPage.Elements.calendar1DayView
            .calendarItem(timeString as '9:00am')
            .within(() => {
              DashboardPage.Elements.overflowMenuTrigger().click({ force: true });
            });
          cy.getByDataTestId('dropdown-menu-item').contains('Fill on demand').click();

          cy.wait('@post-overbooking-slots').then((interception) => {
            const body = interception.request.body;
            expect(body).to.deep.equal({
              duration: 60,
              startTimestamp: bookableSlotStartTimestamp.toISO(),
            });
          });
        });

        it('should fill an closed slot', () => {
          cy.intercept(
            {
              method: 'POST',
              url: '/telenutrition/api/v1/provider/overbooking/slots',
            },
            okResponse<AppointmentRecord>(
              createAppointmentRecord({
                dateTime: bookableSlot2StartTimestamp,
                provider: provider,
                patient: patient,
              }),
            ),
          ).as('post-overbooking-slots');

          const timeString = bookableSlot2StartTimestamp
            .setZone(timezone)
            .toFormat('h:mma')
            .toLowerCase();

          DashboardPage.Elements.calendar1DayView
            .calendarItem(timeString as '9:00am')
            .within(() => {
              DashboardPage.Elements.overflowMenuTrigger().click({ force: true });
            });
          cy.getByDataTestId('dropdown-menu-item').contains('Fill on demand').click();

          cy.wait('@post-overbooking-slots').then((interception) => {
            const body = interception.request.body;
            expect(body).to.deep.equal({
              duration: 60,
              fromFrozen: true,
              startTimestamp: bookableSlot2StartTimestamp.toISO(),
            });
          });
        });

        describe('30 minute', () => {
          const bookable30MinSlotTimestamp = now
            .plus({ days: 1 })
            .startOf('day')
            .set({ hour: 8 })
            .toUTC();
          const bookable30MinSlot2Timestamp = now
            .plus({ days: 2 })
            .startOf('day')
            .set({ hour: 9, minute: 30 })
            .toUTC();

          beforeEach(() => {
            cy.intercept(
              {
                method: 'GET',
                url: '/telenutrition/api/v1/provider/overbooking/slots',
              },
              okResponse<FetchProviderOverbookingSlotsResult>({
                vacancies: [
                  {
                    startTimestamp: bookableSlotStartTimestamp.toISO()!,
                    duration: 60,
                    count: 1,
                  },
                  {
                    startTimestamp: bookable30MinSlotTimestamp.toISO()!,
                    duration: 30,
                    count: 1,
                  },
                  {
                    startTimestamp: bookable30MinSlot2Timestamp.toISO()!,
                    duration: 30,
                    count: 1,
                  },
                ],
              }),
            );
          });
          it('should show correct 30 minute vacancies', () => {
            DashboardPage.Elements.byDataTestId('tabs-trigger').contains('On Demand').click();

            DashboardPage.Elements.byDataTestId('on-demand-slot').should('have.length', 0);
            cy.get('[data-day="2024-05-15"]').click();
            cy.getByDataTestId('overflow-indicator').should('have.length', 2);

            cy.get('[data-day="2024-05-13"]').click();
            cy.getByDataTestId('overflow-indicator').should('have.length', 0);

            cy.get('[data-day="2024-05-14"]').click();
            cy.getByDataTestId('overflow-indicator').should('have.length', 0);
          });

          it('should book 30 minute slot', () => {
            cy.intercept(
              {
                method: 'POST',
                url: '/telenutrition/api/v1/provider/overbooking/slots',
              },
              okResponse<AppointmentRecord>(
                createAppointmentRecord({
                  dateTime: bookableSlot2StartTimestamp,
                  provider: provider,
                  patient: patient,
                }),
              ),
            ).as('post-overbooking-slots');

            cy.get('[data-day="2024-05-15"]').click();

            const timeString = bookable30MinSlot2Timestamp
              .setZone(timezone)
              .set({ minute: 0 })
              .toFormat('h:mma')
              .toLowerCase();

            DashboardPage.Elements.calendar1DayView
              .calendarItem(timeString as '9:00am')
              .within(() => {
                DashboardPage.Elements.overflowMenuTrigger().eq(1).click({ force: true });
              });
            cy.getByDataTestId('dropdown-menu-item').contains('Fill on demand').click();

            cy.wait('@post-overbooking-slots').then((interception) => {
              const body = interception.request.body;
              expect(body).to.deep.equal({
                duration: 30,
                startTimestamp: bookable30MinSlot2Timestamp.toISO(),
              });
            });
          });
        });
      });

      describe('7-day view', () => {
        beforeEach(() => {
          DashboardPage.Elements.viewTypeToggle().within(() => {
            // assumes second option is 7-day
            cy.get('button').eq(1).click();
          });
        });

        it('should fill an open slot', () => {
          cy.intercept(
            {
              method: 'POST',
              url: '/telenutrition/api/v1/provider/overbooking/slots',
            },
            okResponse<AppointmentRecord>(
              createAppointmentRecord({
                dateTime: bookableSlot2StartTimestamp,
                provider: provider,
                patient: patient,
              }),
            ),
          ).as('post-overbooking-slots');

          cy.getByDataTestId('overflow-indicator').should('have.length', 2);

          const CELL_TEST_ID = bookableSlotStartTimestamp
            .setZone(timezone)
            .toFormat('LL/dd/yyyy HH:mm');

          cy.getByDataTest(CELL_TEST_ID).within(() => {
            DashboardPage.Elements.overflowMenuTrigger().click({ force: true });
          });
          cy.getByDataTestId('dropdown-menu-item').contains('Fill on demand').click();

          cy.wait('@post-overbooking-slots').then((interception) => {
            const body = interception.request.body;
            expect(body).to.deep.equal({
              duration: 60,
              startTimestamp: bookableSlotStartTimestamp.toISO(),
            });
          });
        });

        it('should fill an closed slot', () => {
          cy.intercept(
            {
              method: 'POST',
              url: '/telenutrition/api/v1/provider/overbooking/slots',
            },
            okResponse<AppointmentRecord>(
              createAppointmentRecord({
                dateTime: bookableSlot2StartTimestamp,
                provider: provider,
                patient: patient,
              }),
            ),
          ).as('post-overbooking-slots');

          const CELL_TEST_ID = bookableSlot2StartTimestamp
            .setZone(timezone)
            .toFormat('LL/dd/yyyy HH:mm');

          cy.getByDataTest(CELL_TEST_ID).within(() => {
            DashboardPage.Elements.overflowMenuTrigger().click({ force: true });
          });
          cy.getByDataTestId('dropdown-menu-item').contains('Fill on demand').click();

          cy.wait('@post-overbooking-slots').then((interception) => {
            const body = interception.request.body;
            expect(body).to.deep.equal({
              duration: 60,
              fromFrozen: true,
              startTimestamp: bookableSlot2StartTimestamp.toISO(),
            });
          });
        });

        describe('30 minute', () => {
          const bookable30MinSlotTimestamp = now
            .plus({ days: 1 })
            .startOf('day')
            .set({ hour: 8 })
            .toUTC();
          const bookable30MinSlot2Timestamp = now
            .plus({ days: 2 })
            .startOf('day')
            .set({ hour: 9, minute: 30 })
            .toUTC();

          beforeEach(() => {
            cy.intercept(
              {
                method: 'GET',
                url: '/telenutrition/api/v1/provider/overbooking/slots',
              },
              okResponse<FetchProviderOverbookingSlotsResult>({
                vacancies: [
                  {
                    startTimestamp: bookableSlotStartTimestamp.toISO()!,
                    duration: 60,
                    count: 1,
                  },
                  {
                    startTimestamp: bookable30MinSlotTimestamp.toISO()!,
                    duration: 30,
                    count: 1,
                  },
                  {
                    startTimestamp: bookable30MinSlot2Timestamp.toISO()!,
                    duration: 30,
                    count: 1,
                  },
                ],
              }),
            );
          });
          it('should show correct 30 minute vacancies', () => {
            DashboardPage.Elements.byDataTestId('tabs-trigger').contains('On Demand').click();

            DashboardPage.Elements.byDataTestId('on-demand-slot').should('have.length', 2);
            cy.getByDataTestId('overflow-indicator').should('have.length', 2);
          });

          it('should book 30 minute slot', () => {
            cy.intercept(
              {
                method: 'POST',
                url: '/telenutrition/api/v1/provider/overbooking/slots',
              },
              okResponse<AppointmentRecord>(
                createAppointmentRecord({
                  dateTime: bookableSlot2StartTimestamp,
                  provider: provider,
                  patient: patient,
                  duration: 30,
                }),
              ),
            ).as('post-overbooking-slots');

            cy.reload();

            cy.getByDataTestId('overflow-indicator').should('have.length', 2);

            const CELL_TEST_ID = bookable30MinSlot2Timestamp
              .set({ minute: 0 })
              .setZone(timezone)
              .toFormat('LL/dd/yyyy HH:mm');

            cy.getByDataTest(CELL_TEST_ID).within(() => {
              DashboardPage.Elements.overflowMenuTrigger().eq(1).click({ force: true });
            });
            cy.getByDataTestId('dropdown-menu-item').contains('Fill on demand').click();

            cy.wait('@post-overbooking-slots').then((interception) => {
              const body = interception.request.body;
              console.log('bodybobo', body, bookable30MinSlot2Timestamp);
              expect(body).to.deep.equal({
                duration: 30,
                startTimestamp: bookable30MinSlot2Timestamp.toISO(),
              });
            });
          });

          describe('side panel', () => {
            it('should show all slots on side panel', () => {
              cy.intercept(
                {
                  method: 'POST',
                  url: '/telenutrition/api/v1/provider/overbooking/slots',
                },
                okResponse<AppointmentRecord>(
                  createAppointmentRecord({
                    dateTime: bookableSlot2StartTimestamp,
                    provider: provider,
                    patient: patient,
                  }),
                ),
              ).as('post-overbooking-slots');

              DashboardPage.Elements.byDataTestId('tabs-trigger').contains('On Demand').click();
              DashboardPage.Elements.byDataTestId('on-demand-slot').should('have.length', 2);

              DashboardPage.Elements.byDataTestId('on-demand-slot').contains(
                bookableSlotStartTimestamp.setZone(timezone).toLocaleString(DateTime.TIME_SIMPLE),
              );
              DashboardPage.Elements.byDataTestId('on-demand-slot').contains(
                bookableSlot2StartTimestamp.setZone(timezone).toLocaleString(DateTime.TIME_SIMPLE),
              );

              cy.getByDataTestId('on-demand-slot')
                .filter(
                  `:contains("${bookableSlot2StartTimestamp.setZone(timezone).toLocaleString(DateTime.TIME_SIMPLE)}")`,
                )
                .within(() => {
                  cy.getByDataTestId('fill-on-demand-button').click({ force: true });
                });
              cy.wait('@post-overbooking-slots').then((interception) => {
                const body = interception.request.body;
                expect(body).to.deep.equal({
                  duration: 60,
                  fromFrozen: true,
                  startTimestamp: bookableSlot2StartTimestamp.toISO(),
                });
              });
            });
          });
        });
      });
    });
  });
}

runDashboardTests('America/New_York');
runDashboardTests('Pacific/Honolulu');
