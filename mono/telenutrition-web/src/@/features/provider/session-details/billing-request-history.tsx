import GetErrorDislpay from '@/modules/errors/get-error-display';
import { Badge } from '@/ui-components/badge';
import ContainerLoading from '@/ui-components/loading/container-loading';
import TimelineVertical from '@/ui-components/timeline-vertical';
import useFetchEncounterAmendments from 'api/encounter/useFetchEnconterAmendments';
import type { AppointmentEncounterRecord } from '@mono/telenutrition/lib/types';
import { DateTime } from 'luxon';
import { Trans } from 'react-i18next';

export default function BillingRequestHistory({
  encounter,
}: {
  encounter: AppointmentEncounterRecord;
}) {
  const { data, isLoading, error, refetch } = useFetchEncounterAmendments({
    encounterId: encounter.encounterId,
  });

  if (isLoading) {
    return <ContainerLoading />;
  }

  if (error) {
    return <GetErrorDislpay error={error} refetch={refetch} />;
  }

  return (
    <div className="overflow-y-scroll mt-4">
      <TimelineVertical
        entries={data.amendments.map((amendment) => {
          const createdAtDT = DateTime.fromISO(amendment.createdAt, { zone: 'utc' }).setZone('local');

          return {
            key: String(amendment.amendmentId),
            content: (
              <div data-testid="encounter-amendment-item" className="flex flex-col gap-y-2">
                {amendment.unitsBilled && (
                  <div className="flex flex-row items-center text-sm">
                    <span className="w-[75px]">Units</span>
                    <span>{amendment.unitsBilled}</span>
                  </div>
                )}
                {amendment.billingCode && (
                  <div className="flex flex-row items-center text-sm">
                    <span className="text-sm w-[75px]">Billing code</span>
                    <span>{amendment.billingCode}</span>
                  </div>
                )}
                <div className="flex flex-row items-center text-sm">
                  {createdAtDT.toFormat("d LLL yyyy '@' h:mm a ZZZZ")}
                </div>
                <div>
                  {amendment.status === 'approved' ? (
                    <Badge variant="statusGreen" leftIconName="dot">
                      <Trans>Approved</Trans>
                    </Badge>
                  ) : amendment.status === 'pending' ? (
                    <Badge variant="statusAmber" leftIconName="dot">
                      <Trans>Pending</Trans>
                    </Badge>
                  ) : amendment.status === 'rejected' ? (
                    <Badge variant="statusRed" leftIconName="dot">
                      <Trans>Rejected</Trans>
                    </Badge>
                  ) : (
                    <Badge variant="neutral">
                      <Trans>Unknown status</Trans>
                    </Badge>
                  )}
                </div>
              </div>
            ),
          };
        })}
      />
    </div>
  );
}
