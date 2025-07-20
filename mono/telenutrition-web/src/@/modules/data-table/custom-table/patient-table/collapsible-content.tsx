import * as React from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/ui-components/button';
import DataDisplay from '@/ui-components/data-display';
import { RenderOverflowMenuItems } from '@/ui-components/dropdown-menu/overflow-menu';

import { HouseholdMemberSchedulable, HouseholdMemberWithSchedulingInfo } from 'api/types';
import { useFeatureFlags } from '@/modules/feature-flag';
import { Trans, useTranslation } from 'react-i18next';
import Section from '@/ui-components/section';
import { useModal } from '@/modules/modal';
import ChangeProviderModal from './change-provider-modal';
import useMemberHelpers from '@/modules/member/useMemberHelpers';
import {
  SplitButton,
  SplitButtonDropdownItem,
  SplitButtonItem,
} from '@/ui-components/button/split';
import Icon from '@/ui-components/icons/Icon';

interface PatientTableRowDetailProps {
  patient: HouseholdMemberWithSchedulingInfo;
}

export default function PatientTableRowDetail({ patient }: PatientTableRowDetailProps) {
  const router = useRouter();
  const featureFlags = useFeatureFlags();
  const { t } = useTranslation();
  const modal = useModal();
  const memberHelpers = useMemberHelpers();

  const openScheduleSessionModal = () => {
    modal.openPrimary({
      type: 'schedule-session-v2',
      patient: patient as HouseholdMemberSchedulable,
    });
  };

  const goToPatientInfo = () => {
    router.push(`/schedule/provider/patient/${patient.patientId}/profile/view`);
  };

  const gotoPatientEdit = () => {
    router.push(`/schedule/provider/patient/${patient.patientId}/profile/edit`);
  };

  const openChangeProviderModal = () => {
    modal.openPrimary({
      type: 'custom',
      modal: <ChangeProviderModal patient={patient} />,
    });
  };

  return (
    <div className="group w-full p-2 bg-white">
      {!patient.schedulingInfo.canSchedule &&
        (() => {
          const errorDisplay = memberHelpers.getErrorSchedulabilityDisplay(patient.schedulingInfo);
          return (
            <div
              data-testid="patient-unable-to-schedule-banner"
              className="bg-status-red-100 py-2 px-4 flex flex-col gap-y-2"
            >
              <p className="font-semibold">
                {errorDisplay.fullError && errorDisplay.fullError?.length > 1
                  ? t('This member cannot be scheduled because of multiple issues.')
                  : t('This member cannot be scheduled')}
              </p>
              {errorDisplay.fullError?.length == 1 ? (
                <p className="text-neutral-600">{errorDisplay.fullError?.[0]}</p>
              ) : (
                <ul className="text-neutral-600 list-disc pl-4">
                  {errorDisplay.fullError?.map((e) => <li key={e}>{e}</li>)}
                </ul>
              )}
            </div>
          );
        })()}
      <div className="flex flex-row w-full gap-4 pl-4">
        <Section title={<Trans>Member Overview</Trans>}>
          <div className="grid grid-cols-2 gap-y-8 gap-x-4 pb-8">
            <DataDisplay label={t('Sex')} content={memberHelpers.getDisplaySex(patient)} />
            <DataDisplay label={t('Birthday')} content={patient.birthday ?? '-'} />
            <DataDisplay label="Email" content={patient.email} />
            <DataDisplay label={t('Pronouns')} content={patient.pronouns ?? '-'} />
            <DataDisplay label={t('Phone number')} content={patient.phone} />
            <DataDisplay
              label={t('Address')}
              content={
                <div className="flex flex-col gap-y-2">
                  {memberHelpers.getDisplayAddressLines(patient).map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              }
            />
          </div>
        </Section>
      </div>

      <div className="flex gap-x-2 justify-end mt-4 items-center">
        {featureFlags.hasFeature('thorough_scheduling_flow_ENG_1629') &&
          patient.schedulingInfo.canSchedule && (
            <Button
              dataTestId="schedule-sessions-button"
              variant="tertiary"
              size="sm"
              onClick={openScheduleSessionModal}
            >
              <Icon name="calendar" /> <Trans>Schedule sessions</Trans>
            </Button>
          )}
        <SplitButton size="sm" variant="secondary">
          <SplitButtonItem onClick={goToPatientInfo}>
            <Trans>View member</Trans>
          </SplitButtonItem>
          <SplitButtonDropdownItem
            trigger={<Icon name="meatballs" />}
            content={
              <RenderOverflowMenuItems
                items={[
                  {
                    label: t('View member details...'),
                    onClick: goToPatientInfo,
                  },
                  {
                    label: t('Edit member details'),
                    onClick: gotoPatientEdit,
                  },
                  // ...(featureFlags.hasFeature('provider_reschedule_with_other_provider_DEV_17175')
                  //   ? ([
                  //       'separator',
                  //       {
                  //         label: t('Change provider'),
                  //         onClick: openChangeProviderModal,
                  //       },
                  //     ] as OverflowMenuItem[])
                  //   : []),
                ]}
              />
            }
          ></SplitButtonDropdownItem>
        </SplitButton>
      </div>
    </div>
  );
}
