import Section from '@/ui-components/section';
import DataDisplay from '@/ui-components/data-display';
import { useMultiStepFormContext } from '@/modules/multi-step-form';
import { HouseholdMemberSchedulable } from 'api/types';
import AsyncPatientSearchFormField from './async-patient-search';
import FormItem from '@/modules/form/form-item';
import { Trans, useTranslation } from 'react-i18next';
import { SessionDuration, SessionType } from 'types/globals';
import SessionOptionsCard from '../../../../../smart-components/session-options-card';
import { DateTime } from 'luxon';

interface ScheduleInfoProps {
  dateDisplay: string;
  timeDisplay: string;
  dateTime: DateTime;
  appointmentIds: { primary: number; secondary?: number };
}

export interface ScheduleInfoFields {
  patient: HouseholdMemberSchedulable;
  sessionType: SessionType;
  duration: SessionDuration;
}

export default function ScheduleInfo({
  dateDisplay,
  timeDisplay,
  appointmentIds,
  dateTime,
}: ScheduleInfoProps) {
  const { form } = useMultiStepFormContext<ScheduleInfoFields>();
  const { t } = useTranslation();

  return (
    <Section title="Details" subtitle={t('Visits can be scheduled up to 3 months in advance.')}>
      <div className="grid grid-cols-2 gap-2">
        <DataDisplay label="Date" content={dateDisplay} className="col-span-1" />
        <DataDisplay label="Time" content={timeDisplay} className="col-span-1 col-start-1" />
      </div>

      <FormItem
        id="patient"
        form={form}
        label={<Trans>Member ID or Name (Format: Last, First)</Trans>}
        rules={{ required: true }}
        renderItem={(field) => (
          <AsyncPatientSearchFormField
            value={field.value as HouseholdMemberSchedulable}
            scheduleDate={dateTime}
            patientCanScheduleValidator={(patient) => {
              if (!patient.schedulingInfo.canSchedule)
                return { canSchedule: false, reasons: patient.schedulingInfo.errors };

              if (
                !appointmentIds.secondary &&
                !patient.schedulingInfo.validAppointmentDurations.some((dur) => dur === 30)
              ) {
                return {
                  canSchedule: false,
                  reasons: [
                    {
                      type: 'disallowed',
                      reasonShort: t('60-min appts only'),
                      reasonFull: t('60-minute appointments only'),
                    },
                  ],
                };
              }

              return { canSchedule: true };
            }}
            onChange={(option) => {
              field.onChange(option?.value ?? null);
            }}
          />
        )}
      />
      <SessionOptionsCard form={form} force30MinuteDuration={!appointmentIds.secondary} />
    </Section>
  );
}
