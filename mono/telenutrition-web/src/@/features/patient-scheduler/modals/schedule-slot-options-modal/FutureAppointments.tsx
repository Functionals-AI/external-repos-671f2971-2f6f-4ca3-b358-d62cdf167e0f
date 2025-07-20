import { useTranslation } from 'react-i18next';
import Card from '@/ui-components/card';
import { Badge } from '@/ui-components/badge';
import { cn } from '@/utils';
import { FutureAppointmentSlot } from '../../types';

export default function FutureAppointments({
  futureAppointments,
}: {
  futureAppointments: FutureAppointmentSlot[];
}) {
  const { t } = useTranslation();
  return (
    <div>
      <Card>
        {futureAppointments.map((slot) => (
          <Card.Row
            key={slot.date.toUnixInteger()}
            className="py-2 px-4 items-center min-h-[4rem] gap-x-4"
            dataTestId={'future-appointment-row'}
          >
            <p
              className={cn(slot.isConflict ? 'text-neutral-400' : 'text-neutral-700')}
            >
              {slot.date.toFormat('LLL dd, yyyy')}
            </p>
            {slot.isConflict ? (
              <Badge className="h-6" variant="statusRed" leftIconName={'x'}>
                {slot.type === 'frozen'
                  ? t('Conflict - frozen slot')
                  : t('Conflict - scheduled visit')}
              </Badge>
            ) : (
              <Badge className="h-6" variant="statusGreen" leftIconName={'check'}>
                {t('No Conflicts')}
              </Badge>
            )}
          </Card.Row>
        ))}
      </Card>
      {futureAppointments.filter((appt) => appt.isConflict).length > 0 && (
        <p>
          {t(
            'Conflicting sessions will be rescheduled for one cycle later. If no slots are unfrozen, in the future, at this time, no visit will be scheduled',
          )}
        </p>
      )}
    </div>
  );
}
