import React from 'react';

import Section from '@/ui-components/section';
import { Trans, useTranslation } from 'react-i18next';
import DataDisplay from '@/ui-components/data-display';
import WeekSlotMultiPicker from '@/features/week-slot-multi-picker';
import useMemberHelpers from '@/modules/member/useMemberHelpers';
import Modal from '@/modules/modal/ui/modal';
import MultiStepForm from '@/modules/multi-step-form';
import { useModal } from '@/modules/modal';
import ContainerLoading from '@/ui-components/loading/container-loading';

import { AppointmentRecord, HouseholdMemberSchedulable } from 'api/types';

interface Props {
  patient: HouseholdMemberSchedulable;
  slots?: AppointmentRecord[];
  timezone: string;
}

export default function CalendarStep({ patient, slots, timezone }: Props) {
  const memberHelpers = useMemberHelpers();
  const { t } = useTranslation();
  const modal = useModal();
  if (!slots) return <ContainerLoading />;

  return (
    <>
      <Modal.Header title={<Trans>Schedule Visit</Trans>} />
      <Modal.Body>
        <Section title={<Trans>Member</Trans>}>
          <DataDisplay
            label={<Trans>Member</Trans>}
            content={memberHelpers.getDisplayNameForPatient(patient).value}
            footer={<div>{patient.patientId}</div>}
          />
        </Section>
        <Section.Divider />
        <WeekSlotMultiPicker
          providerAppointments={slots}
          providerTimezone={timezone}
          patient={patient}
        />
      </Modal.Body>
      <MultiStepForm.BasicFooter
        secondaryButton={{
          children: t('Cancel'),
          onClick: () => {
            modal.openSecondary({
              type: 'basic-dialog',
              title: t('Discard changes?'),
              body: t('Changes will not be saved. Are you sure you want to discard these changes?'),
              theme: 'destructive',
              secondaryButton: {
                text: t('Go back'),
                onClick: () => modal.closeSecondary(),
              },
              primaryButton: {
                text: t('Discard'),
                onClick: () => {
                  modal.closeAll();
                },
              },
            });
          },
        }}
      />
    </>
  );
}
