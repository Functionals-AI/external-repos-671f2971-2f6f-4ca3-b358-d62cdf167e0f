import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';

import { SessionType } from 'types/globals';
import OverflowMenu from '@/ui-components/dropdown-menu/overflow-menu';
import CellSkeleton from '../cell-skeleton';
import { useWeekViewSchedulingContext } from '../context';
import Icon from '@/ui-components/icons/Icon';
import { ScheduledPatientSessionSingle } from '@/features/patient-scheduler/types';

interface ScheduledSingleSessionProps {
  dateTime: DateTime;
  session: ScheduledPatientSessionSingle;
}

export default function ScheduledSingleSession({ session, dateTime }: ScheduledSingleSessionProps) {
  const { t } = useTranslation();
  const { openConfirmRemoveSingleSessionModal, openScheduleSlotOptionsModal } =
    useWeekViewSchedulingContext();

  return (
    <CellSkeleton
      data-testid="scheduled-single-session"
      className="group bg-fs-pale-green-100 fill-fs-green-600 text-fs-green-600 justify-between"
    >
      <div>
        <div className="flex gap-x-2 items-center">
          <p>{t('Selected')}</p>
          <Icon
            size="xs"
            color="neutral"
            name={session.sessionType === SessionType.Video ? 'video' : 'video-off'}
          />
        </div>
      </div>
      <div className="group">
        <OverflowMenu
          items={[
            {
              label: t('Edit session'),
              onClick: () =>
                openScheduleSlotOptionsModal({
                  type: 'edit',
                  dateTime,
                  session: session,
                }),
            },
            {
              label: t('Remove session'),
              onClick: () => openConfirmRemoveSingleSessionModal(session),
            },
          ]}
        />
      </div>
    </CellSkeleton>
  );
}
