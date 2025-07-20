import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import usePostProviderOverbookingSlots from '../api/provider/usePostProviderOverbookingSlots';
import { useModal } from '../@/modules/modal';
import { ApiRequestError } from '../utils/errors';
import { useProviderDashboardContext } from '../@/features/provider/dashboard/context';
import { openIssueReportPage } from '../@/smart-components/report-issue-button';

export default function useOverbooking() {
  const { post, data } = usePostProviderOverbookingSlots();
  const { t } = useTranslation();
  const { providerOverbookingSlotsData } = useProviderDashboardContext();

  const modal = useModal();

  const postProviderOverbookingSlots = useCallback(
    async ({
      startTimestamp,
      duration,
      fromFrozen,
    }: {
      startTimestamp: string;
      duration: number;
      fromFrozen?: boolean;
    }) => {
      try {
        const res = await post({
          payload: { startTimestamp, duration, fromFrozen },
        });
        modal.openPrimary({
          type: 'overbooking-confirmation',
          appointment: res.data,
        });
      } catch (e: any) {
        if (e instanceof ApiRequestError && e.code === 'booked') {
          modal.openPrimary({
            type: 'basic-dialog',
            title: t('Visit no longer available'),
            body: t(
              'This visit could not be scheduled because it is no longer available. Another provider may have already scheduled it.',
            ),
            primaryButton: {
              text: t('Close'),
              onClick: () => {
                providerOverbookingSlotsData?.refetch();
                modal.closeAll();
              },
            },
          });
        } else {
          const title = t('Visit not scheduled');
          const body = t(
            'Something went wrong when trying to schedule the visit, try again or submit an error report.',
          );
          const subMessage = e.trace ? `Trace ID: ${e.trace}` : undefined;

          modal.openPrimary({
            type: 'basic-dialog',
            title,
            body,
            theme: 'destructive',
            primaryButton: {
              text: t('Close'),
              onClick: () => {
                providerOverbookingSlotsData?.refetch();
                modal.closeAll();
              },
            },
            secondaryButton: {
              text: t('Submit error report'),
              onClick: () =>
                openIssueReportPage([title, body, subMessage].filter(Boolean).join('\n')),
            },
          });
        }
      }
    },
    [modal, post, providerOverbookingSlotsData, t],
  );

  return {
    postProviderOverbookingSlots,
    isSubmitting: data.isSubmitting,
  };
}
