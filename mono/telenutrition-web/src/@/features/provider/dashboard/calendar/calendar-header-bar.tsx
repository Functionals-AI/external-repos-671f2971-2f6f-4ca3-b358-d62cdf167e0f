import { DateNavigatorProps } from '@/modules/calendar/date-navigator';
import { Button } from '@/ui-components/button';
import ButtonToggle from '@/ui-components/form/button-toggle';
import { Trans, useTranslation } from 'react-i18next';
import TimezoneSelector from '../timezone-selector';
import { ViewType, useProviderDashboardContext } from '../context';
import { AppointmentRecord } from 'api/types';
import DateNavigatorWithAppointmentDetails from '@/modules/calendar/date-navigator/date-navigator-with-appointment-details';
import { useModal } from '@/modules/modal';

type CalendarHeaderBarProps = {
  dateNavigator: DateNavigatorProps;
  timezone: string;
  appointmentsByDay: Record<string, AppointmentRecord[]>;
};

export default function CalendarHeaderBar({
  dateNavigator,
  timezone,
  appointmentsByDay,
}: CalendarHeaderBarProps) {
  const { viewType, setViewType } = useProviderDashboardContext();
  const { t } = useTranslation();
  const modal = useModal();

  return (
    <div className="w-full flex justify-between">
      <div className="items-center flex gap-x-1">
        <DateNavigatorWithAppointmentDetails
          dateNavigator={dateNavigator}
          appointmentsByDay={appointmentsByDay}
        />
        <div className="items-center flex gap-x-1">
          <Button
            className="min-w-fit"
            onClick={dateNavigator.today}
            variant="tertiary"
            leftIcon={{ name: 'calendar-arrow', color: 'fsGreen' }}
          >
            <Trans>Today</Trans>
          </Button>
          <ButtonToggle
            dataTestId="provider-calendar-view-type-toggle"
            buttonClassName="px-4"
            options={[
              { name: t('1 Day'), value: ViewType.SingleDay, iconName: 'calendar-day' },
              { name: t('7 Days'), value: ViewType.Week, iconName: 'calendar-week' },
            ]}
            value={viewType}
            onChange={(value) => setViewType(value)}
          />
        </div>
      </div>
      <div className="flex gap-x-2">
        <Button
          leftIcon={{ name: 'calendar' }}
          variant="secondary"
          onClick={() => {
            modal.openPrimary({
              type: 'schedule-session-v2',
            });
          }}
        >
          <Trans>Schedule visits</Trans>
        </Button>
        <TimezoneSelector initialValue={timezone} />
      </div>
    </div>
  );
}
