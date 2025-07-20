import dayjs from '../../utils/dayjs';
import Calendar from '../../components/calendar';
import useScheduleAppointmentState, {
  UseScheduleAppointmentStateProps,
} from './useScheduleAppointmentState';
import Loading from '../../components/loading';
import { AnimatePresence, motion } from 'framer-motion';
import NoAvailableAppointments from './no-available-appointments';
import DisplayAppointmentsForDay from './render-group-item';
import Button from '../../components/button';
import { useTranslation } from 'react-i18next';
import ApiGetError from '../../components/api-get-error';
import DateDisplay from './date-display';
import ProviderSearch from './provider-search';
import { useState } from 'react';
import type { ProviderRecordShort } from '@mono/telenutrition/lib/types';
import { filterSlotsByProvider } from './helpers';

export default function ScheduleAppointmentContainer(props: UseScheduleAppointmentStateProps) {
  const { t } = useTranslation();
  const scheduleAppointmentState = useScheduleAppointmentState(props);
  const [selectedProvider, setSelectedProvider] = useState<ProviderRecordShort | null>(null);

  if (scheduleAppointmentState.isLoading) return <Loading />;

  if (scheduleAppointmentState.error) {
    if (scheduleAppointmentState.error.status === 'not-found') {
      return (
        <ApiGetError
          message={[
            t(
              'ThisPatientDoesNotHaveAFoodsmartAccount',
              'This patient does not have a Foodsmart account.',
            ),
            t(
              'PleaseContactAndCreateAnAccount',
              'Please contact Michelle Hanson and she will create an account for the patient.',
            ),
          ]}
          error={scheduleAppointmentState.error}
          refetch={scheduleAppointmentState.refetch}
        />
      );
    }
    return (
      <ApiGetError
        error={scheduleAppointmentState.error}
        refetch={scheduleAppointmentState.refetch}
      />
    );
  }

  const {
    slots,
    selectedDate,
    onCalendarChange,
    today,
    onSelectAppointment,
    filteredAppointments,
    timezoneDisplay,
    providers,
    validDurationsType,
  } = scheduleAppointmentState;

  const displayedAppointments = selectedProvider
    ? filteredAppointments?.filter((appts) => appts.providerId === selectedProvider.providerId)
    : filteredAppointments;

  const filteredSlots = selectedProvider ? filterSlotsByProvider(slots, selectedProvider.providerId) : slots;

  if (Object.keys(filteredSlots).length === 0) {
    return (
      <NoAvailableAppointments
        onBack={props.onNoAppointments}
        buttonText={props.onNoAppointmentsButtonText}
      />
    );
  }

  return (
    <div className="relative">
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        <div className="md:grid md:grid-cols-2 md:divide-x md:divide-gray-200">
          <div className="flex justify-center px-4 mx-auto pb-8" style={{ maxWidth: '33rem' }}>
            <Calendar
              value={selectedDate ? new Date(selectedDate) : null}
              onChange={onCalendarChange}
              minDate={today.toJSDate()}
              maxDate={today.plus({ days: 90 }).toJSDate()}
              tileDisabled={(tile) => {
                const tileDate = dayjs(tile.date).format('MM/DD/YYYY');
                const found = filteredSlots?.[tileDate];
                return !found || !found.length;
              }}
            />
          </div>
          <section className="flex flex-col justify-between" style={{ maxHeight: '35rem' }}>
            <div>
              <h5 className="px-2">{t('SearchForAProviderHere', 'Search for a Provider here')}</h5>
              <ProviderSearch
                providers={providers}
                selectedProvider={selectedProvider}
                setSelectedProvider={setSelectedProvider}
              />
            </div>
            <div className="overflow-y-scroll flex-1">
              <AnimatePresence exitBeforeEnter>
                <motion.div
                  initial={{ y: 5, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  exit={{ y: -5, opacity: 0 }}
                  key={selectedDate}
                >
                  <div className="overflow-y-scroll px-4">
                    <div key={selectedDate} className="relative first:pt-0 pt-6">
                      <DateDisplay date={selectedDate} />
                      <DisplayAppointmentsForDay
                        {...{
                          onSelectAppointment,
                          groupedAppointmentsByProvider: displayedAppointments ?? null,
                          providers: providers,
                          validDurationsType,
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
            {timezoneDisplay && (
              <p className="mt-4 ml-2 text-base font-semibold">
                *{' '}
                {t('AllTimesInTimezone', 'All times in {{timezone}}', {
                  timezone: timezoneDisplay,
                })}
              </p>
            )}
          </section>
        </div>
        {props.onBack && (
          <div className="mt-6 md:mt-4 px-4 md:px-6 lg:px-10">
            <Button type="button" onClick={props.onBack}>
              {t('Back', 'Back')}
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
