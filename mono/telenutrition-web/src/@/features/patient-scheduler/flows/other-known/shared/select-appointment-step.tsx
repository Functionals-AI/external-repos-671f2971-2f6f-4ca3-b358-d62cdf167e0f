import React, { useEffect, useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { DateTime } from 'luxon';

import Section, { SectionDivider } from '@/ui-components/section';
import DataDisplay from '@/ui-components/data-display';
import useMemberHelpers from '@/modules/member/useMemberHelpers';
import useFetchPatientProviders from 'api/useFetchPatientProviders';
import FormComboBoxItem from '@/modules/form/form-combo-box';
import ContainerLoading from '@/ui-components/loading/container-loading';
import GetErrorDisplay from '@/modules/errors/get-error-display';
import { useMultiStepFormContext } from '@/modules/multi-step-form';
import BannerBar from '@/modules/banner/banner';
import { AppointmentRecord, HouseholdMemberSchedulable } from 'api/types';
import type { PatientRecord } from '@mono/telenutrition/lib/types';
import { AsTime } from '@/modules/dates';
import { ScheduleOtherKnownFormFields } from '../schedule-flow';
import KnownVisitDetailsForm from '../schedule-flow/components/known-visit-details-form';
import { TimezoneOption } from '../../../components/TimezonePicker';
import { ComboBoxOption } from '@/ui-components/combobox';

interface Props {
  patient: HouseholdMemberSchedulable | PatientRecord;
  rescheduleAppointment?: AppointmentRecord;
  hideOptions?: boolean;
}

export default function SelectAppointmentStep({
  patient,
  rescheduleAppointment,
  hideOptions,
}: Props) {
  const { t } = useTranslation();
  const memberHelpers = useMemberHelpers();
  const { form } = useMultiStepFormContext<ScheduleOtherKnownFormFields>();

  const patientDisplayName = memberHelpers.getDisplayNameForPatient(patient);

  const { data, refetch, error, isLoading } = useFetchPatientProviders(patient.patientId, true);

  const options: ComboBoxOption[] = useMemo(
    () =>
      data?.providers
        .map((p) => ({
          label: p.name,
          value: p.providerId.toString(),
        }))
        .sort((a, b) => (a.label > b.label ? 1 : -1)) || [],
    [data?.providers],
  );

  // need to watch to trigger rerender
  const [providerId, selectedAppointmentData, timezoneDisplay, provider] = form.watch([
    'providerId',
    'selectedAppointmentData',
    'timezoneDisplay',
    'selectedProvider',
  ]);

  useEffect(() => {
    const provider = data?.providers.find((p) => p.providerId.toString() === providerId);
    form.setValue('selectedProvider', provider);
  }, [data, providerId, form]);

  const timezone = useMemo(() => {
    if (timezoneDisplay === TimezoneOption.LOCAL) {
      return provider?.timezone || patient.timezone;
    } else {
      return patient.timezone;
    }
  }, [timezoneDisplay, patient, provider]);

  if (isLoading) {
    return <ContainerLoading />;
  }
  if (error) {
    return <GetErrorDisplay refetch={refetch} error={error} />;
  }

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
        <Section
          title={t('Visit detail')}
          subtitle={t('Members cannot schedule more than one appointment per week.')}
        >
          <BannerBar
            banner={{
              type: 'warn',
              size: 'large',
              message: t('Both the RD and the Member must be aware and agree to this change.'),
            }}
          />
          <FormComboBoxItem
            form={form}
            id="providerId"
            label={<Trans>Dietitian</Trans>}
            options={options}
            rules={{ required: true }}
          />
          {providerId && (
            <KnownVisitDetailsForm
              provider={provider}
              patient={patient}
              form={form}
              hideOptions={hideOptions}
              timezone={timezone}
              rescheduleAppointment={rescheduleAppointment}
            />
          )}
        </Section>
      </div>
    </>
  );
}
