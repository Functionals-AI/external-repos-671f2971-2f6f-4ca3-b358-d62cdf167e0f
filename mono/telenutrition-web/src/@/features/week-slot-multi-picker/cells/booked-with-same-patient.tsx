import { useTranslation } from 'react-i18next';
import CellSkeleton from '../cell-skeleton';
import { useWeekViewSchedulingContext } from '../context';
import { cn } from '@/utils';
import { DayScheduleType } from '..';

export default function BookedWithSamePatient({
  dayScheduleType,
}: {
  dayScheduleType: DayScheduleType;
}) {
  const { t } = useTranslation();
  const { patient } = useWeekViewSchedulingContext();
  return (
    <CellSkeleton
      data-testid="booked-with-same-patient-cell"
      className={cn(
        'bg-fs-pale-green-100 text-fs-green-600 text-xs',
        dayScheduleType !== 'allowed' && 'opacity-60',
      )}
    >
      {t('Already booked with {{firstName}} {{lastName}}', {
        firstName: patient.firstName ?? '-',
        lastName: patient.lastName ?? '-',
      })}
    </CellSkeleton>
  );
}
