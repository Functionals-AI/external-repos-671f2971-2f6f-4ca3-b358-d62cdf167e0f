import { DateTime } from 'luxon';

import type { ProviderRecord } from '@mono/telenutrition/lib/types';
import { getTimezoneName } from '@/features/provider/profile/view/tabs/utils';
import { PatchProviderAppointmentsResult } from 'api/provider/usePatchProviderProfile';
import { setupProviderFixutre1 } from '../../../mocks/provider-fixture-1';
import { okResponse } from '../../../mocks/responses';

const timezone = 'America/Los_Angeles';

const now = DateTime.fromFormat('05/13/2024', 'LL/dd/yyyy', { zone: timezone })
  .startOf('day')
  .plus({ hour: 8, minutes: 25 });

describe('Provider Profile', () => {
  let provider: ProviderRecord, provider1: ProviderRecord;

  beforeEach(() => {
    const fixture = setupProviderFixutre1({ timezone, now });
    provider = fixture.provider;
    provider1 = fixture.provider1;

    cy.clock(now.toJSDate(), ['Date']);

    cy.visit('/schedule/provider/profile');
  });

  it('Should navigate to profile view when avatar is clicked', () => {
    cy.visit('/schedule/provider/dashboard');

    cy.get('[data-testid="profile-avatar"]').click();

    cy.url().should('contain', 'provider/profile');
  });

  it('Should display provider information', () => {
    const providerInfo = cy.getByDataTestId('provider-info');
    providerInfo.should('exist');
    providerInfo.getByDataTestId('provider-email').should('contain', 'work_email@g.com');
    providerInfo.getByDataTestId('provider-home-phone').should('contain', '+1 (144) 555 - 1422');
    providerInfo
      .getByDataTestId('provider-timezone')
      .should('contain', `${getTimezoneName(timezone)} Timezone`);
    providerInfo.getByDataTestId('provider-languages').should('contain', 'English');
    providerInfo.getByDataTestId('provider-languages').should('contain', 'Spanish');
    providerInfo.getByDataTestId('provider-pediatrics').should('contain', 'Ages 14+ only');
    providerInfo.getByDataTestId('provider-pediatrics').should('contain', 'Ages 14+ only');
    providerInfo.getByDataTestId('provider-specialties').should('contain', 'Allergies');
    providerInfo.getByDataTestId('provider-specialties').should('contain', 'Cardiology');
    providerInfo.getByDataTestId('provider-biography').should('contain', 'Anta Baka');
  });
  describe('edit', () => {
    beforeEach(() => {
      cy.get('button').contains('Update').click();

      cy.url().should('contain', 'provider/profile/edit');
    });

    it('can edit profile', () => {
      cy.getByDataTestId('timezone-input').click();
      cy.get('[data-testid="select-option-America/Denver"]').click();
      cy.getByDataTestId('languages-input').within(() => {
        cy.getByDataTestId('tag-input-badge')
          .first()
          .within(() => cy.get('button').click());
      });
      cy.getByDataTestId('languages-input').within(() => {
        cy.getByDataTestId('tag-input-badge')
          .first()
          .within(() => cy.get('button').click());
      });
      cy.getByDataTestId('languages-input').within(() => {
        cy.getByDataTestId('tag-input-badge').should('have.length', 0);
      });

      cy.getByDataTestId('languages-input').click();
      cy.getByDataTestId('tag-input-item').contains('Mandarin').click();
      cy.getByDataTestId('languages-input').click();
      cy.getByDataTestId('tag-input-item').contains('Cantonese').click();
      cy.get('body').type('{esc}');

      cy.getByDataTestId('minPatientAge-input').click();
      cy.get('[data-testid="select-option-2"]').click();

      cy.getByDataTestId('specialtyIds-input').within(() => {
        cy.getByDataTestId('tag-input-badge')
          .first()
          .within(() => cy.get('button').click());
      });

      cy.getByDataTestId('specialtyIds-input').within(() => {
        cy.getByDataTestId('tag-input-badge')
          .first()
          .within(() => cy.get('button').click());
      });

      cy.getByDataTestId('specialtyIds-input').click();
      cy.getByDataTestId('tag-input-item').contains('Geriatrics').click();
      cy.getByDataTestId('specialtyIds-input').click();
      cy.getByDataTestId('tag-input-item').contains('Renal').click();
      cy.get('body').type('{esc}');

      cy.getByDataTestId('bio-input').should('have.value', 'Anta Baka');
      cy.getByDataTestId('bio-input').clear();
      cy.getByDataTestId('bio-input').type('Meowooo');

      cy.intercept(
        {
          method: 'PATCH',
          url: '/telenutrition/api/v1/provider/me',
        },
        okResponse<PatchProviderAppointmentsResult>({ result: true }),
      ).as('update-profile');

      cy.get('button').contains('Save changes').click();
      cy.wait('@update-profile').then((interception) => {
        const body = interception.request.body;
        expect(body).to.deep.equal({
          languages: ['cmn', 'yue'],
          specialtyIds: ['geriatrics', 'renal'],
          timezone: 'America/Denver',
          bio: 'Meowooo',
          minPatientAge: 2,
        });
      });

      cy.contains('Successfully updated!');
      cy.url().should('not.contain', 'edit');
      cy.url().should('contain', 'provider/profile');
    });

    it('handles failed updates correctly', () => {
      cy.intercept(
        {
          method: 'PATCH',
          url: '/telenutrition/api/v1/provider/me',
        },
        {
          statusCode: 400,
        },
      ).as('update-profile');

      cy.get('button').contains('Save changes').click();

      cy.contains('Failed to update provider');
      cy.url().should('contain', 'provider/profile/edit');
    });
  });
});
