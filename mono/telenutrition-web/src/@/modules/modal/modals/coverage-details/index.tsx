import { Trans, useTranslation } from 'react-i18next';

import Modal from '@/modules/modal/ui/modal';
import Section, { SectionDivider } from '@/ui-components/section';
import DataCard from '@/ui-components/data-card';
import { CoverageDetailsModalData } from '../../types';
import CoverageCard from './components/coverage-card';
import { Badge } from '@/ui-components/badge';

export default function CoverageDetailsModal({ paymentMethod }: CoverageDetailsModalData) {
  const { t } = useTranslation();

  const coverage = paymentMethod.coverage;

  const limitText = coverage?.limit
    ? t('{{remaining}} of {{limit}} remaining', {
        remaining: coverage.remaining,
        limit: coverage.limit,
      })
    : 'Unlimited';

  return (
    <Modal size="md">
      <Modal.Header title={<Trans>Details</Trans>} />
      <Modal.Body>
        <Section title={t('Coverage')}>
          <div className="flex">
            <div>
              {paymentMethod.type.label}
              {!!paymentMethod.memberId && (
                <p className="text-neutral-700 text-sm mb-1">ID: {paymentMethod.memberId}</p>
              )}
            </div>
            {paymentMethod.isValid && (
              <div data-testid="detail-active-badge">
                <Badge className="ml-1" variant="statusGreen">
                  Active
                </Badge>
              </div>
            )}
          </div>
        </Section>

        <SectionDivider />
        <Section title={t('Details')}>
          <DataCard
            dataTestId="visits-available"
            data={[
              {
                type: 'data',
                label: 'Visits available',
                value: limitText,
              },
            ]}
          />
          <h4 className="text-lg font-semibold mb-2 text-neutral-600">
            <Trans>Initial visit</Trans>
          </h4>
          <CoverageCard dataTestId="initial-visit-card" paymentMethod={paymentMethod} />

          <h4 className="text-lg font-semibold mb-2 text-neutral-600">
            <Trans>Followup visit</Trans>
          </h4>
          <CoverageCard
            dataTestId="followup-visit-card"
            paymentMethod={paymentMethod}
            isFollowUp
          />
        </Section>
      </Modal.Body>
    </Modal>
  );
}
