'use client';

import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';

import NonDashboardLayout from '@/layouts/non-dashboard';
import { Avatar, AvatarFallback, AvatarImage } from '@/ui-components/avatar';
import { Button } from '@/ui-components/button';
import ButtonBar from '@/ui-components/button/group';
import Section from '@/ui-components/section';
import TextArea from '@/ui-components/text-area';
import Container from '@/ui-components/container';
import Breadcrumbs from '@/ui-components/breadcrumbs';
import DataDisplay from '@/ui-components/data-display';
import { useModal } from '@/modules/modal';
import { FormV2, useForm } from '@/modules/form/form';
import FormTagInputItemV2 from '@/modules/form/form-tag-input-item-v2';
import type { ProviderRecord, ProviderTimezone } from '@mono/telenutrition/lib/types';
import { useProviderContext } from 'app/schedule/provider/provider-context';
import usePatchProviderProfile from 'api/provider/usePatchProviderProfile';
import useToaster from 'hooks/useToaster';

import useProviderFormConsts from '../useProviderFormConsts';

type ProviderProfileEditFormFields = Pick<
  ProviderRecord,
  'languages' | 'specialtyIds' | 'timezone' | 'bio'
> & {
  // form option input requires string
  minPatientAge?: string;
};

const providerTimezones: ProviderTimezone[] = [
  'America/Puerto_Rico',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Juneau',
  'America/Phoenix',
  'Pacific/Honolulu',
];

export default function ProviderProfileEditFeature() {
  const { t } = useTranslation();
  const {
    providerData: { provider },
  } = useProviderContext();
  const router = useRouter();
  const modal = useModal();
  const toast = useToaster();
  const formConsts = useProviderFormConsts();

  const form = useForm<ProviderProfileEditFormFields>({
    defaultValues: {
      languages: provider.languages,
      specialtyIds: provider.specialtyIds,
      timezone: provider.timezone,
      bio: provider.bio,
      minPatientAge: provider.minPatientAge.toString(),
    },
  });

  const { post: patchProviderProfile } = usePatchProviderProfile();

  async function onSubmit(values: ProviderProfileEditFormFields) {
    try {
      await patchProviderProfile({
        payload: {
          ...values,
          minPatientAge: values.minPatientAge === '' ? 14 : Number(values.minPatientAge),
        },
      });
      toast.success({
        title: t('Successfully updated!'),
        message: t('Provider information has been updated successfully!'),
      });
      router.push('/schedule/provider/profile');
    } catch (e) {
      toast.apiError({ title: t('Failed to update provider'), error: e });
    }
  }

  function onCancel() {
    modal.openPrimary({
      type: 'basic-dialog',
      title: t('Discard changes?'),
      body: t('Changes will not be saved. Are you sure you want to discard these changes?'),
      theme: 'destructive',
      secondaryButton: {
        text: t('Go back'),
        onClick: () => modal.closeAll(),
      },
      primaryButton: {
        text: t('Discard'),
        onClick: () => {
          modal.closeAll();
          router.push('/schedule/provider/profile');
        },
      },
    });
  }

  return (
    <Container>
      <FormV2 form={form} onSubmit={onSubmit}>
        <NonDashboardLayout>
          <NonDashboardLayout.Header
            subTitle={
              <Breadcrumbs
                items={[
                  { label: t('My profile'), link: '/schedule/provider/profile' },
                  { label: t('Edit Profile'), link: '/schedule/provider/profile/edit' },
                ]}
              />
            }
          ></NonDashboardLayout.Header>
          <NonDashboardLayout.Content scrollable>
            <Section title={t('Profile picture')}>
              <Row>
                <Avatar className="w-32 h-32">
                  <AvatarImage src={provider.photo} />
                  <AvatarFallback>{provider.initials}</AvatarFallback>
                </Avatar>
              </Row>
            </Section>
            <Section.Divider />
            <Section
              title={t('Professional Details')}
              subtitle={t('These details are visible to members.')}
            >
              <div className="flex flex-col gap-y-4 w-96">
                <Row>
                  <DataDisplay
                    label={t('First name')}
                    content={provider.firstName ?? '-'}
                    size={'xl'}
                    className="col-span-2"
                  />
                  <DataDisplay
                    label={t('Last name')}
                    content={provider.lastName ?? '-'}
                    size={'md'}
                  />
                </Row>
                <Row>
                  <DataDisplay label="NPI" content={provider.npi ?? '-'} size={'md'} />
                </Row>
                <Row>
                  <DataDisplay label={t('Phone')} content={provider.homePhone ?? '-'} size={'md'} />
                </Row>
                <Row>
                  <DataDisplay label={t('Email')} content={provider.email ?? '-'} size={'md'} />
                </Row>
                <Row>
                  <FormV2.FormSelectItem
                    className="w-full"
                    form={form}
                    id="timezone"
                    options={providerTimezones.map((tz) => ({ value: tz, label: tz }))}
                    label={t('Timezone')}
                  />
                </Row>
                <Row>
                  <FormTagInputItemV2
                    id="languages"
                    form={form}
                    className="w-full"
                    inputLabel={t('Languages')}
                    options={Object.entries(formConsts.languages).map(([value, label]) => ({
                      value,
                      label,
                    }))}
                  />
                </Row>
                <Row>
                  <FormV2.FormSelectItem
                    id="minPatientAge"
                    form={form}
                    label={t('Pediatrics')}
                    options={Object.entries(formConsts.minPatientAge).map(([value, label]) => ({
                      value,
                      label,
                    }))}
                  />
                </Row>
                <Row>
                  <FormTagInputItemV2
                    className="w-full"
                    form={form}
                    id="specialtyIds"
                    inputLabel={t('Specialty areas')}
                    options={Object.entries(formConsts.specialtyIds).map(([value, label]) => ({
                      value,
                      label,
                    }))}
                  />
                </Row>
                <Row>
                  <TextArea id="bio" className="w-full" label={t('Biography')} form={form} />
                </Row>
              </div>
            </Section>
          </NonDashboardLayout.Content>
          <NonDashboardLayout.Footer>
            <ButtonBar borderTop className="w-full h-16 p-0 items-center justify-end">
              <ButtonBar.Group>
                <Button onClick={onCancel} variant="secondary">
                  {t('Cancel')}
                </Button>
                <Button type="submit">{t('Save changes')}</Button>
              </ButtonBar.Group>
            </ButtonBar>
          </NonDashboardLayout.Footer>
        </NonDashboardLayout>
      </FormV2>
    </Container>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-x-4 w-full">{children}</div>;
}
