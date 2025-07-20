import React from 'react';

import { Trans, useTranslation } from 'react-i18next';
import Modal from '@/modules/modal/ui/modal';
import type { RadioGroupTieredQuestion } from '@mono/telenutrition/lib/types';
import Section from '@/ui-components/section';
import DataDisplay from '@/ui-components/data-display';
import { FormV2, useForm } from '@/modules/form/form';
import { useModal } from '@/modules/modal';
import useMemberHelpers from '@/modules/member/useMemberHelpers';
import RadioGroupV2 from '@/modules/form/radio-group-v2';
import { RescheduleSessionModalV2Data } from '@/modules/modal/types';
import { DeveloperError } from 'utils/errors';

enum ScheduleOption {
  SELF = 'SELF',
  OTHER = 'OTHER',
}

enum ScheduleOtherSubOption {
  KNOWN_PROVIDER = 'KNOWN_PROVIDER',
  ANY_OTHER_PROVIDER = 'ANY_OTHER_PROVIDER',
}

export const scheduleWith: RadioGroupTieredQuestion = {
  type: 'input:radio',
  key: 'nestedRadioWithOther',
  label: 'Schedule with self or other provider',
  options: [
    {
      type: 'basic',
      label: 'Myself',
      value: ScheduleOption.SELF,
    },
    {
      type: 'basic',
      label: 'A different provider',
      value: ScheduleOption.OTHER,
    },
  ],
  required: true,
};

interface RescheduleSessionFormFields {
  scheduleOption: ScheduleOption;
  scheduleOtherSubOption: ScheduleOtherSubOption;
}

export default function RescheduleSessionV2Modal({
  rescheduleAppointment,
}: RescheduleSessionModalV2Data) {
  const modal = useModal();
  const { t } = useTranslation();
  const form = useForm<RescheduleSessionFormFields>();
  const memberHelpers = useMemberHelpers();

  const patient = rescheduleAppointment.patient;

  if (!patient) {
    throw new DeveloperError(
      `Cannot reschedule an appointment that does not have a patient: ${JSON.stringify(rescheduleAppointment)}`,
    );
  }

  const patientDisplayName = memberHelpers.getDisplayNameForPatient(patient).value;

  const scheduleOptionWatch = form.watch('scheduleOption');

  function handleSubmit(values: RescheduleSessionFormFields) {
    if (!patient) {
      throw new DeveloperError(
        `Cannot reschedule an appointment that does not have a patient: ${JSON.stringify(rescheduleAppointment)}`,
      );
    }

    if (values.scheduleOption === ScheduleOption.SELF) {
      modal.openPrimary({
        type: 'reschedule-visit-self',
        patient,
        rescheduleAppointment,
      });
    } else if (values.scheduleOption === ScheduleOption.OTHER) {
      if (!values.scheduleOtherSubOption) {
        form.setError('scheduleOtherSubOption', { message: t('Required') });
        return;
      }
      if (values.scheduleOtherSubOption === ScheduleOtherSubOption.KNOWN_PROVIDER) {
        modal.openPrimary({
          type: 'reschedule-with-other-known',
          patient,
          rescheduleAppointment,
        });
      } else if (values.scheduleOtherSubOption === ScheduleOtherSubOption.ANY_OTHER_PROVIDER) {
        modal.openPrimary({
          type: 'reschedule-with-other-unknown',
          patient,
          rescheduleAppointment,
        });
      }
    }
  }

  return (
    <Modal size="lg">
      <FormV2 form={form} onSubmit={handleSubmit}>
        <Modal.Header title={<Trans>Rescheduling options</Trans>} />
        <Modal.Body>
          <Section title={t('Member')}>
            <DataDisplay label={t('Member')} content={<div>{patientDisplayName}</div>} />
          </Section>
          <Section.Divider />
          <Section title={t('Options')}>
            <div>
              <RadioGroupV2
                form={form}
                id="scheduleOption"
                label={<Trans>Reschedule with self or other provider</Trans>}
                options={[
                  {
                    label: t('Myself'),
                    value: ScheduleOption.SELF,
                  },
                  {
                    label: t('A different provider'),
                    value: ScheduleOption.OTHER,
                  },
                ]}
                rules={{ required: true }}
              />
              {scheduleOptionWatch === ScheduleOption.OTHER && (
                <div className="ml-4 mt-2">
                  <RadioGroupV2
                    form={form}
                    id="scheduleOtherSubOption"
                    options={[
                      {
                        label: t('I know what provider I want to schedule with'),
                        value: ScheduleOtherSubOption.KNOWN_PROVIDER,
                      },
                      {
                        label: t('I want to search for a provider based on availability'),
                        value: ScheduleOtherSubOption.ANY_OTHER_PROVIDER,
                      },
                    ]}
                  />
                </div>
              )}
            </div>
          </Section>
        </Modal.Body>
        <Modal.Footer className="justify-end">
          <Modal.Footer.ButtonGroup>
            <Modal.Footer.SecondaryCloseButton>{t('Cancel')}</Modal.Footer.SecondaryCloseButton>
            <Modal.Footer.PrimaryButton>{t('Next')}</Modal.Footer.PrimaryButton>
          </Modal.Footer.ButtonGroup>
        </Modal.Footer>
      </FormV2>
    </Modal>
  );
}
