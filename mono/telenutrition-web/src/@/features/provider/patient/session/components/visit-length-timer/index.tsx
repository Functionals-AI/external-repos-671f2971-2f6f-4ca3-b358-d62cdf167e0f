import { VerticalLine } from '@/icons/svg-line';
import Icon from '@/ui-components/icons/Icon';
import React, { useState, useEffect, useContext } from 'react';
import {
  calculateUnits,
  countTicks,
  getStateFromEncounterData,
  getStateFromSessionLength,
  styleMap,
  TimerButtonAction,
  TimerState,
} from './visit-timer';
import TimerButton from './timer-button';
import { TimeCircle } from './time-circle';
import usePutEncounterVisitTimes from 'api/encounter/usePutEncounterVisitTimes';
import { DateTime, Duration } from 'luxon';
import { useTranslation } from 'react-i18next';
import { useSessionContext } from '@/features/provider/patient/session/useSessionContext';
import usePostCreateAppointmentEncounter from 'api/encounter/usePostCreateAppointmentEncounter';
import useToaster from 'hooks/useToaster';
import { TimezoneContext } from '@/modules/dates/context';

export default function TimerComponent() {
  const toaster = useToaster();
  const { t } = useTranslation();
  const timezone = useContext(TimezoneContext)?.timezone ?? 'America/Los_Angeles';

  const {
    data: { encounterData, appointmentDetails },
    form,
  } = useSessionContext();

  const encounter = encounterData.encounter;
  const appointment = appointmentDetails.appointment;
  const sessionDuration = appointment.duration;

  const { post: putVisitTime } = usePutEncounterVisitTimes({
    encounterId: encounter?.encounterId || -1,
  });
  const { post: postCreateAppointmentEncounter } = usePostCreateAppointmentEncounter();

  const [timerState, setTimerState] = useState<TimerState>(() => {
    const startTime = encounter?.timerStartedAt ? new Date(encounter.timerStartedAt) : null;
    const endTime = encounter?.timerEndedAt ? new Date(encounter.timerEndedAt) : null;

    const ticks = startTime ? countTicks(startTime, endTime) : 0;
    const state = getStateFromEncounterData(startTime, endTime, sessionDuration, ticks);

    return {
      ticks,
      startTime,
      endTime,
      state,
      units: !startTime ? 0 : calculateUnits(ticks),
    };
  });

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const destroyTimer = () => (timer ? clearInterval(timer) : null);

    if (timerState.state !== 'inactive') {
      timer = setInterval(() => {
        const ticks = countTicks(timerState.startTime, timerState.endTime);
        setTimerState((prevState) => ({
          ...prevState,
          ticks,
          state: getStateFromSessionLength(sessionDuration, ticks),
          units: calculateUnits(ticks),
        }));
      }, 1000);
    } else if (timerState.ticks !== 0) {
      destroyTimer();
    }

    return () => {
      destroyTimer();
    };
  }, [timerState.state, sessionDuration]);

  useEffect(() => {
    if (
      encounter &&
      encounter.encounterId > 0 &&
      timerState.state === 'inactive' &&
      !encounter.timerStartedAt
    ) {
      const startTimestamp = new Date();

      putVisitTime({ payload: { startTimestamp } }).then(() => {
        setTimerState({
          ...timerState,
          state: 'running',
          startTime: startTimestamp,
        });
      });
    }
  }, []);

  function stopTimer() {
    const endTimestamp = new Date();
    putVisitTime({ payload: { endTimestamp } }).then(() => {
      setTimerState({
        ...timerState,
        state: 'inactive',
        endTime: endTimestamp,
      });
    });
  }

  function getSessionTime(time: number): string {
    const duration = Duration.fromObject({ seconds: time });
    return duration.toFormat('mm:ss');
  }

  async function onBtnClicked(action: TimerButtonAction) {
    if (action === 'start') {
      try {
        await postCreateAppointmentEncounter({
          payload: {
            appointmentId: appointmentDetails.appointment.appointmentId,
            chartingData: form.getValues(),
          },
        });

        toaster.success({
          title: 'Session successfully started',
          message: 'Appointment status has been updated',
        });
      } catch (error) {
        toaster.apiError({
          error,
          title: 'Error creating appointment encounter and starting session',
        });
      }
    } else if (action === 'stop') {
      stopTimer();
    }
  }

  const startTimestampDT = DateTime.fromISO(appointment.startTimestamp).setZone(timezone);
  const endOfToday = DateTime.now().setZone(timezone).endOf('day');
  const startOfYesterday = DateTime.now().setZone(timezone).minus({ days: 1 }).startOf('day');
  const canVisitBeStarted =
    startTimestampDT.isValid &&
    startTimestampDT < endOfToday &&
    startTimestampDT > startOfYesterday;

  return (
    <div className={`border p-2 my-2 rounded-lg ${styleMap[timerState.state].bg}`}>
      <div className="mb-2 flex items-center">
        <Icon className={styleMap[timerState.state].clock} name="clock" size="sm" />
        <div className="ml-1 text-md">
          <span className="font-semibold">{getSessionTime(timerState.ticks)}</span>
          <span className="ml-1">
            (~{timerState.units}{' '}
            {timerState.units > 1 || timerState.units === 0 ? t('units') : t('unit')})
          </span>
        </div>
      </div>
      <div className="flex">
        <div className="ml-6">
          <TimeCircle timestamp={timerState.startTime} state={timerState} />
          <VerticalLine
            className={styleMap[timerState.state].svgStroke}
            size={16}
            strokeWidth={1.5}
          />
          <TimeCircle timestamp={timerState.endTime} state={timerState} />
        </div>
        <div className="ml-auto">
          <TimerButton
            tooltip={
              !canVisitBeStarted
                ? t(
                    "You can only start today's visits. This visit is scheduled outside of that time period.",
                  )
                : undefined
            }
            disabled={!canVisitBeStarted}
            state={timerState}
            onClick={onBtnClicked}
          />
        </div>
      </div>
    </div>
  );
}
