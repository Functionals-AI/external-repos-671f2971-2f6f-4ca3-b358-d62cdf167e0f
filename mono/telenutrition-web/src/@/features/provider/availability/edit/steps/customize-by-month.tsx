import { useModal } from '@/modules/modal';
import { useMultiStepFormContext } from '@/modules/multi-step-form';
import { Button } from '@/ui-components/button';
import Section from '@/ui-components/section';
import { cn } from '@/utils';
import { PencilIcon } from '@heroicons/react/solid';
import { useEffect } from 'react';
import { EditAvailabilityFields } from '..';
import { NavigationBar, useWeekPicker } from '@/modules/calendar/week-view';
import WeekNavigator from '@/modules/calendar/week-view/week-navigator';
import { DateTime } from 'luxon';
import EditTimeSlotModal from '../components/edit-time-slot-modal';
import { useTranslation } from 'react-i18next';

export default function CustomizeByMonth({ providerTimezone }: { providerTimezone: string }) {
  const { t } = useTranslation();
  const { form, getValuesAssertDefined } = useMultiStepFormContext<EditAvailabilityFields>();
  const modal = useModal();
  const weekPicker = useWeekPicker(providerTimezone);

  const { availability, dailyStartTime, dailyEndTime } = getValuesAssertDefined([
    'availability',
    'dailyStartTime',
    'dailyEndTime',
  ]);

  useEffect(() => void form.watch(), []);

  function openEditTimeSlotModal() {
    modal.openPrimary({
      type: 'custom',
      modal: (
        <EditTimeSlotModal
          onSubmit={(values) => {
            modal.closeAll();
          }}
        />
      ),
    });
  }

  return (
    <Section title={t('Default working hours')}>
      <NavigationBar {...weekPicker} />
      <WeekNavigator
        {...weekPicker}
        renderCell={(date, day) => {
          const found =
            form.getValues().availability?.[
              `${day}-${DateTime.fromJSDate(date).toFormat('hh:mma')}`
            ];

          return (
            <div
              className={cn(
                'flex items-center justify-center h-full w-full',
                !!found && 'bg-status-green-100',
              )}
            >
              <Button
                className="opacity-0 hover:opacity-100"
                onClick={() => openEditTimeSlotModal()}
                variant="tertiary"
                size="sm"
                leftIcon={{ name: 'edit' }}
              >
                {t('Modify')}
              </Button>
            </div>
          );
        }}
        renderColKey={(date, day) => (
          <div className="flex flex-col p-4 items-center justify-center h-full">
            <h6>{day.slice(0, 3)}</h6>
            <p>{DateTime.fromJSDate(date).toFormat('dd')}</p>
          </div>
        )}
        days={['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']}
        startTime={dailyStartTime}
        endTime={dailyEndTime}
        increment={30}
      />
    </Section>
  );
}
