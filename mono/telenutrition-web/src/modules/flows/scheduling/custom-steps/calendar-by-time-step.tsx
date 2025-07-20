import HeaderSubheader from 'components/header-subheader';
import { AnimatePresence, motion } from 'framer-motion';
import Calendar from 'components/calendar';
import { useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import { Trans, useTranslation } from 'react-i18next';
import Button from 'components/button';
import useFetchOverbookableAppointmentSlots from 'api/useFetchOverbookableAppointmentSlots';
import { useWorkflowEngineContext } from 'modules/flows/flow-engine/workflow-engine/context';
import { DeveloperError } from 'utils/errors';
import { AppointmentData } from 'api/useGetAppointments';
import Loading from 'components/loading';
import ApiGetError from 'components/api-get-error';

const TimezoneCodes: Record<string, string> = {
  'America/Puerto_Rico': 'US/Atlantic',
  'America/New_York': 'US/Eastern',
  'America/Chicago': 'US/Central',
  'America/Denver': 'US/Mountain',
  'America/Los_Angeles': 'US/Pacific',
  'America/Juneau': 'US/Alaska',
  'America/Phoenix': 'US/Arizona',
  'Pacific/Honolulu': 'US/Aleutian',
};

const TimezoneNames: Record<string, string> = {
  'US/Central': 'Central Timezone',
  'US/Eastern': 'Eastern Timezone',
  'US/Arizona': 'Arizona Timezone',
  'US/Mountain': 'Mountain Timezone',
  'US/Pacific': 'Pacific Timezone',
  'US/Alaska': 'Alaska Timezone',
  'US/Aleutian': 'Aleutian Timezone',
  'US/Atlantic': 'Atlantic Timezone',
};

export default function CalendarByTimeStepWrapper() {
  const { getFlowStateValue } = useWorkflowEngineContext();
  const patient_id = getFlowStateValue('patient_id') as string | null;
  const paymentMethodId = getFlowStateValue('payment_method_id') as number | null;

  if (patient_id === undefined || patient_id === null) {
    throw new DeveloperError('Patient Id must be taken before calendar displayed');
  }

  if (paymentMethodId == undefined || paymentMethodId === null) {
    throw new DeveloperError('Payment method id is required');
  }
  return <CalendarByTimeStep patientId={patient_id} paymentMethodId={paymentMethodId} />;
}

function CalendarByTimeStep({
  patientId,
  paymentMethodId,
}: {
  paymentMethodId: number;
  patientId: string;
}) {
  const { data, isLoading, error, refetch } = useFetchOverbookableAppointmentSlots({
    patientId,
    paymentMethodId,
  });
  const { handleBack, form, handleNext } = useWorkflowEngineContext();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const today = DateTime.now();
  const { t } = useTranslation();

  useEffect(() => {
    if (isLoading || !data || !Object.keys(data.slots).length) return;
    if (Object.keys(data.slots).length === 0) {
      setSelectedDate(today.toJSDate());
    } else {
      const sorted = Object.entries(data.slots).sort(([_, a], [__, b]) =>
        DateTime.fromISO(a.startTimestamp) > DateTime.fromISO(b.startTimestamp) ? 1 : -1,
      );

      const firstAvailableDate = sorted[0];

      setSelectedDate(DateTime.fromISO(firstAvailableDate[1].startTimestamp).toJSDate());
    }
  }, [isLoading, data]);

  function onCalendarChange(d: Date) {
    setSelectedDate(d);
  }

  function onTimeslotSelect(appointment: AppointmentData) {
    form.handleSubmit(
      () => {
        return handleNext({
          appointment: {
            appointment_ids: appointment.appointmentIds,
            duration: appointment.duration,
            start_timestamp: appointment.startTimestamp,
            provider_name: 'Foodsmart',
            provider_initials: 'FS',
            provider_photo: '/avocado.svg',
            start_at: DateTime.fromISO(appointment.startTimestamp, { setZone: true }).toFormat('h:mma'),
            start_date: DateTime.fromISO(appointment.startTimestamp, { setZone: true }).toFormat('MM/dd/yyyy'),
          },
        });
      },
      () => console.log('error'),
    )();
  }

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <ApiGetError error={error} refetch={refetch} />;
  }

  if (data.slots.length === 0) {
    return (
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7 }}
        className="flex flex-col items-center justify-center p-6"
      >
        <p className="mb-8">
          {t('There are no available appointments with the selections you have made.')}
          {` `}
          {t('Please go back and adjust your preferences to see more results.')}
        </p>
        <Button type="button" onClick={() => handleBack()}>
          <Trans>Go back</Trans>
        </Button>
      </motion.div>
    );
  }

  const timezone = data.timezone;
  const slotsForDay = selectedDate
    ? data.slots.filter(
        (slot) =>
          DateTime.fromISO(slot.startTimestamp, { setZone: true }).toFormat('yyyy-LL-dd') ===
          DateTime.fromJSDate(selectedDate).toFormat('yyyy-LL-dd'),
      )
    : [];

  return (
    <div className="max-w-5xl m-auto px-6 space-y-6">
      <HeaderSubheader
        header={t('Select a date and time')}
        subheader={t('Use the calendar to choose the best time for your virtual visit.')}
      />
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
                  const tileDate = DateTime.fromJSDate(tile.date).toFormat('yyyy-LL-dd');
                  const found = data.slots.filter(
                    (slot) =>
                      DateTime.fromISO(slot.startTimestamp, { setZone: true }).toFormat('yyyy-LL-dd') === tileDate,
                  );
                  return !found || !found.length;
                }}
              />
            </div>
            <section className="flex flex-col justify-between" style={{ maxHeight: '35rem' }}>
              <div className="overflow-y-scroll flex-1">
                <AnimatePresence exitBeforeEnter>
                  <motion.div
                    initial={{ y: 5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    exit={{ y: -5, opacity: 0 }}
                    key={selectedDate?.toDateString()}
                  >
                    <div className="overflow-y-scroll px-4">
                      {selectedDate && (
                        <div className="relative first:pt-0 pt-6">
                          <div className="relative">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                              <div className="w-full border-t border-neutral-400" />
                            </div>
                            <div className="relative flex justify-center">
                              <span className="px-3 bg-white text-lg font-medium text-neutral-1500">
                                {DateTime.fromJSDate(selectedDate).toFormat('MMMM d, yyyy')}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="inline-flex flex-wrap gap-4 pt-4">
                        {slotsForDay.map((slot) => (
                          <Button
                            key={slot.startTimestamp}
                            className="min-w-[3rem]"
                            onClick={() => onTimeslotSelect(slot)}
                          >
                            {DateTime.fromISO(slot.startTimestamp, { setZone: true }).toFormat('h:mma')}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
              {timezone &&
                (() => {
                  const tzCode = TimezoneCodes[timezone];
                  const tzName = TimezoneNames[tzCode];
                  return (
                    <p className="mt-4 ml-2 text-base font-semibold">
                      {'* '}
                      {t('All times in {{timezone}}', {
                        timezone: tzName ?? timezone,
                      })}
                    </p>
                  );
                })()}
            </section>
          </div>
          <div className="mt-6 md:mt-4 px-4 md:px-6 lg:px-10">
            <Button type="button" onClick={handleBack}>
              {t('Back', 'Back')}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
