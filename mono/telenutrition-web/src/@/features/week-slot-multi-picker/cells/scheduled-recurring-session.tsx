import { DateTime } from 'luxon';
import OverflowMenu from '@/ui-components/dropdown-menu/overflow-menu';
import { useTranslation } from 'react-i18next';
import Icon from '@/ui-components/icons/Icon';

import CellSkeleton from '../cell-skeleton';
import { useWeekViewSchedulingContext } from '../context';
import { SessionType } from 'types/globals';
import { ScheduledPatientSessionRecurring } from '@/features/patient-scheduler/types';

interface ScheduledRecurringSessionProps {
  session: ScheduledPatientSessionRecurring;
  dateTime: DateTime;
}

export default function ScheduledRecurringSession({
  session,
  dateTime,
}: ScheduledRecurringSessionProps) {
  const { t } = useTranslation();
  const { openConfirmRemoveRecurringSessionsModal } = useWeekViewSchedulingContext();
  return (
    <CellSkeleton className="bg-fs-pale-green-100 fill-fs-green-600 text-fs-green-600 justify-between">
      <div className="flex flex-col">
        <div className="flex">
          <div className="flex gap-x-2 items-center mr-1">
            <p>{t('Selected')}</p>
            <Icon
              size="xs"
              name={session.slots[0].sessionType === SessionType.Video ? 'video' : 'video-off'}
            />
          </div>

          <div className="group">
            <OverflowMenu
              items={[
                {
                  label: t('Remove session'),
                  onClick: () => openConfirmRemoveRecurringSessionsModal(session, dateTime),
                },
              ]}
            />
          </div>
        </div>

        <div>
          <Icon name="refresh-ccw" size="xs" />
        </div>
      </div>
    </CellSkeleton>
  );
}
