import { AsBasicDate } from '@/modules/dates';
import { Badge } from '@/ui-components/badge';
import { AppointmentRecord } from 'api/types';
import type { AppointmentEncounterRecord } from '@mono/telenutrition/lib/types';
import { Trans, useTranslation } from 'react-i18next';
import _ from 'lodash';
import { getAppointmentComputedStatus } from '@/selectors/appointmentComputedStatus';
import { DateTime } from 'luxon';
import { Button } from '@/ui-components/button';
import { useModal } from '@/modules/modal';
import EditEncounterBillingModal from './edit-encounter-billing-modal';
import { ProviderContext } from 'app/schedule/provider/provider-context';
import useToaster from 'hooks/useToaster';
import BillingRequestHistory from './billing-request-history';
import { ReactNode, useContext } from 'react';

export default function VisitChartingDetails({
  appointment,
  encounter,
  readOnly,
}: {
  appointment: AppointmentRecord;
  encounter: AppointmentEncounterRecord;
  readOnly: boolean;
}) {
  const modal = useModal();
  const { t } = useTranslation();
  const computedStatus = getAppointmentComputedStatus({ ...appointment, encounter });
  const providerContext = useContext(ProviderContext);
  const toaster = useToaster();

  const startTimeDT = encounter.actualStarttime
    ? DateTime.fromISO(encounter.actualStarttime)
    : undefined;
  const endTimeDT = encounter.actualEndtime ? DateTime.fromISO(encounter.actualEndtime) : undefined;
  const encounterDuration =
    startTimeDT?.isValid && endTimeDT?.isValid
      ? endTimeDT.diff(startTimeDT).as('minutes').toFixed(0)
      : undefined;

  const statusText = (() => {
    if (computedStatus === 'oversight') return t('In review');
    if (computedStatus === 'canceled') return t('Canceled');
    if (computedStatus === 'complete') return t('Completed');
    if (computedStatus === 'incomplete') return t('Incomplete');
    if (computedStatus === 'current') return t('Current');
    if (computedStatus === 'needs-attention') return t('Needs attention');
    if (computedStatus === 'provider-response-required') return t('Provider Response Required');
    if (computedStatus === 'upcoming') return t('Upcoming');
    return t('Unknown status');
  })();

  return (
    <div className="flex flex-col gap-y-2 min-w-[15rem] max-h-[80vh] h-full overflow-y-scroll">
      <h4>
        <Trans>Visit chart</Trans>
      </h4>
      <Badge
        className="w-fit"
        variant={computedStatus === 'complete' ? 'statusGreen' : 'blue'}
        leftIconName={'dot'}
      >
        {statusText}
      </Badge>
      <div className="flex flex-col gap-y-1">
        <DataRow
          dataTestId="visit-charting-visit-date"
          label={<Trans>Visit date</Trans>}
          content={<AsBasicDate format="full">{appointment.startTimestamp}</AsBasicDate>}
        />
        <DataRow
          dataTestId="visit-charting-visit-id"
          label={<Trans>Visit ID</Trans>}
          content={appointment.appointmentId}
        />
        <DataRow
          dataTestId="visit-charting-visit-type"
          label={<Trans>Visit type</Trans>}
          content={appointment.appointmentTypeDisplay}
        />
        <DataRow
          dataTestId="visit-charting-visit-duration"
          label={<Trans>Duration</Trans>}
          content={appointment.duration}
        />
        <DataRow
          dataTestId="visit-charting-visit-connection"
          label={<Trans>Connection</Trans>}
          content={appointment.isAudioOnly ? 'Audio only' : 'Video'}
        />
      </div>
      <div className="flex flex-col gap-y-1">
        <h4>
          <Trans>Billing details</Trans>
        </h4>
        <DataRow
          dataTestId="visit-charting-start-time"
          label={<Trans>Start time</Trans>}
          content={startTimeDT?.toFormat('h:mm a')}
        />
        <DataRow
          dataTestId="visit-charting-end-time"
          label={<Trans>End time</Trans>}
          content={endTimeDT?.toFormat('h:mm a')}
        />
        <DataRow
          dataTestId="visit-charting-duration"
          label={<Trans>Duration</Trans>}
          content={
            encounterDuration
              ? t('{{minutes}} minutes', { minutes: encounterDuration })
              : t('Unknown duration')
          }
        />
        <DataRow
          dataTestId="visit-charting-units-billed"
          label={<Trans>Units</Trans>}
          content={encounter.unitsBilled}
        />
        <DataRow
          dataTestId="visit-charting-cpt-code"
          label={<Trans>CPT code</Trans>}
          content={encounter.billingCode}
        />
        {!readOnly && providerContext && (
          <Button
            variant="secondary"
            size="sm"
            className="w-fit mt-2"
            dataTestId="request-billing-edit-button"
            onClick={() => {
              const isAmendable = startTimeDT?.isValid && startTimeDT.diffNow().as('hours') > -72;
              if (!isAmendable) {
                toaster.warn({
                  message:
                    'The ability to edit encounter billing only exists for 72 hours after the visit start time',
                });
              } else {
                modal.openPrimary({
                  type: 'custom',
                  modal: (
                    <EditEncounterBillingModal
                      encounter={encounter}
                      appointment={appointment}
                      provider={providerContext.providerData.provider}
                    />
                  ),
                });
              }
            }}
          >
            <Trans>Request billing edit</Trans>
          </Button>
        )}
        {!readOnly && <BillingRequestHistory encounter={encounter} />}
      </div>
    </div>
  );
}

function DataRow({
  label,
  content,
  dataTestId,
}: {
  label: ReactNode;
  content: ReactNode;
  dataTestId?: string;
}) {
  return (
    <div className="flex flex-row gap-x-2" data-testid={dataTestId}>
      <p className="w-20 text-sm text-neutral-600">{label}</p>
      <p className="text-sm text-neutral-1500">{content}</p>
    </div>
  );
}
