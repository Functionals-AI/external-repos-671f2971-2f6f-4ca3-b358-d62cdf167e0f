import { Trans, useTranslation } from 'react-i18next';

import { PatientPaymentMethod } from 'api/types';
import { useModal } from '@/modules/modal';
import { Badge } from '@/ui-components/badge';
import { Button } from '@/ui-components/button';
import Card from '@/ui-components/card';

interface Props {
  paymentMethod: PatientPaymentMethod;
  isPrimary?: boolean;
  showInfo?: boolean;
  dataTestId: string;
}

export default function CoverageCard({ paymentMethod, isPrimary, showInfo, dataTestId }: Props) {
  const { t } = useTranslation();
  const modal = useModal();

  const { coverage } = paymentMethod;

  const limitText = coverage?.limit
    ? t('{{remaining}} of {{limit}} remaining', {
        remaining: coverage.remaining,
        limit: coverage.limit,
      })
    : 'Unlimited';

  return (
    <Card dataTestId={dataTestId} className="max-w-[30rem] w-full">
      <Card.Header className="bg-white flex justify-between">
        <div className="flex flex-col">
          <h3 className="text-base">{paymentMethod.type.label}</h3>
          {!!paymentMethod.memberId && (
            <p className="text-neutral-700 text-sm mb-1">ID: {paymentMethod.memberId}</p>
          )}
          <div className="flex gap-x-2">
            {isPrimary && (
              <Badge variant="blue">
                <Trans>Primary</Trans>
              </Badge>
            )}
            {paymentMethod.isValid && (
              <div data-testid="active-badge">
                <Badge variant="statusGreen">Active</Badge>
              </div>
            )}
          </div>
        </div>
        <div>
          <Button
            onClick={() => {
              modal.openPrimary({
                type: 'coverage-details',
                paymentMethod,
                showCloseButton: true,
              });
            }}
            className="text-fs-green-600 m-2"
            variant="tertiary"
            size="sm"
          >
            <Trans>Details</Trans>
          </Button>
        </div>
      </Card.Header>
      {showInfo && (
        <Card.Row className="border-t border-t-neutral-150">
          <Card.Row.Label className="px-4 py-4 w-32">
            <Trans>Visits available</Trans>
          </Card.Row.Label>
          <Card.Row.Col className="px-4 py-4 ">{limitText}</Card.Row.Col>
        </Card.Row>
      )}
    </Card>
  );
}
