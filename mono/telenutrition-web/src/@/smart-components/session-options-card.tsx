import { FormV2, getSubform } from '@/modules/form/form';
import Card from '@/ui-components/card';
import { HouseholdMemberSchedulable } from 'api/types';
import { useEffect, useState } from 'react';
import { UseFormReturn, FieldValues } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { SessionDuration, SessionType } from 'types/globals';

export interface SessionOptionsCardFieldsBase {
  duration: SessionDuration;
  sessionType: SessionType;
  patient: HouseholdMemberSchedulable;
}

interface Props<T extends FieldValues>
{
  form: UseFormReturn<T & SessionOptionsCardFieldsBase>;
  force30MinuteDuration?: boolean;
}

export default function SessionOptionsCard<T extends FieldValues>({
  form: parentForm,
  force30MinuteDuration = false,
}: Props<T>) {
  const form = getSubform<SessionOptionsCardFieldsBase>(parentForm)
  
  const { t } = useTranslation();
  const [isDurationDisabled, setIsDurationDisabled] = useState(true);
  const [isSessionTypeDisabled, setIsSessionTypeDisabled] = useState(true);

  const patientWatch = form.watch('patient');

  useEffect(() => {
    if (force30MinuteDuration) {
      form.setValue('duration', SessionDuration.Thirty);
      setIsDurationDisabled(true);
    }
  }, [force30MinuteDuration]);

  useEffect(() => {
    const patient = patientWatch;
    if (patient) {
      // duration logic
      if (patient.schedulingInfo.validAppointmentDurations.length === 1) {
        const duration = patient.schedulingInfo.validAppointmentDurations[0];
        form.setValue(
          'duration',
          duration === 30 ? SessionDuration.Thirty : SessionDuration.Sixty,
          { shouldValidate: true },
        );
        !isDurationDisabled && setIsDurationDisabled(true);
      } else {
        // If both options are available, provider must choose duration
        form.resetField('duration');
        setIsDurationDisabled(false);
      }

      // session type logic
      if (!patient.schedulingInfo.canScheduleAudioOnly.canSchedule) {
        form.setValue('sessionType', SessionType.Video);
        setIsSessionTypeDisabled(true);
      } else {
        setIsSessionTypeDisabled(false);
        form.setValue(
          'sessionType',
          patient.schedulingInfo.canScheduleAudioOnly.defaultValue === true
            ? SessionType.AudioOnly
            : SessionType.Video,
          { shouldValidate: true },
        );
      }
    } else {
      setIsDurationDisabled(true);
      setIsSessionTypeDisabled(true);
      form.resetField('duration');
      form.resetField('sessionType');
    }
  }, [patientWatch]);

  return (
    <Card className="w-fit">
      <Card.Row>
        <Card.Row.Label className="w-32">
          <Trans>Session type</Trans>
        </Card.Row.Label>
        <Card.Row.Col className="px-2 py-1">
          <FormV2.FormButtonToggle
            dataTestId="session-type-button-toggle"
            id="sessionType"
            form={form}
            className="col-span-2 w-48"
            disabled={isSessionTypeDisabled}
            rules={{ required: true }}
            options={[
              { iconName: 'video', value: SessionType.Video },
              { iconName: 'video-off', value: SessionType.AudioOnly },
            ]}
          />
        </Card.Row.Col>
      </Card.Row>
      <Card.Row>
        <Card.Row.Label className="w-32">
          <Trans>Duration</Trans>
        </Card.Row.Label>
        <Card.Row.Col className="px-2 py-1">
          <FormV2.FormButtonToggle
            dataTestId="session-duration-button-toggle"
            id="duration"
            form={form}
            disabled={isDurationDisabled}
            className="col-span-2 w-48"
            rules={{ required: true }}
            options={[
              {
                name: t('60 min'),
                value: SessionDuration.Sixty,
              },
              {
                name: t('30 min'),
                value: SessionDuration.Thirty,
              },
            ]}
          />
        </Card.Row.Col>
      </Card.Row>
    </Card>
  );
}
