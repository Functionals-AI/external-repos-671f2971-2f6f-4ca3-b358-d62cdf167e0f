import React from 'react';
import Section, { SectionDivider } from '@/ui-components/section';
import { useFetchProviderPatientById } from 'api/provider/useGetProviderPatient';
import GetErrorDislpay from '@/modules/errors/get-error-display';
import ContainerLoading from '@/ui-components/loading/container-loading';
import { useTranslation } from 'react-i18next';
import StickyNoteBar from '@/smart-components/sticky-note-bar';
import DataDisplay from '@/ui-components/data-display';
import { DateTime } from 'luxon';
import useFormConsts from 'hooks/useFormConsts';
import { getFormattedPhoneNumber } from '@/modules/widgets/render-widget-view';

export default function PatientInfoTab({ patientId }: { patientId: number }) {
  const { t } = useTranslation();
  const { isLoading, error, data, refetch } = useFetchProviderPatientById({
    patientId,
  });

  const { states, sexes, pronouns } = useFormConsts();

  if (isLoading) {
    return <ContainerLoading />;
  }
  if (error) return <GetErrorDislpay refetch={refetch} error={error} />;

  const patient = data.patient;

  return (
    <div className="py-4">
      <div className="flex flex-col justify-between">
        <div className="flex-1 flex flex-col">
          <div className="flex flex-row">
            <Section title={t('Overview')} sectionClassName="flex flex-row flex-wrap gap-8">
              <DataDisplay
                dataTestId="firstName-value"
                size="md"
                label={t('Legal first name')}
                content={patient.firstName ?? '-'}
              />
              <DataDisplay
                dataTestId="lastName-value"
                size="md"
                label={t('Legal last name')}
                content={patient.lastName ?? '-'}
              />
              <DataDisplay
                dataTestId="preferredName-value"
                size="md"
                label={t('Preferred name')}
                content={patient.preferredName ?? '-'}
              />
              <DataDisplay
                dataTestId="birthday-value"
                size="md"
                label={t('Birthday')}
                content={
                  patient.birthday
                    ? DateTime.fromFormat(patient.birthday, 'yyyy-LL-dd').toFormat('LL/dd/yyyy')
                    : '-'
                }
              />
              <DataDisplay
                dataTestId="sex-value"
                size="md"
                label={t('Sex')}
                content={patient.sex ? sexes.find((s) => s.value === patient.sex)?.label : '-'}
              />
              <DataDisplay
                dataTestId="pronouns-value"
                size="md"
                label={t('Pronouns')}
                content={
                  patient.pronouns ? pronouns.find((p) => p.value === patient.pronouns)?.label : '-'
                }
              />
              <DataDisplay
                size="xl"
                dataTestId="address1-value"
                label={t('Street address')}
                content={patient.address1 ?? '-'}
              />
              <DataDisplay
                dataTestId="city-value"
                size="md"
                label={t('City')}
                content={patient.city ?? '-'}
              />
              <DataDisplay
                dataTestId="state-value"
                size="md"
                label={t('State')}
                content={patient.state ? states.find((s) => s.value === patient.state)?.label : '-'}
              />
              <DataDisplay
                dataTestId="zipcode-value"
                size="md"
                label={t('Postal code')}
                content={patient.zipcode ?? '-'}
              />
            </Section>
            <div className="w-[32.5rem]">
              <StickyNoteBar patientId={patientId} />
            </div>
          </div>
          <SectionDivider />
          <Section title={t('Contact')}>
            <div className="flex gap-4 flex-wrap">
              <DataDisplay
                dataTestId="phone-value"
                size="xl"
                label={t('Phone number')}
                content={patient.phone ? getFormattedPhoneNumber(patient.phone) : '-'}
              />
              <DataDisplay
                dataTestId="email-value"
                size="xl"
                label={t('Email')}
                content={patient.email ?? '-'}
              />
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
