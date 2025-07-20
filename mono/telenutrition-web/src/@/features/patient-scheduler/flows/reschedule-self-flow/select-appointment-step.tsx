import React, { useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { DateTime } from 'luxon';

import Section, { SectionDivider } from '@/ui-components/section';
import DataDisplay from '@/ui-components/data-display';
import { useModal } from '@/modules/modal';
import useMemberHelpers from '@/modules/member/useMemberHelpers';
import { useMultiStepFormContext } from '@/modules/multi-step-form';
import {
  AppointmentRecord,
  HouseholdMemberSchedulable,
} from 'api/types';
import type { PatientRecord, ProviderRecord } from '@mono/telenutrition/lib/types';
import { AsTime } from '@/modules/dates';

import AppointmentPicker from '../other-known/schedule-flow/components/appointment-picker';
import { RescheduleSelfFormFields } from './index';
import TimezonePicker, { TimezoneOption } from '../../components/TimezonePicker';

interface Props {
  patient: HouseholdMemberSchedulable | PatientRecord;
  rescheduleAppointment?: AppointmentRecord;
  provider: ProviderRecord;
}

export default function SelectAppointmentStep({ patient, rescheduleAppointment, provider }: Props) {
  const { t } = useTranslation();
  const modal = useModal();
  const memberHelpers = useMemberHelpers();
  const { form } = useMultiStepFormContext<RescheduleSelfFormFields>();

  const patientDisplayName = memberHelpers.getDisplayNameForPatient(patient);

  // need to watch to trigger rerender
  const [selectedAppointmentData, timezoneDisplay] = form.watch([
    'selectedAppointmentData',
    'timezoneDisplay',
  ]);

  const timezone = useMemo(() => {
    if (timezoneDisplay === TimezoneOption.LOCAL) {
      return provider.timezone ?? 'America/Los_Angeles';
    } else {
      return patient.timezone;
    }
  }, [timezoneDisplay, provider.timezone, patient.timezone]);

  return (
    <>
      <div className="h-[680px]">
        <Section title={t('Member')}>
          <DataDisplay label={t('Member')} content={<div>{patientDisplayName.value}</div>} />
          {rescheduleAppointment && (
            <DataDisplay
              label={<Trans>Original visit</Trans>}
              content={DateTime.fromISO(rescheduleAppointment.startTimestamp).toFormat(
                'LLL d, yyyy',
              )}
              footer={
                <p className="text-sm text-neutral-600">
                  <AsTime>{rescheduleAppointment.startTimestamp}</AsTime>
                </p>
              }
            />
          )}
        </Section>
        <SectionDivider />
        <Section title={t('Visit detail')}>
          <div>
            <TimezonePicker
              providerTimezone={provider?.timezone}
              patientTimezone={patient.timezone}
              form={form}
              id={'timezoneDisplay'}
            />
            <AppointmentPicker
              providerId={provider.providerId}
              patient={patient}
              form={form}
              timezone={timezone}
              rescheduleAppointment={rescheduleAppointment}
            />
          </div>
        </Section>
      </div>
    </>
  );
}
