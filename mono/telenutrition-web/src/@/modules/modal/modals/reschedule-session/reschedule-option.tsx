import Modal from '@/modules/modal/ui/modal';
import Section from '@/ui-components/section';
import RadioGroup from '@/ui-components/radio-and-checkbox/radio';
import { FormV2, useForm } from '@/modules/form/form';
import RadioGroupItemCard from '@/ui-components/radio-and-checkbox/radio/radio-group-item-card';
import { useModal } from '../..';
import { Trans, useTranslation } from 'react-i18next';
import { DateTime } from 'luxon';
import { AppointmentRecord } from 'api/types';
import { useFeatureFlags } from '@/modules/feature-flag';

export interface RescheduleOptionFields {
  rescheduleType: RescheduleTypeValue;
}

export enum RescheduleTypeValue {
  RESCHEDULE_WITH_ME = '1',
  RESCHEDULE_WITH_SOMEONE_ELSE = '2',
  RESCHEDULE_WITH_SOMEONE_ELSE_NO_SWAP = '3',
}

interface RescheduleOptionProps {
  rescheduleAppointment: AppointmentRecord;
  onSubmit: (values: RescheduleOptionFields) => void;
}

export default function RescheduleOption({
  onSubmit,
  rescheduleAppointment,
}: RescheduleOptionProps) {
  const form = useForm<RescheduleOptionFields>({
    defaultValues: {
      rescheduleType: RescheduleTypeValue.RESCHEDULE_WITH_ME,
    },
  });
  const modal = useModal();
  const { t } = useTranslation();
  const featureFlags = useFeatureFlags();

  const twoDaysFromNow = DateTime.now().endOf('day').plus({ days: 2 });

  const canSwap = DateTime.fromISO(rescheduleAppointment.startTimestamp) > twoDaysFromNow;

  return (
    <FormV2 form={form} onSubmit={onSubmit}>
      <Modal.Header title={<Trans>Reschedule Session</Trans>} />
      <Modal.Body>
        <Section title="Rescheduling Options">
          <RadioGroup
            rules={{ required: true }}
            form={form}
            id="rescheduleType"
            wrapperClassName="gap-y-4"
          >
            <RadioGroupItemCard
              dataTestId="reschedule-with-self-radio-button"
              value={RescheduleTypeValue.RESCHEDULE_WITH_ME}
              title={t('Reschedule with me')}
              description={t(
                'I would like to keep seeing the member, but need to change to a different date or time.',
              )}
            />
            {featureFlags.hasFeature('provider_reschedule_with_other_provider_DEV_17175') ? (
              <RadioGroupItemCard
                dataTestId="reschedule-with-other-no-swap-radio-button"
                value={RescheduleTypeValue.RESCHEDULE_WITH_SOMEONE_ELSE_NO_SWAP}
                title={t('Reschedule with someone else')}
                description={t(
                  'Allow the member to keep their scheduled session, but try to schedule it with a different provider.',
                )}
              />
            ) : (
              <RadioGroupItemCard
                dataTestId="reschedule-with-other-radio-button"
                value={RescheduleTypeValue.RESCHEDULE_WITH_SOMEONE_ELSE}
                title={t('Reschedule with someone else')}
                description={t(
                  'Allow the member to keep their scheduled session, but try to schedule it with a different provider.',
                )}
                disabled={!canSwap}
              />
            )}
          </RadioGroup>
        </Section>
      </Modal.Body>
      <Modal.Footer className="justify-end">
        <Modal.Footer.ButtonGroup>
          <Modal.Footer.SecondaryCloseButton
            onClick={() => {
              modal.openSecondary({
                type: 'basic-dialog',
                title: 'Discard changes?',
                body: t(
                  'Changes will not be saved. Are you sure you want to discard these changes?',
                ),
                theme: 'destructive',
                secondaryButton: {
                  text: t('Go back'),
                  onClick: modal.closeSecondary,
                },
                primaryButton: {
                  text: t('Discard'),
                  onClick: () => modal.closeAll(),
                },
              });
            }}
          >
            <Trans>Keep Session</Trans>
          </Modal.Footer.SecondaryCloseButton>
          <Modal.Footer.PrimaryButton>
            <Trans>Next</Trans>
          </Modal.Footer.PrimaryButton>
        </Modal.Footer.ButtonGroup>
      </Modal.Footer>
    </FormV2>
  );
}
