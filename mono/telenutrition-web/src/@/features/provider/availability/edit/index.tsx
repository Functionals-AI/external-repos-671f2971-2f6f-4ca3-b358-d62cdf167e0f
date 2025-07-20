'use client';

import useToaster from 'hooks/useToaster';
import { useRouter } from 'next/navigation';

import NonDashboardLayout from '@/layouts/non-dashboard';
import { useModal } from '@/modules/modal';
import MultiStepForm, { useMultiStepForm } from '@/modules/multi-step-form';

import * as Steps from './steps';
import { GeneralSettingsFields } from './steps/general-settings';
import { SetBaseScheduleFields } from './steps/set-base-schedule';
import { useFetchProviderTimezone } from 'api/provider/useGetProviderTimezone';
import { useTranslation } from 'react-i18next';
import GetErrorDislpay from '@/modules/errors/get-error-display';
import ContainerLoading from '@/ui-components/loading/container-loading';
import Breadcrumbs from '@/ui-components/breadcrumbs';

export type EditAvailabilityFields = GeneralSettingsFields & SetBaseScheduleFields;

export default function EditAvailabilityWrapper() {
  const { data, isLoading, error, refetch } = useFetchProviderTimezone();
  if (isLoading) return <ContainerLoading />;
  if (error) return <GetErrorDislpay refetch={refetch} error={error} />;
  return <EditAvailability providerTimezone={data.timezone} />;
}

function EditAvailability({ providerTimezone }: { providerTimezone: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const modal = useModal();

  const toaster = useToaster();

  const multiStepFormData = useMultiStepForm<EditAvailabilityFields>({
    defaultValues: {
      holidays: [],
      baseWorkingDays: {},
      breaks: [],
      availability: {},
    },
    onComplete: (values) => {
      console.log('VALUES:', values);
      toaster.success({
        title: t('Success!'),
        message: JSON.stringify(values),
      });
      router.push('/schedule/provider/profile');
    },
    steps: [
      {
        name: t('General settings'),
        render: () => <Steps.GeneralSettings />,
      },
      {
        name: t('Set base schedule'),
        render: () => <Steps.SetBaseSchedule />,
      },
      {
        name: t('Customize by month'),
        render: () => <Steps.CustomizeByMonth providerTimezone={providerTimezone} />,
      },
      {
        name: t('Review'),
        render: () => <Steps.Review providerTimezone={providerTimezone} />,
      },
    ],
  });

  return (
    <MultiStepForm {...multiStepFormData}>
      <NonDashboardLayout>
        <NonDashboardLayout.Header
          subTitle={
            <Breadcrumbs
              items={[
                { label: t('My profile'), link: '/schedule/provider/profile' },
                { label: t('Set availability') },
              ]}
            />
          }
          rightHeader={
            <div className="w-[20rem]">
              <MultiStepForm.StepBar showStepText={false} />
            </div>
          }
        />
        <NonDashboardLayout.Content>
          <div className="overflow-y-scroll">
            <MultiStepForm.Step />
          </div>
        </NonDashboardLayout.Content>
        <NonDashboardLayout.Footer>
          <MultiStepForm.BasicFooter
            secondaryButton={{
              children: t('Cancel'),
              variant: 'secondary',
              onClick: () => {
                modal.openPrimary({
                  type: 'basic-dialog',
                  title: t('Discard changes?'),
                  body: t(
                    'Changes will not be saved. Are you sure you want to discard these changes?',
                  ),
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
              },
            }}
          />
        </NonDashboardLayout.Footer>
      </NonDashboardLayout>
    </MultiStepForm>
  );
}
