import React, { ReactNode, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { FormV2, useForm } from '@/modules/form/form';
import Modal from '@/modules/modal/ui/modal';
import DataDisplay from '@/ui-components/data-display';
import Section from '@/ui-components/section';
import CheckBox from '@/ui-components/radio-and-checkbox/checkbox';
import { AppointmentRecord } from 'api/types';

import { DeveloperError } from 'utils/errors';
import { SessionDuration, SessionType } from 'types/globals';
import { AsBasicDate } from '@/modules/dates';
import {
  calculateRecurringAppointments,
  convertFutureSlotsToRecurringScheduledSession,
} from '../../helpers';
import { useModal } from '@/modules/modal';
import {
  DefaultValuesPatientSessionForm,
  FutureAppointmentSlot,
  ScheduledPatientSession,
} from '../../types';
import RecurringAppointmentFields from './RecurringAppointmentFields';
import { DateTime } from 'luxon';


export interface SchedulePatientSessionFields {
  duration: SessionDuration;
  sessionType: SessionType;
  date: Date;
  isRepeating?: boolean;
  repeatEveryNumWeeks?: number;
  repeatForNumSessions?: number;
}

type SchedulePatientSessionsModalProps = {
  appointmentsByDay: Record<string, AppointmentRecord[]>;
  onComplete: (values: ScheduledPatientSession) => void;
  durationDisabled?: boolean;
  displayTime: string;
  displayTimeFooter?: ReactNode;
  defaultValues: DefaultValuesPatientSessionForm;
  sessionTypeDisabled: boolean;
} & (
  | {
  formType: 'create';
  appointmentIds: {
    primary: number;
    secondary?: number;
  };
}
  | { formType: 'edit'; appointmentIds: number[] }
  );

export default function ScheduleSlotOptionsModal({
   appointmentsByDay,
   onComplete,
   defaultValues,
   durationDisabled,
   displayTime,
   displayTimeFooter,
   sessionTypeDisabled,
   ...params
 }: SchedulePatientSessionsModalProps) {
  const { t } = useTranslation();
  const modal = useModal()
  const form = useForm<SchedulePatientSessionFields>(
  {
    defaultValues: {
      ...defaultValues,
      repeatEveryNumWeeks: 0,
      repeatForNumSessions: 0,
    }
  });
  const values = form.getValues();
  const [isRepeating, repeatEveryNumWeeks, repeatForNumSessions, date] = form.watch([
    'isRepeating',
    'repeatEveryNumWeeks',
    'repeatForNumSessions',
    'date',
  ]);

  const [recurringAppointments, setRecurringAppointments] = useState<
    null | FutureAppointmentSlot[]
  >(null);

  function onSubmit(values: SchedulePatientSessionFields) {
    const appointmentIds = (() => {
      if (params.formType === 'create') {
        if (values.duration === SessionDuration.Thirty) return [params.appointmentIds.primary];
        else if (params.appointmentIds.secondary)
          return [params.appointmentIds.primary, params.appointmentIds.secondary];

        throw new DeveloperError(
          'Should not be able to schedule a 60 minute appt with only one appointmentId',
        );
      }
      return params.appointmentIds;
    })();

    if (values.isRepeating) {
      if (!recurringAppointments || !recurringAppointments.length) {
        // shouldn't do this... should not allow form to be submitted here
        return;
      }

      const recurringSession = convertFutureSlotsToRecurringScheduledSession(
        recurringAppointments,
        {
          duration: values.duration,
          sessionType: values.sessionType,
          date: values.date,
          appointmentIds: appointmentIds,
        },
      );

      if (recurringSession.slots.length > 1) {
        onComplete(recurringSession);
        return;
      }
    }

    onComplete({
      type: 'single',
      duration: values.duration,
      sessionType: values.sessionType,
      date: values.date,
      appointmentIds: appointmentIds,
      isLockedDuration: durationDisabled ?? false,
    });
  }

  useEffect(() => {
    if (!isRepeating) {
      form.setValue('repeatEveryNumWeeks', undefined);
      form.setValue('repeatForNumSessions', undefined);
    }
  }, [isRepeating, form]);

  useEffect(() => {
    if (!isRepeating || !repeatEveryNumWeeks || !repeatForNumSessions) {
      setRecurringAppointments(null);
      return;
    }

    const recurringAppointments = calculateRecurringAppointments({
      currentDate: date,
      maxConflicts: 3,
      weeksToRepeat: repeatEveryNumWeeks,
      appointmentsByDay,
      timesToRepeat: repeatForNumSessions,
      duration: values.duration,
    });

    setRecurringAppointments(recurringAppointments);
  }, [isRepeating, repeatEveryNumWeeks, repeatForNumSessions, date, appointmentsByDay, values.duration]);

  return (
    <Modal size={'lg'}>
      <FormV2 form={form} onSubmit={onSubmit}>
        <Modal.Header title={<Trans>Create session</Trans>} />
        <Modal.Body>
          <Section title={t('Session detail')}>
            <DataDisplay
              label={t('Date')}
              content={<div>{DateTime.fromJSDate(date).toLocaleString(DateTime.DATE_HUGE)}</div>}
            />
            <DataDisplay label="Time" content={displayTime} footer={displayTimeFooter} />
            <div className="flex flex-col gap-y-2 pt-4 max-w-[24rem]">
              <FormV2.FormButtonToggle
                dataTestId="session-type-button-toggle"
                className="w-full"
                form={form}
                id="sessionType"
                rules={{ required: true }}
                disabled={sessionTypeDisabled}
                options={[
                  { value: SessionType.Video, name: t('Video'), iconName: 'video' },
                  { value: SessionType.AudioOnly, name: t('Audio only'), iconName: 'video-off' },
                ]}
              />
              <FormV2.FormButtonToggle
                dataTestId="duration-button-toggle"
                className="w-full"
                form={form}
                id="duration"
                rules={{ required: true }}
                disabled={durationDisabled}
                options={[
                  {
                    value: SessionDuration.Sixty,
                    name: t('60 minute'),
                  },
                  {
                    value: SessionDuration.Thirty,
                    name: t('30 minute'),
                  },
                ]}
              />
              <CheckBox
                id="isRepeating"
                form={form}
                rules={{ required: false }}
                label={t('Recurring')}
              />
              {values.isRepeating && (
                <RecurringAppointmentFields
                  form={form}
                  recurringAppointments={recurringAppointments}
                />
              )}
            </div>
          </Section>
        </Modal.Body>
        <Modal.Footer className="justify-end">
          <Modal.Footer.ButtonGroup>
            <Modal.Footer.SecondaryCloseButton
              onClick={() => modal.closeSecondary()}
            >{t('Go back')}</Modal.Footer.SecondaryCloseButton>
            <Modal.Footer.PrimaryButton>{t('Save')}</Modal.Footer.PrimaryButton>
          </Modal.Footer.ButtonGroup>
        </Modal.Footer>
      </FormV2>
    </Modal>
  );
}
