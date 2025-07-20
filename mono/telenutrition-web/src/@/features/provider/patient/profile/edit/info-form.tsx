import React from 'react';
import NonDashboardLayout from '@/layouts/non-dashboard';
import { FormV2, useForm } from '@/modules/form/form';
import { Button } from '@/ui-components/button';
import { PatientProfile } from '../util';
import { PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ButtonBar from '@/ui-components/button/group';
import type { PatientRecord } from '@mono/telenutrition/lib/types';
import { SectionDivider } from '@/ui-components/section';
import Breadcrumbs from '@/ui-components/breadcrumbs';
import { useTranslation } from 'react-i18next';
import useMemberHelpers from '@/modules/member/useMemberHelpers';
import {
  PatientEditContactFormFieldsSection,
  PatientEditOverviewFormFieldsSection,
} from '../patient-edit-form-sections';

export function TableWithAdd({ label, children }: { label: string; children: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <>
      <div className="flex flex-row items-center mb-2">
        {label}{' '}
        <Button variant="secondary" size="sm" className="ml-4">
          <PlusCircle size={16} /> {t('Add')}
        </Button>
      </div>
      {children}
    </>
  );
}

function getDefaultPhoneValue(phone?: string): string | undefined {
  if (!phone) return undefined;

  if (phone.slice(0, 2) === '+1') {
    return phone;
  }

  if (phone.slice(0, 1) === '1') {
    return `+${phone}`;
  }

  return `+1${phone}`;
}

interface InfoFormProps {
  patient: PatientRecord;
  onSubmit: (values: PatientProfile) => void;
}

export default function InfoForm({ patient, onSubmit }: InfoFormProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const memberHelpers = useMemberHelpers();
  const form = useForm<PatientProfile>({
    defaultValues: {
      firstName: patient.firstName,
      lastName: patient.lastName,
      preferredName: patient.preferredName,
      sex: patient.sex,
      pronouns: patient.pronouns,
      language: patient.language,
      religion: patient.religion,
      birthday: patient.birthday,
      phone: getDefaultPhoneValue(patient.phone) ?? '',
      email: patient.email ?? '',
      address1: patient.address1 ?? '',
      city: patient.city ?? '',
      state: patient.state ?? '',
      zipcode: patient.zipcode ?? '',
    },
  });

  function handleSubmit(values: PatientProfile) {
    if (!values.phone && !values.email) {
      form.setError('phone', { message: t('Phone or email is required') });
      form.setError('email', { message: t('Phone or email is required') });
      return;
    }
    onSubmit(values);
  }

  return (
    <FormV2 form={form} onSubmit={handleSubmit}>
      <NonDashboardLayout>
        <NonDashboardLayout.Header
          subTitle={
            <Breadcrumbs
              items={[
                { label: t('Member management'), link: '/schedule/provider/patients' },
                { label: memberHelpers.getDisplayNameForPatient(patient).value },
              ]}
            />
          }
        />
        <NonDashboardLayout.Content scrollable>
          <PatientEditOverviewFormFieldsSection form={form} />
          <SectionDivider />
          <PatientEditContactFormFieldsSection form={form} />
        </NonDashboardLayout.Content>
        <NonDashboardLayout.Footer>
          <ButtonBar className="w-full h-16 p-0 items-center">
            <ButtonBar.Group>
              <div />
            </ButtonBar.Group>
            <ButtonBar.Group>
              <Button
                onClick={() =>
                  router.push(`/schedule/provider/patient/${patient.patientId}/profile/view`)
                }
                variant="secondary"
              >
                {t('Cancel')}
              </Button>
              <Button type="submit" variant="primary">
                {t('Save and close')}
              </Button>
            </ButtonBar.Group>
          </ButtonBar>
        </NonDashboardLayout.Footer>
      </NonDashboardLayout>
    </FormV2>
  );
}
