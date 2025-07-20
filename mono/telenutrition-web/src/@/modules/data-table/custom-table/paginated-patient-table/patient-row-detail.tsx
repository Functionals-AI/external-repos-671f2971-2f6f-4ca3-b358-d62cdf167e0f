import Section from '../../../../ui-components/section';
import DataDisplay from '../../../../ui-components/data-display';
import { Trans, useTranslation } from 'react-i18next';
import {
  HouseholdMemberSchedulable,
  HouseholdMemberSchedulableInfo,
  HouseholdMemberWithSchedulingInfo,
  PatientPaymentMethod,
} from 'api/types';
import useMemberHelpers from '../../../member/useMemberHelpers';
import { Button } from '../../../../ui-components/button';
import Icon from '../../../../ui-components/icons/Icon';
import {
  SplitButton,
  SplitButtonDropdownItem,
  SplitButtonItem,
} from '../../../../ui-components/button/split';
import { RenderOverflowMenuItems } from '../../../../ui-components/dropdown-menu/overflow-menu';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useModal } from '../../../modal';
import CoverageCard from '@/smart-components/account-info/coverage-card';

interface Props {
  patient: HouseholdMemberWithSchedulingInfo;
}

export default function PatientRowDetail({ patient }: Props) {
  const { t } = useTranslation();
  const memberHelpers = useMemberHelpers();
  const router = useRouter();
  const modal = useModal();

  const goToPatientInfo = () => {
    router.push(`/schedule/provider/patient/${patient.patientId}/profile/view`);
  };

  const gotoPatientEdit = () => {
    router.push(`/schedule/provider/patient/${patient.patientId}/profile/edit`);
  };
  const goToScheduleSession = () => {
    modal.openPrimary({
      type: 'schedule-session-v2',
      patient: patient as HouseholdMemberSchedulable,
    });
  };

  const displayAddress = memberHelpers.getDisplayAddressLines(patient);

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

      <Section title={t('Contact Information')}>
        <DataDisplay
          label={t('Phone number')}
          content={patient.phone ?? '-'}
          className="col-span-3"
        />
        <DataDisplay label={t('Email')} content={patient.email ?? '-'} className="col-span-3" />
        <DataDisplay
          label={t('Address')}
          content={
            displayAddress.length ? (
              <div className="flex flex-col gap-y-1">
                {displayAddress.map((addrLine) => (
                  <p key={addrLine}>{addrLine}</p>
                ))}
              </div>
            ) : (
              '-'
            )
          }
          className="col-span-3"
        />
        {/* <DataDisplay label={t('Household account')} content="" className="col-span-3" /> */}
      </Section>
      {patient.schedulingInfo.canSchedule && (
        <>
          <Section.Divider />
          <InsuranceCoverageSection schedulingInfo={patient.schedulingInfo} />
        </>
      )}
      <div className="flex gap-x-2 justify-end mt-4 items-center">
        <Button
          dataTestId="schedule-sessions-button"
          variant="tertiary"
          size="sm"
          onClick={goToScheduleSession}
        >
          <Icon name="calendar" /> <Trans>Schedule sessions</Trans>
        </Button>

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
                ]}
              />
            }
          ></SplitButtonDropdownItem>
        </SplitButton>
      </div>
    </div>
  );
}

function InsuranceCoverageSection({
  schedulingInfo,
}: {
  schedulingInfo: HouseholdMemberSchedulableInfo;
}) {
  const { t } = useTranslation();

  const otherCoverages: PatientPaymentMethod[] = schedulingInfo.patientPaymentMethods.filter(
    (ppm) => ppm.id !== schedulingInfo.defaultPaymentMethod.id,
  );

  return (
    <Section title={t('Insurance coverage')}>
      <CoverageCard
        dataTestId="selected-coverage-card"
        showInfo
        isPrimary
        paymentMethod={schedulingInfo.defaultPaymentMethod}
      />
      {otherCoverages.map((pm) => (
        <CoverageCard dataTestId="other-coverage-card" key={pm.id} paymentMethod={pm} />
      ))}
    </Section>
  );
}
